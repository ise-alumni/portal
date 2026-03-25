import 'dotenv/config';
import { existsSync } from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { auth } from './auth';
import { api } from './routes';

const app = new Hono();

const isProd = process.env.NODE_ENV === 'production';
const origin = process.env.CORS_ORIGIN ?? 'http://localhost:8080';

app.use(
  '/api/*',
  cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/', api);

app.get('/health', (c) => c.json({ ok: true }));

// In production, serve the built SPA from dist/.
// All non-API, non-asset requests fall through to index.html for client-side routing.
if (isProd && existsSync('dist')) {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  const mode = isProd ? 'production' : 'development';
  console.log(`Server running on http://localhost:${port} (${mode})`);
});
