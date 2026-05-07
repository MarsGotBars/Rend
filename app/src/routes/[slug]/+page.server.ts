import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { Image } from '../../../cms/src/payload-types'

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
