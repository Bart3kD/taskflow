import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, notificationSchedules } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'admin') throw redirect(302, '/dashboard');

	const [member] = await db
		.select()
		.from(users)
		.where(eq(users.id, params.id))
		.limit(1);

	if (!member) throw error(404, 'User not found');

	const [schedule] = await db
		.select()
		.from(notificationSchedules)
		.where(eq(notificationSchedules.userId, params.id))
		.limit(1);

	return { member, schedule: schedule ?? null };
};
