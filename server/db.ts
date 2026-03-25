import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/db/turso-schema';

const url = process.env.DATABASE_URL ?? 'file:data.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  ...(authToken && { authToken }),
});

export const db = drizzle(client, { schema });
export { client };
