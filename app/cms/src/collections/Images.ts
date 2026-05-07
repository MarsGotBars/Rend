import path from 'path'
import fs from 'fs/promises'
import type { CollectionConfig } from 'payload'

// process.cwd() is the repo root (the CMS dev script is run from there).
const staticDir = path.resolve(process.cwd(), 'static/media/images')

// Breakpoints covering mobile → 2K.
// Each breakpoint is produced in both webp and avif so the frontend can use
// <picture> with <source type="image/avif"> falling back to webp.
const breakpoints = [
	{ name: 'xs', width: 480 },  // small mobile
	{ name: 'sm', width: 768 },  // mobile / large phone
	{ name: 'md', width: 1024 }, // tablet / small desktop
	{ name: 'lg', width: 1440 }, // desktop
	{ name: 'xl', width: 2048 }, // 2K
] as const

// Build the imageSizes array: for every breakpoint produce a webp and an avif variant,
// plus @2x variants for high-DPR displays (e.g., Retina).
const imageSizes = [
	...breakpoints.flatMap(({ name, width }) =>
		(['webp', 'avif'] as const).map((format) => ({
			name: `${name}-${format}` as string,
			width,
			height: undefined as number | undefined,
			formatOptions: {
				format,
				options: format === 'avif'
					? { quality: 60, effort: 4 }
					: { quality: 80 },
			},
			generateImageName: ({
				originalName,
				sizeName,
				extension,
			}: {
				originalName: string
				sizeName: string
				extension: string
			}) => {
				const base = originalName.replace(/\.[^.]+$/, '')
				const sizeOnly = sizeName.replace(/-(?:webp|avif)$/, '')
				return `${base}-${sizeOnly}.${extension}`
			},
		}))
	),
	// Add @2x (DPR 2x) variants for high-resolution displays
	...breakpoints.flatMap(({ name, width }) =>
		(['webp', 'avif'] as const).map((format) => {
			const bpName = name // Capture in closure
			return {
				name: `${name}-2x-${format}` as string,
				width: width * 2,
				height: undefined as number | undefined,
				formatOptions: {
					format,
					options: format === 'avif'
						? { quality: 60, effort: 4 }
						: { quality: 80 },
				},
				generateImageName: ({
					originalName,
					extension,
				}: {
					originalName: string
					sizeName: string
					extension: string
				}) => {
					const base = originalName.replace(/\.[^.]+$/, '')
					return `${base}-${bpName}-2x.${extension}`
				},
			}
		})
	),
]

export const Images: CollectionConfig = {
	slug: 'images',
	admin: {		
		defaultColumns: ['filename', 'name', 'alt', 'filesize'],
	},
	upload: {
		staticDir,
		// A no-op resizeOptions ensures Sharp loads the file before createImageSizes runs.
		resizeOptions: { withoutEnlargement: true },
		adminThumbnail: 'xs-webp',
		imageSizes,
		mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
		crop: true,
		focalPoint: true,
	},
	access: {
		read: () => true,
	},
	hooks: {
		beforeOperation: [
			async ({ operation }) => {
				if (operation !== 'create') return
				await fs.mkdir(staticDir, { recursive: true })
			},
		],
		beforeChange: [
			async ({ data, operation }) => {
				// This hook runs before file processing, so we can't access sizes yet
				// Just ensure directory exists for both create and update
				if (operation === 'create' || operation === 'update') {
					await fs.mkdir(staticDir, { recursive: true })
				}
			},
		],
		afterOperation: [
			async ({ operation, result, req }) => {
				if (operation !== 'create' && operation !== 'update' && operation !== 'updateByID') return result

				const filename = result?.filename as string | undefined
				if (!filename) return result

				console.log(`[Images] ${operation} - Processing: ${filename}`)

				// Delete the original uploaded file — only the sized variants are served.
				const originalPath = path.join(staticDir, filename)
				await fs.unlink(originalPath).catch(() => { /* already gone */ })
				console.log(`[Images] Deleted original: ${filename}`)

				const sourceWidth = result?.width as number | undefined
				const sourceHeight = result?.height as number | undefined
				const sizes = result?.sizes as Record<string, { filename?: string | null; width?: number | null; height?: number | null }> | undefined

				const nulledSizes: Record<string, null> = {}
				const dprThreshold = 1.2

				// Clean up variants according to variant strategy:
				// 1. Keep only @1x variants smaller than original (no upsampling)
				// 2. Keep @2x variants only if they're < 1.2x original
				// 3. Delete exact duplicates
				if (sizes && sourceWidth && sourceHeight) {
					await Promise.all(
						Object.entries(sizes).map(async ([sizeName, size]) => {
							if (!size?.filename) return
							// Always keep the xs sizes — xs-webp is the adminThumbnail.
							if (sizeName === 'xs-webp' || sizeName === 'xs-avif') return

							const variantWidth = size.width || 0

							// Delete if:
							// 1. Variant matches original dimensions (duplicate)
							// 2. @1x variant would upsample (larger than original)
							// 3. @2x variant exceeds 120% of original
							const isExactMatch = variantWidth === sourceWidth && size.height === sourceHeight
							const is1xUpsample = !sizeName.includes('2x') && variantWidth > sourceWidth
							const is2xExceedsThreshold = sizeName.includes('2x') && variantWidth >= sourceWidth * dprThreshold

							if (isExactMatch || is1xUpsample || is2xExceedsThreshold) {
								await fs.unlink(path.join(staticDir, size.filename)).catch(() => { })
								nulledSizes[sizeName] = null
								console.log(`[Images] Deleted variant: ${sizeName}`)
							}
						})
					)
				}

				// Store the base filename (without extension) as the display name.
				// Set filename to xs-webp since that's what adminThumbnail uses.
				// Update mimetype and filesize to reflect the webp variant, not the original.
				const baseName = filename.replace(/\.[^.]+$/, '')
				const sizes_obj = result?.sizes as Record<string, { filename?: string; width?: number; height?: number }> | undefined
				const xsWebpFilename = sizes_obj?.['xs-webp']?.filename

				console.log(`[Images] xs-webp filename: ${xsWebpFilename}`)

				// Get actual file stats from xs-webp file for accurate metadata
				let updateData: any = {
					filename: xsWebpFilename || filename,
					name: baseName,
					...(Object.keys(nulledSizes).length > 0 ? { sizes: nulledSizes } : {}),
				}

				if (xsWebpFilename) {
					try {
						const xsWebpPath = path.join(staticDir, xsWebpFilename)
						const stats = await fs.stat(xsWebpPath)
						updateData.filesize = stats.size
						updateData.mimeType = 'image/webp'
						console.log(`[Images] Updated metadata - size: ${stats.size}, type: image/webp`)
					} catch (err) {
						console.log(`[Images] Error reading xs-webp file:`, err)
					}
				}

				console.log(`[Images] Updating database with:`, updateData)
				await req.payload.db.updateOne({
					collection: 'images',
					data: updateData,
					req,
					where: { id: { equals: result.id } },
				})

				// Return merged result with updated data so admin UI shows correct values immediately
				return {
					...result,
					...updateData,
				}
			},
		],
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			admin: {
				hidden: true,
			},
		},
		{
			name: 'alt',
			type: 'text',
			required: true,
		},
	],
}
