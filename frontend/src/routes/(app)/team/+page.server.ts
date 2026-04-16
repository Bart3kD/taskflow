import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, notificationSchedules } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'admin') throw redirect(302, '/dashboard');

	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			telegramChatId: users.telegramChatId,
			reportChannel: notificationSchedules.reportChannel,
			reminderChannel: notificationSchedules.reminderChannel
		})
		.from(users)
		.leftJoin(notificationSchedules, eq(users.id, notificationSchedules.userId));

	return { members: rows };
};
