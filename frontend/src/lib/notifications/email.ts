import { Resend } from 'resend';
import { RESEND_API_KEY, FROM_EMAIL } from '$env/static/private';
import type { Task, User } from '$lib/db/schema';

function getResend(): Resend {
	return new Resend(RESEND_API_KEY);
}

export async function sendWelcomeEmail(
	user: Pick<User, 'email' | 'name'>,
	tempPassword: string,
	appUrl: string
): Promise<void> {
	const resend = getResend();

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject: 'Welcome to TaskFlow — your account is ready',
		html: `
			<p>Hi ${user.name},</p>
			<p>Your TaskFlow account has been created. Here are your login details:</p>
			<table style="border-collapse:collapse;margin:16px 0;">
				<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;font-weight:600;">${user.email}</td></tr>
				<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Temporary password</td><td style="padding:4px 0;font-weight:600;font-family:monospace;">${tempPassword}</td></tr>
			</table>
			<p><a href="${appUrl}/login" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Log in to TaskFlow</a></p>
			<p style="color:#6b7280;font-size:0.875rem;">Please change your password after your first login via the Settings page.</p>
		`
	});
}

export async function sendReminderEmail(
	user: Pick<User, 'email' | 'name'>,
	task: Pick<Task, 'title'>,
	daysUntilDeadline: number
): Promise<void> {
	const resend = getResend();
	const when =
		daysUntilDeadline === 0
			? 'today'
			: daysUntilDeadline === 1
				? 'tomorrow'
				: `in ${daysUntilDeadline} days`;

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject: `Reminder: "${task.title}" is due ${when}`,
		html: `
			<p>Hi ${user.name},</p>
			<p>This is a reminder that your task <strong>${task.title}</strong> is due <strong>${when}</strong>.</p>
			<p>Please make sure to complete it on time.</p>
		`
	});
}

export async function sendAssignmentEmail(
	user: Pick<User, 'email' | 'name'>,
	tasks: Pick<Task, 'title' | 'deadlineDate'>[],
	appUrl: string
): Promise<void> {
	const resend = getResend();
	const isSingle = tasks.length === 1;
	const subject = isSingle
		? `New task assigned: "${tasks[0].title}"`
		: `${tasks.length} new tasks assigned to you`;

	const taskRows = tasks
		.map((t) => {
			const deadline = t.deadlineDate
				? new Date(t.deadlineDate).toLocaleDateString('en-GB', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})
				: 'No deadline';
			return `<tr>
				<td style="padding:6px 12px 6px 0;font-weight:600;">${t.title}</td>
				<td style="padding:6px 0;color:#6b7280;">${deadline}</td>
			</tr>`;
		})
		.join('');

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject,
		html: `
			<p>Hi ${user.name},</p>
			<p>You have been assigned ${isSingle ? 'a new task' : 'new tasks'}:</p>
			<table style="border-collapse:collapse;margin:16px 0;">${taskRows}</table>
			<p><a href="${appUrl}/tasks" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View your tasks</a></p>
		`
	});
}

export async function sendReportEmail(
	user: Pick<User, 'email' | 'name'>,
	task: Pick<Task, 'title'>,
	token: string,
	appUrl: string
): Promise<void> {
	const resend = getResend();
	const base = `${appUrl}/confirm/${token}`;

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject: `Status update requested: "${task.title}"`,
		html: `
			<p>Hi ${user.name},</p>
			<p>Please update the status of your task: <strong>${task.title}</strong></p>
			<p style="margin: 24px 0;">
				<a href="${base}?status=done" style="display:inline-block;margin-right:12px;padding:10px 20px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">✓ Done</a>
				<a href="${base}?status=in_progress" style="display:inline-block;margin-right:12px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">⟳ In Progress</a>
				<a href="${base}?status=problem" style="display:inline-block;padding:10px 20px;background:#d97706;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">⚠ Problem</a>
			</p>
			<p style="color:#6b7280;font-size:0.875rem;">Clicking a button will instantly update your task status — no login required.</p>
		`
	});
}
