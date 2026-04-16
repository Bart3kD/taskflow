import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'admin') throw redirect(302, '/tasks');

	const members = await db.select({ id: users.id, name: users.name }).from(users);
	return { members };
};
