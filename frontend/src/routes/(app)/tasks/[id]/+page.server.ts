import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { tasks, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();

	const [task] = await db.select().from(tasks).where(eq(tasks.id, params.id)).limit(1);
	if (!task) throw error(404, 'Task not found');

	if (user.role !== 'admin' && task.assignedTo !== user.id) throw error(403, 'Forbidden');

	const members = user.role === 'admin'
		? await db.select({ id: users.id, name: users.name }).from(users)
		: [];

	return { task, members };
};
