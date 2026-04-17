import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { users, notificationSchedules } from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const db = drizzle(postgres(url), { schema });
import bcrypt from 'bcryptjs';

async function seed() {
	const passwordHash = await bcrypt.hash('admin123', 12);

	const [admin] = await db
		.insert(users)
		.values({
			name: 'Admin',
			email: 'admin@taskflow.app',
			passwordHash,
			role: 'admin'
		})
		.onConflictDoNothing()
		.returning({ id: users.id });

	if (admin) {
		await db.insert(notificationSchedules).values({ userId: admin.id }).onConflictDoNothing();
		console.log('Seeded admin user: admin@taskflow.app / admin123');
	} else {
		console.log('Admin user already exists, skipping.');
	}

	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
