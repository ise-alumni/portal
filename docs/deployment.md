# Deployment

## Overview

In production, the Hono server serves both the API and the built SPA from a single Node.js process. Set `NODE_ENV=production`, and the server will serve static files from `dist/` alongside the API routes. No separate web server (Nginx, etc.) is needed for the application itself, though a reverse proxy like Caddy is recommended for TLS.

## Database: Turso

In development the database is a local SQLite file. In production, point `DATABASE_URL` at a Turso cloud instance for durability and replication.

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

## Building

```bash
just deploy-build
```

This runs lint, tests, builds the frontend to `dist/`, and builds a Docker image. `VITE_API_URL` and `VITE_MAPBOX_TOKEN` must be set at build time because Vite inlines them into the client bundle. In CI, these are configured as repository secrets.

## Running the Server

With Docker Compose (recommended):

```bash
docker compose up -d
```

This starts both the app and Watchtower. See `docker-compose.yml` in the project root.

With Docker directly:

```bash
docker run --rm -p 3000:3000 --env-file .env -v app-data:/app/data ise-alumni:latest
```

Without Docker:

```bash
NODE_ENV=production node --import tsx server/index.ts
```

## Required Environment Variables

| Variable              | Example                                  |
|-----------------------|------------------------------------------|
| `BETTER_AUTH_SECRET`  | (at least 32 characters)                 |
| `BETTER_AUTH_URL`     | `https://alumni.yourdomain.com`          |
| `PORT`                | `3000`                                   |
| `CORS_ORIGIN`         | `https://alumni.yourdomain.com`          |

Optional (only needed for Turso cloud database):

| Variable              | Example                                  |
|-----------------------|------------------------------------------|
| `DATABASE_URL`        | `libsql://ise-alumni-yourorg.turso.io`   |
| `TURSO_AUTH_TOKEN`    | `eyJ...`                                 |

`NODE_ENV` is set to `production` in the Dockerfile. `DATABASE_URL` defaults to `file:/app/data/data.db` in Docker.

## Hosting Options

For a self-hosted setup on Proxmox (Docker or bare Node.js with systemd and Caddy), see [deployment-proxmox.md](deployment-proxmox.md).

For managed hosting, deploy the Docker image to any container platform (Fly.io, Railway, Render). Point `DATABASE_URL` at Turso and set the environment variables listed above.

## CI/CD

The repository uses semantic-release for versioning. When a commit lands on `main`, the CD pipeline:

1. Runs lint and tests.
2. Builds the frontend.
3. Publishes a release if the commit message warrants a version bump.
4. Builds a Docker image and pushes it to `ghcr.io/ise-alumni/portal:latest`.

On the production VM, [Watchtower](https://containrrr.dev/watchtower/) polls GHCR every 30 seconds. When it detects a new image it pulls it, stops the old container, and starts a new one. No SSH access to the server is required.

Database migrations run automatically on container startup via `docker-entrypoint.sh`. The schema uses `CREATE TABLE IF NOT EXISTS`, so migrations are idempotent and safe to re-run.
