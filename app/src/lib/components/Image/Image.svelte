<script lang="ts">
	import type { Image } from '@cms/payload-types'

	// The breakpoints that Images.ts can generate, in ascending width order.
	// Each breakpoint has both @1x and @2x (DPR) variants.
	// Only variants that were actually generated (i.e. the source image was wide enough)
	// will have a non-null filename in `image.sizes`.
	const BREAKPOINTS = [
		{ name: 'xs', width: 480 },
		{ name: 'sm', width: 768 },
		{ name: 'md', width: 1024 },
		{ name: 'lg', width: 1440 },
		{ name: 'xl', width: 2048 },
	] as const

	// CSS media query sizes based on breakpoints
	const SIZES = `
		(max-width: 480px) 100vw,
		(max-width: 768px) 100vw,
		(max-width: 1024px) 90vw,
		(max-width: 1440px) 85vw,
		1200px
	`

	interface Props {
		image: Image
		/** Passed through to <img> class. */
		class?: string
		/** Override loading strategy. Defaults to 'lazy'. */
		loading?: 'lazy' | 'eager'
		/** Override fetchpriority. Useful for LCP images. */
		fetchpriority?: 'high' | 'low' | 'auto'
	}

	let {
		image,
		class: className = '',
		loading = 'lazy',
		fetchpriority = 'auto',
	}: Props = $props()

	// Convert Payload API URL to direct static file path
	// /api/images/file/filename.webp → /media/images/filename.webp
	function toStaticPath(url: string | null | undefined): string | null {
		if (!url) return null
		// If it's already a static path, return as-is
		if (url.startsWith('/media/')) return url
		// Extract filename from API URL: /api/images/file/filename.webp
		const match = url.match(/\/file\/(.+)$/)
		if (match) {
			return `/media/images/${match[1]}`
		}
		return url
	}

	// Build a srcset string for a given format from all available variants
	// Includes both @1x and @2x (DPR) variants
	function srcset(format: 'webp' | 'avif'): string {
		const variants: string[] = []

		// Collect all available variants (@1x and @2x)
		for (const { name } of BREAKPOINTS) {
			// @1x variant
			const variant1x = image.sizes?.[`${name}-${format}`]
			if (variant1x?.url) {
				const staticPath = toStaticPath(variant1x.url)
				if (staticPath) {
					variants.push(`${staticPath} ${variant1x.width ?? name}w`)
				}
			}

			// @2x variant
			const variant2x = image.sizes?.[`${name}-2x-${format}`]
			if (variant2x?.url) {
				const staticPath = toStaticPath(variant2x.url)
				if (staticPath) {
					// For @2x variants, use the actual width with 2x descriptor
					variants.push(`${staticPath} ${variant2x.width ?? 'unknown'}w`)
				}
			}
		}

		return variants.join(', ')
	}

	const avifSrcset = srcset('avif')
	const webpSrcset = srcset('webp')

	// Fallback <img> src: smallest available webp variant
	const fallbackSrc = BREAKPOINTS.reduce<string | null>((found, { name }) => {
		if (found) return found
		const variant = image.sizes?.[`${name}-webp`]
		if (variant?.url) {
			return toStaticPath(variant.url)
		}
		return null
	}, null)

	// Intrinsic dimensions from the smallest generated size, for aspect-ratio hints
	const intrinsicVariant = BREAKPOINTS.reduce<{ width: number | null; height: number | null }>(
		(found, { name }) => {
			if (found.width) return found
			const v = image.sizes?.[`${name}-webp`]
			if (v?.width && v?.height) return { width: v.width, height: v.height }
			return found
		},
		{ width: null, height: null },
	)
</script>

<!--
  Renders a responsive <picture> element using the webp/avif variants generated
  by the CMS. Includes both @1x and @2x (DPR) variants for high-resolution displays.
  The browser picks the smallest variant that fills its display slot based on the
  predefined breakpoint sizes.

  Usage:
    <Image {image} />
    <Image {image} loading="eager" fetchpriority="high" />  ← for LCP images
-->
<picture>
	{#if avifSrcset}
		<source type="image/avif" srcset={avifSrcset} sizes={SIZES} />
	{/if}
	{#if webpSrcset}
		<source type="image/webp" srcset={webpSrcset} sizes={SIZES} />
	{/if}
	<img
		src={fallbackSrc ?? ''}
		alt={image.alt}
		width={intrinsicVariant.width ?? undefined}
		height={intrinsicVariant.height ?? undefined}
		class={className}
		{loading}
		{fetchpriority}
	/>
</picture>
