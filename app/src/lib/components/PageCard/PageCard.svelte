<script lang="ts">
	import type { Page } from '@cms/payload-types'
	import CmsImage from '$lib/components/Image/Image.svelte'

	interface Props {
		page: Page
	}

	let { page }: Props = $props()

	// Get the thumbnail image - either from thumbImage or first image in images array
	const thumbnailImage = (() => {
		if (page.thumbImage && typeof page.thumbImage === 'object') {
			return page.thumbImage
		}
		if (page.images && page.images.length > 0) {
			const firstImage = page.images[0]
			if (typeof firstImage === 'object') {
				return firstImage
			}
		}
		return null
	})()
</script>

<a href="/{page.slug}" class="card">
	<div class="card__image">
		{#if thumbnailImage}
			<CmsImage image={thumbnailImage} loading="lazy" />
		{:else}
			<div class="card__image--placeholder">No image</div>
		{/if}
	</div>
	<div class="card__content">
		<h3>{page.title}</h3>
		<p>{page.description}</p>
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.card__image {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #f0f0f0;
	}

	.card__image--placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #e0e0e0;
		color: #999;
		font-size: 14px;
	}

	.card__image :global(picture),
	.card__image :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.card__content {
		padding: 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.card__content h3 {
		margin: 0 0 8px 0;
		font-size: 18px;
		font-weight: 600;
		line-height: 1.3;
	}

	.card__content p {
		margin: 0;
		font-size: 14px;
		color: #666;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
