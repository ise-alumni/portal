# Deployment

## Overview

The production deployment consists of two parts:

1. A **static frontend** built by Vite and served from any static host (Vercel, Netlify, or a CDN behind Nginx).
2. A **Hono API server** running on Node.js, connected to a Turso cloud database.

## Database: Turso

In production, `DATABASE_URL` points to a Turso cloud instance and `TURSO_AUTH_TOKEN` authenticates against it.

Create a Turso database and get your credentials:

```bash
turso db create ise-alumni
turso db tokens create ise-alumni
turso db show ise-alumni --url
```

Set the resulting URL and token in your production environment:

```
DATABASE_URL=libsql://ise-alumni-yourorg.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

Run migrations against the cloud database:

```bash
DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... pnpm db:migrate
```

## Building the Frontend

```bash
pnpm build
```

Output goes to `dist/`. The build requires `VITE_API_URL` and `VITE_MAPBOX_TOKEN` to be set at build time because Vite inlines them.

## Running the API Server

```bash
node --import tsx server/index.ts
```

Or build to JavaScript first if you prefer not to use tsx in production:

```bash
npx tsc -p server/tsconfig.json
node dist/server/index.js
```

Required environment variables for the server:

| Variable              | Example                                  |
|-----------------------|------------------------------------------|
| `DATABASE_URL`        | `libsql://ise-alumni-yourorg.turso.io`   |
| `TURSO_AUTH_TOKEN`    | `eyJ...`                                 |
| `BETTER_AUTH_SECRET`  | (at least 32 characters)                 |
| `BETTER_AUTH_URL`     | `https://api.yourdomain.com`             |
| `PORT`                | `3000`                                   |
| `CORS_ORIGIN`         | `https://yourdomain.com`                 |

## CI/CD

The repository uses semantic-release for versioning. When a commit lands on `main`, the CI pipeline:

1. Runs lint and tests.
2. Builds the frontend.
3. Publishes a release if the commit message warrants a version bump.

Database migrations are not run automatically in CI. Run them manually after deploying schema changes.
