# ISE Alumni Portal - Justfile
# https://github.com/casey/just

# Default recipe - shows available commands
default:
    @just --list

# ============================================================================
# Setup and Development
# ============================================================================

# One-time setup: install Bun, Supabase CLI, create .env.local
setup:
    @echo "Setting up ISE Alumni Portal..."
    @just _detect-os
    @just _install-bun
    @just _install-deps
    @just _install-supabase
    @just _check-docker
    @just _login-supabase
    @just _link-project
    @just _start-supabase
    @just _create-env-local
    @echo ""
    @echo "Setup complete! Run: just start"

# Detect operating system (macos, linux, windows)
_detect-os:
    #!/bin/bash
    if [[ "$OSTYPE" == "darwin"* ]]; then echo "macos"; elif [[ "$OSTYPE" == "linux-gnu"* ]]; then echo "linux"; else echo "windows"; fi

# Install Bun if not present
_install-bun:
    #!/bin/bash
    if ! command -v bun &> /dev/null; then
        echo "Installing Bun..."
        OS=$(just _detect-os)
        if [ "$OS" = "macos" ]; then
            if ! command -v brew &> /dev/null; then echo "Install Homebrew first"; exit 1; fi
            brew install oven-sh/bun/bun
        elif [ "$OS" = "linux" ]; then
            curl -fsSL https://bun.sh/install | bash
        else
            echo "Install Bun manually: powershell -c 'irm bun.sh/install.ps1|iex'"; exit 1
        fi
    else
        echo "Bun already installed"
    fi

# Install project dependencies
_install-deps:
    bun install

# Install Supabase CLI if not present
_install-supabase:
    #!/bin/bash
    if ! command -v supabase &> /dev/null; then
        echo "Installing Supabase CLI..."
        OS=$(just _detect-os)
        if [ "$OS" = "macos" ]; then
            brew install supabase/tap/supabase
        elif [ "$OS" = "linux" ]; then
            if command -v brew &> /dev/null; then
                brew install supabase/tap/supabase
            else
                curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
                sudo mv supabase /usr/local/bin/
            fi
        else
            echo "Install via Scoop: scoop install supabase"; exit 1
        fi
    else
        echo "Supabase CLI already installed"
    fi

# Check if Docker is running
_check-docker:
    #!/bin/bash
    if ! docker info &> /dev/null; then
        echo "Docker is not running! Start Docker Desktop first."
        exit 1
    fi
    echo "Docker is running"

# Login to Supabase (if not already logged in)
_login-supabase:
    #!/bin/bash
    if ! supabase projects list &> /dev/null; then
        echo "Please login to Supabase..."
        supabase login
    else
        echo "Already logged in to Supabase"
    fi

# Link Supabase project (if not already linked)
_link-project:
    #!/bin/bash
    if [ ! -f "supabase/.temp/project-ref" ]; then
        echo "Enter Supabase project ref (e.g., cozbuiqfinmfylkqkdns):"
        read PROJECT_REF
        supabase link --project-ref "$PROJECT_REF"
    else
        echo "Project already linked"
    fi

# Start local Supabase
_start-supabase:
    echo "Starting Supabase..."
    supabase start

