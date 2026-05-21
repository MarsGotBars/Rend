import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const [users, images, pages] = await Promise.all([
			locals.payload.find({ collection: 'users' }),
			locals.payload.find({ collection: 'images' }),
			locals.payload.find({ collection: 'pages', depth: 1 }),
		])

		return {
			users: users.docs,
			images: images.docs,
			pages: pages.docs,
		}
	} catch (error) {
		// During prerender, if database is not available, return empty
		console.warn('Could not load data during prerender:', error instanceof Error ? error.message : String(error))
		return {
			users: [],
			images: [],
			pages: [],
		}
	}
}
