import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number(process.env.PORT ?? 3000);
const isProd = process.env.NODE_ENV === 'production';

serve({ fetch: app.fetch, port }, () => {
  const mode = isProd ? 'production' : 'development';
  console.log(`Server running on http://localhost:${port} (${mode})`);
});
