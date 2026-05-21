import type { PageServerLoad } from './$types'

// This page is server-side rendered on every request (NOT prerendered).
// The (dynamic) layout group sets prerender = false, so this route
// is rendered fresh for each visitor at request time.

export const load: PageServerLoad = async ({ locals }) => {
	// Example: fetch real-time data that changes frequently
	// or requires authentication/session context
	const pages = await locals.payload.find({
		collection: 'pages',
		depth: 1,
		sort: '-updatedAt',
		limit: 10,
	})

	return {
		pages: pages.docs,
		generatedAt: new Date().toISOString(),
	}
}
