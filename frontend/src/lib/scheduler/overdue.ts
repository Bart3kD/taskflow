import { db } from '$lib/db';
import { tasks } from '$lib/db/schema';
import { and, lt, ne, isNotNull, eq } from 'drizzle-orm';

export async function processOverdue(): Promise<void> {
	const now = new Date();
	await db
		.update(tasks)
		.set({ status: 'overdue', updatedAt: now })
		.where(
			and(
				eq(tasks.deadlineType, 'once'),
				isNotNull(tasks.deadlineDate),
				lt(tasks.deadlineDate, now),
				ne(tasks.status, 'done'),
				ne(tasks.status, 'overdue'),
				ne(tasks.status, 'problem')
			)
		);
}
