import { error } from '@sveltejs/kit'
import type { PageServerLoad, EntryGenerator } from './$types'
import type { Image } from '../../../cms/src/payload-types'

export const entries: EntryGenerator = async () => {
	try {
		// Dynamic import to avoid circular dependency issues
		const { getPayload } = await import('payload')
		const config = (await import('../../../app/cms/src/payload.config.ts')).default
		
		const payload = await getPayload({ config })

		const result = await payload.find({
			collection: 'pages',
			limit: 1000,
		})

		return result.docs.map((page: any) => ({
			slug: page.slug,
		}))
	} catch (err) {
		console.warn('Could not auto-generate slug entries during build:', err instanceof Error ? err.message : String(err))
		// Fallback: return empty array, pages will be generated on-demand
		return []
	}
}

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
