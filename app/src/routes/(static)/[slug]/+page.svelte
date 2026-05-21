<script lang="ts">
	import '$lib/styles/general.css'
	import CmsImage from '$lib/components/Image/Image.svelte'
	import type { Page, Image } from '@cms/payload-types'

	interface PageData {
		page: Page
		images: Image[]
	}

	let { data }: { data: PageData } = $props()
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<article>
	<header>
		<h1>{data.page.title}</h1>
		<p>{data.page.description}</p>
	</header>

	{#if data.images.length > 0}
		<section>
			{#each data.images as image}
				<CmsImage {image} />
			{/each}
		</section>
	{/if}
</article>
