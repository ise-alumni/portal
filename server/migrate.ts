import 'dotenv/config';
import { client } from './db';
import { SCHEMA_SQL } from './schema.sql';

console.log('Running migrations...');

const statements = SCHEMA_SQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  await client.execute(stmt);
}

console.log(`Executed ${statements.length} statements`);
console.log('Migration complete');
