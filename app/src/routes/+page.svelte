<!-- /apps/src/routes/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import '$lib/styles/general.css'
  let {data}: {data: PageData} = $props();
</script>

<h2>Users</h2>
<ul>
  {#each data.users as user}
    <li>{user.email}</li>
  {/each}
</ul>