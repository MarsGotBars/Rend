import path from 'path'
import fs from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { CollectionConfig } from 'payload'

const execFileAsync = promisify(execFile)
const staticDir = path.resolve(process.cwd(), 'static/videos')

// Verify ffmpeg is available on startup and log a clear warning if not.
// The hook will skip conversion gracefully if ffmpeg is missing, but the gif
// will remain on disk unconverted.
execFileAsync('ffmpeg', ['-version']).catch(() => {
	console.warn(
		'[Videos] ffmpeg not found in PATH. GIF → MP4 conversion will be skipped.\n' +
		'Install ffmpeg: https://ffmpeg.org/download.html'
	)
})

async function convertGifToMp4(gifPath: string, mp4Path: string): Promise<void> {
	// Two-pass approach:
	//   1. scale to even dimensions (required by libx264)
	//   2. yuv420p pixel format for broad browser compatibility
	//   3. movflags faststart moves the moov atom to the front for streaming
	await execFileAsync('ffmpeg', [
		'-i', gifPath,
		'-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
		'-c:v', 'libx264',
		'-pix_fmt', 'yuv420p',
		'-movflags', 'faststart',
		'-an', // strip audio (gifs have none)
		'-y',  // overwrite output if it exists
		mp4Path,
	])
}

export const Videos: CollectionConfig = {
	slug: 'videos',
	upload: {
		staticDir,
		mimeTypes: ['video/mp4', 'image/gif'],
		// No Sharp imageSizes — videos are not processed by Sharp.
		// The admin thumbnail falls back to a function so we can show the mp4
		// filename; Payload can't generate image thumbs for video files.
		adminThumbnail: ({ doc }: { doc: Record<string, unknown> }) => {
			const filename = doc.filename as string | undefined
			return filename ? `/videos/${filename}` : ''
		},
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
		afterOperation: [
			async ({ operation, result }) => {
				if (operation !== 'create' && operation !== 'update') return

				const filename = result?.filename as string | undefined
				const mimeType = result?.mimeType as string | undefined
				if (!filename || mimeType !== 'image/gif') return

				const gifPath = path.join(staticDir, filename)
				const mp4Filename = filename.replace(/\.gif$/i, '.mp4')
				const mp4Path = path.join(staticDir, mp4Filename)

				try {
					await convertGifToMp4(gifPath, mp4Path)
					await fs.unlink(gifPath)
					console.log(`[Videos] Converted ${filename} → ${mp4Filename}`)
				} catch (err) {
					console.error(`[Videos] GIF → MP4 conversion failed for ${filename}:`, err)
					// Leave the gif on disk so the upload isn't silently lost.
				}
			},
		],
	},
	fields: [
		{
			name: 'alt',
			label: 'Description',
			type: 'text',
			required: true,
		},
	],
}
