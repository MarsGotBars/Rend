<script lang="ts">
	import '$lib/styles/general.css';
	interface pageData {
		users: {
			email: string;
		}[];
		images: {
			title: string;
			url: string;
		}[];
	}
	let { data }: { data: pageData } = $props();
</script>

<h1>Users</h1>
<ul>
	{#each data.users as user}
		<li>{user.email}</li>
	{/each}

	{#each data.images as item}
		<li>{item.title}</li>
		<img src={item.url} alt={item.title} />
	{/each}
</ul>
