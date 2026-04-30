// /apps/src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { PUBLIC_PAYLOAD_CMS_URL, PUBLIC_PORT } from '$env/static/public';

export const load: PageServerLoad = async ({ locals }) => {
    const users = await locals.payload.find({ collection: 'users' });
    const imagesResponse = await locals.payload.find({ collection: 'images' });

    // Prepend the URL here
    const images = imagesResponse.docs.map(doc => {
		console.log(doc);
		
        return {
            ...doc,
            // Check if URL exists and prepend the base
            url: doc.url ? `${PUBLIC_PAYLOAD_CMS_URL}${PUBLIC_PORT}${doc.url}` : null
        };
    });

    return {
        users: users.docs,
        images
    };
};