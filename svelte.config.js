import adapter from '@sveltejs/adapter-static'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		alias: {
			'@cms': 'app/cms/src'
		},
		prerender: {
			entries: ['*'],
			crawl: true,
			handleUnseenRoutes: 'warn',
			handleHttpError: ({ status, path }) => {
				// Don't fail the build on 404s for unseen routes
				if (status === 404) {
					console.warn(`Skipping prerender for unseen route: ${path}`)
					return
				}
				// Fail on other errors
				throw new Error(`${status} on ${path}`)
			}
		},
		files: {
			appTemplate: 'app/src/app.html',
			errorTemplate: 'app/src/error.html',
			assets: 'static',
			hooks: {
				server: 'app/src/hooks.server'
			},
			lib: 'app/src/lib',
			routes: 'app/src/routes',
			serviceWorker: 'app/src/service-worker'
		}
	}
}

export default config
