import { Resend } from 'resend';
import { RESEND_API_KEY, FROM_EMAIL } from '$lib/env';
import type { Task, User } from '$lib/db/schema';

function getResend(): Resend {
	return new Resend(RESEND_API_KEY);
}

export async function sendPasswordResetEmail(
	user: Pick<User, 'email' | 'name'>,
	token: string,
	appUrl: string
): Promise<void> {
	const resend = getResend();
	const resetUrl = `${appUrl}/reset-password/${token}`;

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject: 'Reset your TaskFlow password',
		html: `
			<p>Hi ${user.name},</p>
			<p>We received a request to reset your TaskFlow password. Click the button below to set a new password:</p>
			<p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a></p>
			<p style="color:#6b7280;font-size:0.875rem;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
		`
	});
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

function daysUntilLabel(days: number): string {
	if (days === 0) return 'today';
	if (days === 1) return 'tomorrow';
	return `in ${days} days`;
}

export async function sendReminderEmail(
	user: Pick<User, 'email' | 'name'>,
	reminders: { title: string; daysUntil: number; deadlineDate: Date | null }[]
): Promise<void> {
	const resend = getResend();
	const subject =
		reminders.length === 1
			? `Reminder: "${reminders[0].title}" is due ${daysUntilLabel(reminders[0].daysUntil)}`
			: `You have ${reminders.length} upcoming task deadlines`;

	const rows = reminders
		.map((r) => {
			const time = r.deadlineDate
				? new Date(r.deadlineDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
				: null;
			const due = time ? `${daysUntilLabel(r.daysUntil)} at ${time}` : daysUntilLabel(r.daysUntil);
			return `<tr>
				<td style="padding:6px 12px 6px 0;font-weight:600;">${r.title}</td>
				<td style="padding:6px 0;color:#6b7280;">Due ${due}</td>
			</tr>`;
		})
		.join('');

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject,
		html: `
			<p>Hi ${user.name},</p>
			<p>Here are your upcoming task deadlines:</p>
			<table style="border-collapse:collapse;margin:16px 0;">${rows}</table>
			<p>Please make sure to complete them on time.</p>
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
				? new Date(t.deadlineDate).toLocaleString('en-GB', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
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

export async function sendDeletionEmail(
	user: Pick<User, 'email' | 'name'>,
	taskTitle: string
): Promise<void> {
	const resend = getResend();

	await resend.emails.send({
		from: FROM_EMAIL,
		to: user.email,
		subject: `Task removed: "${taskTitle}"`,
		html: `
			<p>Hi ${user.name},</p>
			<p>Your task <strong>${taskTitle}</strong> has been removed by the manager.</p>
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
