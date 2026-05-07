<script lang="ts">
	import type { Page, Image } from '@cms/payload-types'
	import PageCard from '$lib/components/PageCard/PageCard.svelte'
	import '$lib/styles/general.css'
	interface pageData {
		users: {
			email: string
		}[]
		images: Image[]
		pages: Page[]
	}
	let { data }: { data: pageData } = $props()
</script>

<h1>Users</h1>
<ul>
	{#each data.users as user}
		<li>{user.email}</li>
	{/each}
</ul>

<h1>Pages</h1>
<div class="pages-grid">
	{#each data.pages as page}
		<PageCard {page} />
	{/each}
</div>

<style>
	.pages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
		margin-top: 24px;
	}
</style>
