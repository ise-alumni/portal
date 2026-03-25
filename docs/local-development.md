# Local Development

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [pnpm](https://pnpm.io/) v9 or later
- [just](https://github.com/casey/just) command runner

Optional, for the map feature:

- A [Mapbox](https://www.mapbox.com/) access token

## First-Time Setup

```bash
just setup
```

This recipe installs dependencies, copies `.env.example` to `.env`, runs database migrations, and seeds the local SQLite database with test data.

Edit `.env` afterward to add your Mapbox token if you need the map.

## Running the Dev Stack

```bash
just dev
```

This starts two processes concurrently:

1. The **Hono API server** on `http://localhost:3000`, watching for file changes via `tsx watch`.
2. The **Vite dev server** on `http://localhost:8080`, proxying `/api` requests to the Hono server.

Open `http://localhost:8080` in a browser. Log in with any seeded account (password: `password123`).

## Database

The local database is a single SQLite file, `data.db`, at the project root. It is git-ignored and treated as ephemeral. Wipe and rebuild it at any time:

```bash
just db-reset
```

To run only migrations (no seed):

```bash
just db-migrate
```

To seed an already-migrated database:

```bash
just db-seed
```

### Changing the Schema

1. Add or modify tables in `src/lib/db/turso-schema.ts` (the Drizzle schema).
2. Mirror the change in `server/migrate.ts` (the raw SQL).
3. Run `just db-reset` to apply.

In production, Turso migrations are handled by running `pnpm db:migrate` against the cloud URL.

## Environment Variables

All variables are documented in `.env.example`. The important ones:

| Variable              | Purpose                            |
|-----------------------|------------------------------------|
| `DATABASE_URL`        | `file:data.db` for local, Turso URL for prod |
| `TURSO_AUTH_TOKEN`    | Turso auth token (blank for local) |
| `BETTER_AUTH_SECRET`  | Signs session tokens               |
| `VITE_API_URL`        | Frontend's API base URL            |
| `VITE_MAPBOX_TOKEN`   | Mapbox GL access token             |

Variables prefixed with `VITE_` are exposed to the browser. Do not put secrets there.

## Testing

```bash
just test           # watch mode
just test-run       # single run
just test-coverage  # with coverage report
```

Tests use Vitest and Testing Library. Unit tests live alongside their source files in `__tests__/` directories.
