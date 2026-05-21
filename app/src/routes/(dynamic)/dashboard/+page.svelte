<script lang="ts">
	import '$lib/styles/general.css'

	// Example SSR page - rendered fresh on every request
	// Useful for: authenticated content, real-time dashboards, user-specific data

	let { data } = $props()
</script>

<svelte:head>
	<title>Dashboard (SSR Example)</title>
</svelte:head>

<article>
	<header>
		<h1>Dashboard</h1>
		<p>This page is server-rendered on every request (not static/prerendered).</p>
		<small>Generated at: {data.generatedAt}</small>
	</header>

	<section>
		<h2>Recently Updated Pages</h2>
		{#if data.pages.length > 0}
			<ul>
				{#each data.pages as page}
					<li>
						<a href="/{page.slug}">{page.title}</a>
						<span> &mdash; {page.description}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No pages found.</p>
		{/if}
	</section>
</article>
