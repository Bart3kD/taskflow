import cron from 'node-cron';
import { processReminders } from '$lib/scheduler/reminders';
import { processReports } from '$lib/scheduler/reports';
import { processOverdue } from '$lib/scheduler/overdue';
import { processAssignmentNotifications } from '$lib/scheduler/assignments';

cron.schedule('0 * * * *', async () => {
	try {
		await processOverdue();
		await processAssignmentNotifications();
		await processReminders();
		await processReports();
	} catch (err) {
		console.error('Scheduler error:', err);
	}
});