# Create .env.local file
_create-env-local:
    #!/bin/bash
    if [ -f ".env.local" ]; then
        echo ".env.local already exists, skipping"
    else
        echo "Creating .env.local..."
        ANON_KEY=$(supabase status | grep "Publishable" | awk -F '│' '{print $3}' | tr -d ' ')
        API_URL=$(supabase status | grep "Project URL" | awk -F '│' '{print $3}' | tr -d ' ')
        MAPBOX_TOKEN=""
        [ -f ".env" ] && MAPBOX_TOKEN=$(grep VITE_MAPBOX_TOKEN .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        [ -z "$MAPBOX_TOKEN" ] && read -p "Mapbox token (optional): " MAPBOX_TOKEN
        echo "VITE_SUPABASE_URL=$API_URL" > .env.local
        echo "VITE_SUPABASE_ANON_KEY=$ANON_KEY" >> .env.local
        echo "VITE_MAPBOX_TOKEN=$MAPBOX_TOKEN" >> .env.local
        echo "VITE_LOG_LEVEL=debug" >> .env.local
        echo "VITE_REACT_SCAN_ENABLED=true" >> .env.local
        echo "Created .env.local"
    fi

# Start local Supabase + frontend dev server
start: _check-env _check-docker
    #!/bin/bash
    cleanup() {
        echo ""
        if supabase status &> /dev/null; then
            read -p "Stop Supabase? [y/N]: " -n 1 -r
            [[ $REPLY =~ ^[Yy]$ ]] && supabase stop
        fi
        exit 0
    }
    trap cleanup SIGINT SIGTERM
    
    if supabase status &> /dev/null; then echo "Supabase already running"; else supabase start; fi
    echo ""
    echo "Supabase Studio: http://127.0.0.1:54323"
    echo "Frontend: http://localhost:5173"
    bun run dev -- --clearScreen false

# Check if .env.local exists
_check-env:
    #!/bin/bash
    if [ ! -f ".env.local" ]; then
        echo ".env.local not found. Run 'just setup' first!"
        exit 1
    fi

# Start frontend connected to production database (USE WITH CAUTION)
start-prod: _confirm-prod
    #!/bin/bash
    cleanup() { [ -f ".env.local.backup" ] && mv .env.local.backup .env.local; exit 0; }
    trap cleanup EXIT SIGINT SIGTERM
    [ -f ".env.local" ] && mv .env.local .env.local.backup
    echo "PRODUCTION MODE - LIVE DATA"
    bun run dev

# Production mode confirmation prompts
_confirm-prod:
    #!/bin/bash
    echo "WARNING: PRODUCTION MODE - Changes affect REAL DATA"
    read -p "Type YES to continue: " CONFIRM
    [ "$CONFIRM" != "YES" ] && exit 1
    read -p "Type 'ise-alumni' to confirm: " PROJECT_NAME
    [ "$PROJECT_NAME" != "ise-alumni" ] && exit 1

# Stop all services
stop:
    #!/bin/bash
    if supabase status &> /dev/null; then supabase stop; else echo "Supabase not running"; fi
    VITE_PIDS=$(pgrep -f "vite" 2>/dev/null); [ -n "$VITE_PIDS" ] && echo "$VITE_PIDS" | xargs kill 2>/dev/null || true
    BUN_PIDS=$(pgrep -f "bun.*dev" 2>/dev/null); [ -n "$BUN_PIDS" ] && echo "$BUN_PIDS" | xargs kill 2>/dev/null || true
    [ -f ".env.local.backup" ] && [ ! -f ".env.local" ] && mv .env.local.backup .env.local
    echo "Done"

# Start frontend only (without Supabase)
dev:
    bun run dev

# Build for production
build:
    bun run build

# Run ESLint
lint:
    bun run lint

# ============================================================================
# Database
# ============================================================================

# Reset local database (requires confirmation)
[confirm("This will DELETE all local data. Continue? [y/N] ")]
db-reset:
    supabase db reset

# Create a new migration file
db-migration-new name:
    supabase migration new {{name}}

# Seed sample data (default: 100 alumni profiles)
[confirm("This will add sample data. Continue? [y/N] ")]
seed count="100": _check-supabase-running
    #!/bin/bash
    SQL_FILE=$(mktemp)
    sed "s/FOR i IN 1..100/FOR i IN 1..{{count}}/" supabase/seed-sample-data.sql > "$SQL_FILE"
    docker exec -i supabase_db_ise-alumni psql -U postgres < "$SQL_FILE"
    rm -f "$SQL_FILE"
    echo "Seeded {{count}} alumni profiles, 50 events, 50 announcements"
    echo "All passwords: password123"

# Check if Supabase is running
_check-supabase-running:
    #!/bin/bash
    if ! docker ps | grep -q "supabase_db_ise-alumni"; then
        echo "Supabase is not running. Run 'just start' first."
        exit 1
    fi

# Login to Supabase
supabase-login:
    supabase login

# Check Supabase status
supabase-status:
    supabase status

# ============================================================================
# Testing
# ============================================================================

# Run tests in watch mode
test:
    bun test

# Run tests once
test-run:
    bun test:run

# Run tests with coverage
test-coverage:
    bun test:coverage

# Run tests in UI mode
test-ui:
    bun test:ui
