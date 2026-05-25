import { env } from '$env/dynamic/private';

function required(name: string, value: string | undefined): string {
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}

export const JWT_SECRET = required('JWT_SECRET', env.JWT_SECRET);
export const DATABASE_URL = required('DATABASE_URL', env.DATABASE_URL);
export const RESEND_API_KEY = required('RESEND_API_KEY', env.RESEND_API_KEY);
export const FROM_EMAIL = required('FROM_EMAIL', env.FROM_EMAIL);
export const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
export const TELEGRAM_BOT_USERNAME = env.TELEGRAM_BOT_USERNAME;
export const APP_URL = required('APP_URL', env.APP_URL);
export const ORIGIN = required('ORIGIN', env.ORIGIN);
// Optional — used by Vercel Cron to authenticate /api/scheduler calls
export const CRON_SECRET = env.CRON_SECRET;
