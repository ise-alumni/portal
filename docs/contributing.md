# Contributing

## Branching

Work on a feature branch off `main`. Open a pull request when the work is ready for review. Merge to `main` triggers a release via semantic-release, so write commit messages accordingly (see below).

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add residency timeline to profile page
fix: correct tag color not persisting on save
docs: update deployment guide with Turso setup
chore: remove unused supabase dependencies
```

The commit type determines the version bump:

- `fix` increments the patch version.
- `feat` increments the minor version.
- A `BREAKING CHANGE` footer increments the major version.

## Code Style

- TypeScript everywhere, strict mode enabled.
- Format with Prettier (via ESLint integration).
- Lint before committing: `just lint`.
- Keep functions short. Prefer small, well-named helpers over deeply nested logic.

## Testing

Write tests for business logic and data-access functions. Use Vitest and Testing Library. Tests live in `__tests__/` directories next to the code they cover.

Run the suite before opening a PR:

```bash
just test-run
```

## Database Changes

When changing the schema:

1. Update the Drizzle schema in `src/lib/db/turso-schema.ts`.
2. Update the raw SQL in `server/migrate.ts`.
3. Run `just db-reset` to verify locally.
4. Note the migration in your PR description.

## Pull Request Checklist

- [ ] Tests pass (`just test-run`).
- [ ] Lint passes (`just lint`).
- [ ] Schema changes are reflected in both the Drizzle schema and migration SQL.
- [ ] New environment variables are added to `.env.example`.
- [ ] Documentation is updated if the change affects setup, deployment, or architecture.
