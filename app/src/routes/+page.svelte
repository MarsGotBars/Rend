<script lang="ts">
	import '$lib/styles/general.css';
	interface pageData {
		users: {
			email: string;
		}[];
		media: {
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

	{#each data.media as item}
		<li>{item.title}</li>
		<img src={`http://localhost:3000/${item.url}`} alt={item.title} />
	{/each}
</ul>
