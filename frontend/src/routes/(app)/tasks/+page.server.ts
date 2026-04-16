import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { tasks, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const rows =
		user.role === 'admin'
			? await db
					.select({
						id: tasks.id,
						title: tasks.title,
						status: tasks.status,
						deadlineDate: tasks.deadlineDate,
						deadlineType: tasks.deadlineType,
						assigneeName: users.name
					})
					.from(tasks)
					.leftJoin(users, eq(tasks.assignedTo, users.id))
			: await db
					.select({
						id: tasks.id,
						title: tasks.title,
						status: tasks.status,
						deadlineDate: tasks.deadlineDate,
						deadlineType: tasks.deadlineType,
						assigneeName: users.name
					})
					.from(tasks)
					.leftJoin(users, eq(tasks.assignedTo, users.id))
					.where(eq(tasks.assignedTo, user.id));

	return { tasks: rows };
};
