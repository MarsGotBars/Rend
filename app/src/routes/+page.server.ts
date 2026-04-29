// /apps/src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const users = await locals.payload.find({
		collection: 'users'
	});

	const media = await locals.payload.find({
		collection: 'media'
	});

	console.log(media);

	return {
		users: users.docs,
		media: media.docs
	};
};
