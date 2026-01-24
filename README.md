# ISE Alumni Portal

A portal for managing the alumni for ISE - facilitating events, announcements and the alumni's connection to the ISE programme.

## Overview

The ISE Alumni Portal is a comprehensive platform designed to help Immersive Software Engineering (ISE) alumni stay connected with the program, manage events, share announcements, and maintain their professional network.

## Features

- **Alumni Directory**: Searchable directory of ISE alumni with profile information
- **Events Management**: Create, manage, and RSVP to alumni events
- **Announcements**: Share and view important announcements
- **Interactive Map**: Visualize alumni locations and movement paths
- **Profile Management**: Update and maintain your alumni profile
- **Dashboard**: Admin dashboard for managing users and content

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI Components**: ShadCN UI + Radix UI
- **Backend/Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm or Bun

## Getting Started

### Prerequisites

**All Platforms:**
- Docker Desktop ([macOS](https://docs.docker.com/desktop/install/mac-install/) | [Windows](https://docs.docker.com/desktop/install/windows-install/) | [Linux](https://docs.docker.com/desktop/install/linux-install/))
- **Access to the ISE Alumni Supabase project** (request access from the project maintainers - you'll need the project ref for setup)
- pnpm or Bun (the setup script will install Bun automatically)

**macOS:**
- [Homebrew](https://brew.sh/) - Required for installing dependencies

**Linux:**
- Homebrew (optional, but recommended) or curl/wget for installing tools

**Windows:**
- Git Bash or WSL2 (recommended) to run the bash scripts
- [Scoop](https://scoop.sh/) (recommended) for installing Supabase CLI

### Quick Start

**Before you begin:** Request access to the ISE Alumni Supabase project from a project maintainer. You'll need the project ref during setup.

```bash
# Clone the repository
git clone https://github.com/bxrne/ise-alumni.git
cd ise-alumni

# Run the automated setup (one-time only)
./scripts/setup
# This will:
# - Detect your OS (macOS/Linux/Windows) and install dependencies accordingly
# - Install Bun and Supabase CLI (if needed)
# - Install project dependencies
# - Prompt you to login to Supabase
# - Link to the ISE Alumni Supabase project (you'll be asked for the project ref)
# - Download Docker images and start local Supabase
# - Create .env.local for local development

# Start development (Supabase + Frontend)
./scripts/start
```

**Windows Users:** Run these scripts in Git Bash or WSL2. If you encounter issues, you may need to manually install [Bun](https://bun.sh/docs/installation#windows) and [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli) first.

#### Platform-Specific Notes

<details>
<summary><strong>macOS</strong></summary>

The setup script uses Homebrew to install Bun and Supabase CLI. Make sure you have Homebrew installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
</details>

<details>
<summary><strong>Linux</strong></summary>

The setup script will:
- Install Bun via the official installer script
- Install Supabase CLI via Homebrew (if available) or by downloading the binary

If you don't have Homebrew on Linux, the script will automatically download the Supabase CLI binary.
</details>

<details>
<summary><strong>Windows</strong></summary>

For the best experience on Windows:
1. Install [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) and run the scripts inside your WSL2 environment
2. Or use Git Bash and manually install:
   - Bun: `powershell -c "irm bun.sh/install.ps1|iex"`
   - Supabase CLI via [Scoop](https://scoop.sh/):
     ```powershell
     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
     scoop install supabase
     ```
3. Make sure Docker Desktop is configured to work with WSL2 (if using WSL2)
</details>

Or using your preferred package manager:
```bash
# Using Bun
bun run setup    # One-time setup
bun run start    # Start local development
bun run seed     # Optional: Add realistic sample data
bun run stop     # Stop all services (Supabase + dev server)

# Using pnpm
pnpm setup       # One-time setup
pnpm start       # Start local development
pnpm seed        # Optional: Add realistic sample data
pnpm stop        # Stop all services
```

### Adding Sample Data (Optional)

After starting your local environment, you can populate the database with realistic test data:

```bash
./scripts/seed-sample-data
# Or: bun run seed / pnpm seed

# Generate more alumni (default is 50)
./scripts/seed-sample-data --count 100
```

This creates:
- **100 alumni profiles** (default, configurable with `--count`)
  - Mix of BSc (2025-2029) and MSc (2026-2030) graduates
  - 50+ unique tech companies (Google, Stripe, Revolut, Tines, etc.)
  - Distributed across 28+ cities globally
  - Mix of user types (mostly Alum, some Staff/Admin)
  - *Note: Claude generated the seed script and chose only the most stereotypically Irish name possible. Apologies on it's behalf for the lack of diversity.*
- **50 events** (80% past, 20% upcoming) with tags
- **50 announcements** with varied deadlines
- **Residency partners** and records
- **14 common tags** for categorization

**All generated users have the password:** `password123`

**Note:** Running this script deletes the `test@example.com` user from seed.sql. Use any generated user to log in (e.g., check Supabase Studio at http://127.0.0.1:54323 > Authentication > Users for emails).

The development server will start on `http://localhost:5173`.

### Production Mode (⚠️ Use with caution)

To run the frontend connected to the production Supabase instance:

```bash
./scripts/start-with-prod
# Or: bun run start:prod
# Or: pnpm start:prod
```

**Warning**: This connects to LIVE DATA. Only use this for debugging production issues.

### Running Tests

```bash
# Run tests in watch mode
bun test        # or: pnpm test

# Run tests once
bun test:run    # or: pnpm test:run

# Run tests with coverage
bun test:coverage    # or: pnpm test:coverage

# Run tests in UI mode
bun test:ui     # or: pnpm test:ui
```

### Building for Production

```bash
bun run build    # or: pnpm build
```

## Database Migrations

### Migration Workflow

**IMPORTANT:** Do NOT use `supabase db pull` or `supabase db push` directly. All migrations are deployed through CI/CD.

#### Creating a New Migration

```bash
# 1. Create a new migration file
supabase migration new my_migration_name

# 2. Write your SQL changes in the generated file
#    Example: supabase/migrations/20260124160000_my_migration_name.sql

# 3. Test the migration locally
supabase db reset

# 4. Verify the migration works as expected
#    Check your local app and database to ensure everything works

# 5. Commit the migration file and open a PR
git add supabase/migrations/20260124160000_my_migration_name.sql
git commit -m "Add my_migration_name migration"
git push origin your-branch-name

# 6. Open a PR - migrations will be automatically applied to production when merged
```

#### Migration Rules

- ✅ **DO** write SQL migrations manually
- ✅ **DO** test locally with `supabase db reset`
- ✅ **DO** commit migration files to your PR
- ❌ **DON'T** use `supabase db pull` (creates drift between local and migrations)
- ❌ **DON'T** use `supabase db push` (CI/CD handles deployment)
- ❌ **DON'T** make schema changes via Supabase Studio on remote environments

**Deployment:** When your PR is merged to `main`, GitHub Actions automatically applies your migrations to the production database.

**Best Practice:** Treat migration files as the single source of truth. All schema changes must go through migrations in version control.

## Feature Flags

Some features may not be released to users but pushed regardless (they may be toggled over time). Feature flags are configured in [features.ts](./src/config/features.ts).

## Support

- **Issues**: [GitHub Issues](https://github.com/bxrne/ise-alumni/issues)

