import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

console.log('Applying migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations complete.');

await sql.end();
