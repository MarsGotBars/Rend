// /apps/src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const users = await locals.payload.find({
    collection: 'users',
  });

  return {
    users: users.docs,
  };
};