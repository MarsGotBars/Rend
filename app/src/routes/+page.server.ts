import type { PageServerLoad } from './$types'

export const prerender = true;

export const load: PageServerLoad = async ({ locals }) => {
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
}
