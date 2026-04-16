import { db } from './index';
import { users, notificationSchedules } from './schema';
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
