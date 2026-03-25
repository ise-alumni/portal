# Architecture

The ISE Alumni Portal is a single-page application backed by a lightweight API server. Both are written in TypeScript and share a single Drizzle schema as the source of truth for the database.

## High-Level Overview

```
Browser (React SPA)
    │
    │  fetch /api/*
    ▼
Hono API Server (Node.js, port 3000)
    │
    ├── Better Auth   (/api/auth/*)
    └── REST routes   (/api/profiles, /api/events, …)
            │
            ▼
       Drizzle ORM
            │
            ▼
   SQLite / Turso (libSQL)
```

In development, Vite proxies `/api` requests to the Hono server so the frontend can be served on its own port without CORS trouble in the browser.

## Frontend

The frontend is a React 18 application built with Vite. Routing uses React Router. UI components come from ShadCN (built on Radix primitives) and are styled with Tailwind CSS.

Data fetching follows a simple pattern: domain functions in `src/lib/domain/` call the API through a thin fetch wrapper (`src/lib/api.ts`). Pages call domain functions directly in `useEffect` or via TanStack Query.

Authentication state is managed by a React context (`src/hooks/useAuth.tsx`) that wraps the Better Auth client.

## API Server

The API server lives in `server/` and uses Hono, a small, standards-based web framework. It runs on Node.js via `@hono/node-server`.

The server has three responsibilities:

1. **Authentication.** Better Auth handles sign-up, sign-in, session management, and password hashing. Its routes are mounted at `/api/auth/*`.

2. **Data access.** REST endpoints in `server/routes.ts` expose CRUD operations for profiles, events, announcements, tags, residencies, and reminders. All queries go through Drizzle ORM.

3. **CORS.** The server allows credentialed requests from the frontend origin.

## Database

The application uses a single SQLite database in development (`data.db`, git-ignored) and a Turso cloud database in production. Both speak the libSQL wire protocol, so the same Drizzle client works in either environment. The only difference is the `DATABASE_URL` and, for Turso, an auth token.

The schema is defined in two places that must stay in sync:

- `src/lib/db/turso-schema.ts` is the Drizzle schema used by both server and client type inference.
- `server/migrate.ts` contains raw SQL `CREATE TABLE` statements executed at migration time.

When adding or changing a table, update both files.

## Authentication

Better Auth stores users in four tables: `user`, `session`, `account`, and `verification`. These tables are defined in both the Drizzle schema and the migration SQL. The `account` table holds hashed passwords for the email/password provider.

Profiles are a separate application-level table linked to auth users by `user_id`. The seed script creates both auth users and their corresponding profiles.
