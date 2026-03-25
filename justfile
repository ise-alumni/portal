# ISE Alumni Portal
# Run `just` to see all available recipes.

set dotenv-load

default:
    @just --list

# ==============================================================================
# Setup
# ==============================================================================

# Full first-time setup: install deps, create .env, migrate, and seed
setup: _ensure-pnpm _install _ensure-env db-reset
    @echo ""
    @echo "Setup complete. Run: just dev"

# Install project dependencies
_install:
    pnpm install

# Create .env from example if it does not exist
_ensure-env:
    #!/usr/bin/env bash
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Created .env from .env.example. Edit it with your tokens."
    else
        echo ".env already exists, skipping."
    fi

# Check that pnpm is available
_ensure-pnpm:
    #!/usr/bin/env bash
    if ! command -v pnpm &> /dev/null; then
        echo "pnpm not found. Install it: https://pnpm.io/installation"
        exit 1
    fi

# ==============================================================================
# Development
# ==============================================================================

# Start the API server and Vite frontend
dev:
    pnpm dev

# Start only the Vite frontend (no API server)
dev-client:
    pnpm dev:client

# Start only the Hono API server
dev-server:
    pnpm dev:server

# ==============================================================================
# Database
# ==============================================================================

# Run migrations against the local SQLite database
db-migrate:
    pnpm db:migrate

# Seed the local database with test data
db-seed:
    pnpm db:seed

# Drop, recreate, and seed the local database from scratch
db-reset:
    pnpm db:reset

# ==============================================================================
# Quality
# ==============================================================================

# Run ESLint
lint:
    pnpm lint

# Run tests in watch mode
test:
    pnpm test

# Run tests once
test-run:
    pnpm test:run

# Run tests with coverage report
test-coverage:
    pnpm test:coverage

# ==============================================================================
# Build
# ==============================================================================

# Build the frontend for production
build:
    pnpm build

# Preview the production build locally
preview:
    pnpm preview
