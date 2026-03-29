# ISE Alumni Portal

A platform for Immersive Software Engineering alumni to stay connected with the program, find each other, and keep up with events and announcements.

## Quick Start

You need [Node.js](https://nodejs.org/) (v20+), [pnpm](https://pnpm.io/), and [just](https://github.com/casey/just).

```bash
git clone https://github.com/ISE-Alumni/portal.git
cd ise-alumni
just setup
just dev
```

The frontend runs at `http://localhost:8080` and the API at `http://localhost:3000`.

Five test accounts are seeded automatically. All share the password `password123`:

| Role   | Email                     |
| ------ | ------------------------- |
| Admin  | admin@example.com         |
| Alumni | sarah.johnson@example.com |
| Alumni | michael.chen@example.com  |
| Alumni | emma.wilson@example.com   |
| Staff  | staff@example.com         |

## Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind, ShadCN |
| API      | Hono (Node.js)                            |
| Auth     | Better Auth (email/password)              |
| ORM      | Drizzle                                   |
| Database | SQLite (local + Docker), Turso (optional) |
| Testing  | Vitest, Testing Library                   |

## Common Commands

Run `just` to list everything. The essentials:

```
just setup          # first-time install, migrate, seed
just dev            # start API + frontend
just db-reset       # wipe and reseed the local database
just test           # run tests in watch mode
just lint           # run ESLint
just build          # production build
```

## Project Layout

```
server/             API server (Hono, Better Auth, Drizzle)
  index.ts          entry point
  auth.ts           Better Auth config
  db.ts             database client
  routes.ts         REST endpoints
  migrate.ts        schema migrations
  seed.ts           test data
src/
  components/       React components
  hooks/            custom hooks (useAuth, etc.)
  lib/
    api.ts          fetch wrapper for the API
    auth-client.ts  Better Auth client
    db/             Drizzle schema
    domain/         data-access functions
  pages/            route pages
docs/               architecture and deployment notes
```

## Documentation

Further details live in `docs/`:

- [Architecture](docs/architecture.md)
- [Local Development](docs/local-development.md)
- [Deployment](docs/deployment.md)
- [Contributing](docs/contributing.md)
