import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
    adapter: adapter(),
    files: {
      // Point SvelteKit to your nested folder structure
      appTemplate: 'app/src/app.html',      // Fixes the "app.html does not exist" error
      errorTemplate: 'app/src/error.html',
      assets: 'static',                    // Usually kept in root, but change if needed
      hooks: {
        server: 'app/src/hooks.server',    // Payload usually initializes here
      },
      lib: 'app/src/lib',
      routes: 'app/src/routes',
      serviceWorker: 'app/src/service-worker'
    }
  }
};

export default config;
