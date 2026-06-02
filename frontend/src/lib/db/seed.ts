import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { users, notificationSchedules } from './schema';

config({ path: resolve(import.meta.dirname, '../../../../.env') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const db = drizzle(postgres(url), { schema });
import bcrypt from 'bcryptjs';

async function seed() {
	const email = process.env.ADMIN_EMAIL ?? 'admin@taskflow.app';
	const password = process.env.ADMIN_PASSWORD ?? 'admin123';
	const name = process.env.ADMIN_NAME ?? 'Admin';

	const passwordHash = await bcrypt.hash(password, 12);

	const [admin] = await db
		.insert(users)
		.values({ name, email, passwordHash, role: 'admin' })
		.onConflictDoNothing()
		.returning({ id: users.id });

	if (admin) {
		await db.insert(notificationSchedules).values({ userId: admin.id }).onConflictDoNothing();
		console.log(`Seeded admin user: ${email}`);
	} else {
		console.log('Admin user already exists, skipping.');
	}

	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
