import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { tasks, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const [rows, members] = await Promise.all([
		user.role === 'admin'
			? db
					.select({
						id: tasks.id,
						title: tasks.title,
						status: tasks.status,
						deadlineDate: tasks.deadlineDate,
						deadlineType: tasks.deadlineType,
						assignedTo: tasks.assignedTo,
						assigneeName: users.name
					})
					.from(tasks)
					.leftJoin(users, eq(tasks.assignedTo, users.id))
			: db
					.select({
						id: tasks.id,
						title: tasks.title,
						status: tasks.status,
						deadlineDate: tasks.deadlineDate,
						deadlineType: tasks.deadlineType,
						assignedTo: tasks.assignedTo,
						assigneeName: users.name
					})
					.from(tasks)
					.leftJoin(users, eq(tasks.assignedTo, users.id))
					.where(eq(tasks.assignedTo, user.id)),
		user.role === 'admin'
			? db.select({ id: users.id, name: users.name }).from(users)
			: Promise.resolve([])
	]);

	return { tasks: rows, members };
};
