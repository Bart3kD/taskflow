import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { tasks, statusTokens, notificationLogs } from '$lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;

	const taskRows = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(eq(tasks.assignedTo, id));

	if (taskRows.length > 0) {
		const taskIds = taskRows.map((t) => t.id);
		await db.delete(statusTokens).where(inArray(statusTokens.taskId, taskIds));
		await db.delete(notificationLogs).where(inArray(notificationLogs.taskId, taskIds));
		await db.delete(tasks).where(eq(tasks.assignedTo, id));
	}

	return json({ deleted: taskRows.length });
};
