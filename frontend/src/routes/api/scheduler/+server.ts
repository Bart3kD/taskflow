import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/jwt';
import { CRON_SECRET } from '$lib/env';
import { processOverdue } from '$lib/scheduler/overdue';
import { processAssignmentNotifications } from '$lib/scheduler/assignments';
import { processReminders } from '$lib/scheduler/reminders';
import { processReports } from '$lib/scheduler/reports';

export const POST: RequestHandler = async (event) => {
	const authHeader = event.request.headers.get('authorization');
	const isVercelCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

	if (!isVercelCron) {
		const auth = await requireAuth(event);
		if (auth.role !== 'admin') throw error(403, 'Forbidden');
	}

	try {
		await processOverdue();
		await processAssignmentNotifications();
		await processReminders();
		await processReports();
		return json({ ok: true });
	} catch (err) {
		console.error('Manual scheduler trigger error:', err);
		return json({ error: String(err) }, { status: 500 });
	}
};
