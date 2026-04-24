import cron from 'node-cron';
import { processReminders } from '$lib/scheduler/reminders';
import { processReports } from '$lib/scheduler/reports';
import { processOverdue } from '$lib/scheduler/overdue';
import { processAssignmentNotifications } from '$lib/scheduler/assignments';
import { TELEGRAM_BOT_TOKEN, APP_URL } from '$env/static/private';

if (TELEGRAM_BOT_TOKEN && APP_URL && !APP_URL.includes('localhost')) {
	fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			url: `${APP_URL}/api/telegram/webhook`,
			allowed_updates: ['message', 'callback_query']
		})
	})
		.then((r) => r.json())
		.then((r) => console.log('Telegram webhook registered:', JSON.stringify(r)))
		.catch((err) => console.error('Telegram webhook registration failed:', err));
}

const g = globalThis as typeof globalThis & { __cronRegistered?: boolean };
if (!g.__cronRegistered) {
	g.__cronRegistered = true;
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
}
