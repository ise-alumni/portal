# Contributing to ISE Alumni Portal

Thank you for your interest in contributing to the ISE Alumni Portal! This document provides detailed information about development workflows, database management, testing, and other development processes.

## Table of Contents

- [Development Setup](#development-setup)
- [Just Commands Reference](#just-commands-reference)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Feature Flags](#feature-flags)
- [Production Mode](#production-mode)
- [Sample Data](#sample-data)

## Development Setup

### Prerequisites

- **Docker Desktop** ([macOS](https://docs.docker.com/desktop/install/mac-install/) | [Windows](https://docs.docker.com/desktop/install/windows-install/) | [Linux](https://docs.docker.com/desktop/install/linux-install/))
- **Just** command runner - Install via:
  - macOS: `brew install just`
  - Linux: `cargo install just` or download from [releases](https://github.com/casey/just/releases)
  - Windows: `scoop install just` or download from releases
- **Access to the ISE Alumni Supabase project** (request from maintainers)
- pnpm or Bun (Bun will be installed automatically during setup)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/bxrne/ise-alumni.git
cd ise-alumni

# Run the automated setup (one-time only)
just setup

# Start development (Supabase + Frontend)
just start
```

### Platform-Specific Notes

<details>
<summary><strong>macOS</strong></summary>

Requires [Homebrew](https://brew.sh/). Install if needed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
</details>

<details>
<summary><strong>Linux</strong></summary>

The setup script will:
- Install Bun via the official installer
- Install Supabase CLI via Homebrew (if available) or binary download
</details>

<details>
<summary><strong>Windows</strong></summary>

For best experience:
1. Use [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) and run commands inside your WSL2 environment
2. Or use Git Bash and manually install:
   - Bun: `powershell -c "irm bun.sh/install.ps1|iex"`
   - Supabase CLI via [Scoop](https://scoop.sh/):
     ```powershell
     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
     scoop install supabase
     ```
3. Configure Docker Desktop to work with WSL2
</details>

## Just Commands Reference

All development tasks are managed through the `justfile`. Run `just` to see all available commands.

### Setup & Development

| Command | Description |
|---------|-------------|
| `just setup` | One-time environment setup (installs Bun, Supabase CLI, creates .env.local) |
| `just start` | Start Supabase + frontend dev server |
| `just start-prod` | Start frontend connected to production database (⚠️ caution) |
| `just stop` | Stop all services (Supabase, Vite, Bun) |
| `just dev` | Start frontend only (without Supabase) |
| `just build` | Build for production |
| `just lint` | Run ESLint |

### Database

| Command | Description |
|---------|-------------|
| `just db-reset` | Reset local database |
| `just db-migration-new <name>` | Create a new migration file |
| `just seed [count]` | Add sample data (default 100 alumni) |
| `just supabase-login` | Login to Supabase |
| `just supabase-status` | Check Supabase status |

### Testing

| Command | Description |
|---------|-------------|
| `just test` | Run tests in watch mode |
| `just test-run` | Run tests once |
| `just test-coverage` | Run tests with coverage |
| `just test-ui` | Run tests in UI mode |

## Database Migrations

### Migration Workflow

**IMPORTANT:** Do NOT use `supabase db pull` or `supabase db push` directly. All migrations are deployed through CI/CD.

#### Creating a New Migration

```bash
# 1. Create a new migration file
just db-migration-new my_migration_name

# 2. Write your SQL changes in the generated file
#    Example: supabase/migrations/20260124160000_my_migration_name.sql

# 3. Test the migration locally
just db-reset

# 4. Verify the migration works as expected
#    Check your local app and database

# 5. Commit and open a PR
git add supabase/migrations/20260124160000_my_migration_name.sql
git commit -m "Add my_migration_name migration"
git push origin your-branch-name

# 6. Migrations are automatically applied to production when merged
```

#### Migration Rules

- ✅ **DO** write SQL migrations manually
- ✅ **DO** test locally with `just db-reset`
- ✅ **DO** commit migration files to your PR
- ❌ **DON'T** use `supabase db pull` (creates drift between local and migrations)
- ❌ **DON'T** use `supabase db push` (CI/CD handles deployment)
- ❌ **DON'T** make schema changes via Supabase Studio on remote environments

**Deployment:** When your PR is merged to `main`, GitHub Actions automatically applies migrations to the production database.

**Best Practice:** Treat migration files as the single source of truth. All schema changes must go through migrations in version control.

## Testing

```bash
# Run tests in watch mode
just test

# Run tests once
just test-run

# Run tests with coverage
just test-coverage

# Run tests in UI mode
just test-ui
```

## Feature Flags

Some features may be pushed but not yet released to users. Feature flags are configured in [`src/config/features.ts`](./src/config/features.ts).

## Production Mode

⚠️ **Use with extreme caution.**

To run the frontend connected to the production Supabase instance:

```bash
just start-prod
```

**Warning**: This connects to **LIVE DATA**. Only use this for:
- Testing production data locally
- Debugging production-only issues
- Emergency fixes

**This will:**
1. Prompt you to type "YES" to confirm
2. Prompt you to type the project name "ise-alumni" for final confirmation
3. Temporarily rename `.env.local` to `.env.local.backup`
4. Connect to production database

When you exit (Ctrl+C), `.env.local` is automatically restored.

## Sample Data

After starting your local environment, you can populate the database with realistic test data:

```bash
# Generate default 100 alumni profiles
just seed

# Generate custom count
just seed 200
```

This creates:
- **N alumni profiles** (default 100, configurable)
  - Mix of BSc (2025-2029) and MSc (2026-2030) graduates
  - 50+ unique tech companies (Google, Stripe, Revolut, Tines, etc.)
  - Distributed across 28+ cities globally
  - Mix of user types (mostly Alum, some Staff/Admin)
- **50 events** (80% past, 20% upcoming) with tags
- **50 announcements** with varied deadlines
- **Residency partners** and records
- **14 common tags** for categorization

**All generated users have the password:** `password123`

**Note:** Running this removes the `test@example.com` user from seed.sql. Use any generated user to log in (check Supabase Studio at http://127.0.0.1:54323 > Authentication > Users for emails).

## Support

- **Issues**: [GitHub Issues](https://github.com/bxrne/ise-alumni/issues)
