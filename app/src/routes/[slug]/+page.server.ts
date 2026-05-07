import { error } from '@sveltejs/kit'
import type { PageServerLoad, EntryGenerator } from './$types'
import type { Image } from '../../../cms/src/payload-types'
import { pathToFileURL } from 'url'

export const entries: EntryGenerator = async () => {
	try {
		// Import Payload and config
		const { getPayload } = await import('payload')
		
		// Support both absolute path (from env) and relative import
		let config
		if (process.env.PAYLOAD_CONFIG_PATH) {
			const configPath = process.env.PAYLOAD_CONFIG_PATH
			// Convert to file:// URL for Windows compatibility
			const urlPath = configPath.startsWith('file://') ? configPath : pathToFileURL(configPath).href
			const configModule = await import(urlPath)
			config = configModule.default
		} else {
			// In build environments without env var, try to load from compiled .next output
			// This will fail gracefully in SSG build and is expected
			try {
				const configModule = await import('../../../app/cms/src/payload.config.ts')
				config = configModule.default
			} catch {
				console.warn('⚠ Could not import TypeScript config directly, falling back to build-time generation')
				return []
			}
		}
		
		const payload = await getPayload({ config })

		const result = await payload.find({
			collection: 'pages',
			limit: 1000,
		})

		console.log(`✓ Generated ${result.docs.length} slug entries from database`)
		return result.docs.map((page: any) => ({
			slug: page.slug,
		}))
	} catch (err) {
		console.warn('⚠ Could not auto-generate slug entries during build:', err instanceof Error ? err.message : String(err))
		// Graceful fallback: during SSG build, return empty array (expected)
		return []
	}
}

// During SSG (static build), this route won't have pregenerated pages if database is empty
// Browser requests to /[slug] will result in 404, which is expected
export const prerender = true

export const load: PageServerLoad = async ({ params, locals }) => {
	const result = await locals.payload.find({
		collection: 'pages',
		where: { slug: { equals: params.slug } },
		limit: 1,
		depth: 1, // populate the images relation so we get full Image objects
	})

	const page = result.docs[0]
	if (!page) error(404, `Page "${params.slug}" not found`)

	// depth: 1 means images are fully populated Image objects, but the type
	// is (number | Image)[] — narrow to Image[] so the template stays clean.
	const images = (page.images ?? []).filter((i): i is Image => typeof i !== 'number')

	return { page, images }
}
