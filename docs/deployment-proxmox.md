# Deploying to Proxmox

This guide covers running the ISE Alumni Portal on a Proxmox host using Docker Compose with automatic updates via Watchtower, or as a bare Node.js process managed by systemd.

## Architecture

```
Internet
    │
    ▼
Caddy (reverse proxy, automatic TLS)
    │
    ▼
Hono server (port 3000)
    ├── /api/*        API + auth
    └── /*            built SPA from dist/
    │
    ▼
SQLite file (persisted via Docker volume)
```

A single Hono process handles everything. Caddy sits in front for HTTPS. Watchtower automatically pulls new images from GHCR when you merge to `main`.

## Option A: Docker Compose (Recommended)

### 1. Create an LXC container

In the Proxmox web UI, create a new unprivileged LXC container with a Debian 12 template. 1 CPU, 512 MB RAM, and 4 GB disk is enough. Enable nesting if you want Docker inside the container.

### 2. Install Docker

```bash
apt update && apt install -y docker.io docker-compose-plugin
systemctl enable --now docker
```

### 3. Authenticate with GHCR

Generate a [GitHub personal access token](https://github.com/settings/tokens) with `read:packages` scope. Log in once:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

Watchtower uses the saved credentials in `~/.docker/config.json` to poll for new images.

### 4. Create an env file

```bash
mkdir -p /opt/ise-alumni && cd /opt/ise-alumni

cat > .env <<'EOF'
BETTER_AUTH_SECRET=generate-a-real-secret-here
BETTER_AUTH_URL=https://alumni.yourdomain.com
PORT=3000
CORS_ORIGIN=https://alumni.yourdomain.com
EOF
```

The `DATABASE_URL` defaults to `file:/app/data/data.db` inside the container and does not need to be set unless you want to use Turso.

### 5. Copy docker-compose.yml and start

Copy the `docker-compose.yml` from the repository root to `/opt/ise-alumni/`, then:

```bash
docker compose up -d
```

This starts two services:

- **app** — the portal, with a named volume `app-data` persisting the SQLite database at `/app/data/`.
- **watchtower** — polls `ghcr.io/ise-alumni/portal:latest` every 30 seconds. When a new image appears, it pulls it, stops the old container, and starts a fresh one. The `--cleanup` flag removes old images.

Migrations run automatically on every container start. The schema uses `CREATE TABLE IF NOT EXISTS`, so they are idempotent.

### 6. Install Caddy

```bash
apt install -y caddy
```

Create `/etc/caddy/Caddyfile`:

```
alumni.yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
systemctl enable --now caddy
```

Caddy obtains a TLS certificate automatically via Let's Encrypt.

## Option B: Bare Node.js with systemd

Use this if you prefer not to run Docker.

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. Clone and build

```bash
mkdir -p /opt/ise-alumni && cd /opt/ise-alumni
git clone https://github.com/ISE-Alumni/portal.git .
pnpm install --frozen-lockfile
pnpm build
```

### 3. Create the env file

Same as Option A, step 4. Place it at `/opt/ise-alumni/.env`.

### 4. Run migrations and seed

```bash
cd /opt/ise-alumni
pnpm db:migrate
# Optionally seed if this is a fresh install:
# pnpm db:seed
```

### 5. Create a systemd service

```bash
cat > /etc/systemd/system/ise-alumni.service <<'EOF'
[Unit]
Description=ISE Alumni Portal
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ise-alumni
ExecStart=/usr/bin/node --import tsx server/index.ts
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/ise-alumni/.env
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
```

```bash
chown -R www-data:www-data /opt/ise-alumni
systemctl daemon-reload
systemctl enable --now ise-alumni
```

Check it is running:

```bash
systemctl status ise-alumni
curl -s http://localhost:3000/health
```

### 6. Install Caddy

Same as Option A, step 6.

## Using Turso Instead of Local SQLite

For production durability, point `DATABASE_URL` at a Turso cloud database:

```
DATABASE_URL=libsql://ise-alumni-yourorg.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

No other changes are needed. The Drizzle client handles both protocols transparently.

## Updating

### Docker Compose (automatic)

No action needed. Watchtower detects new images on GHCR and restarts the app container automatically. Migrations run on startup.

To check the current state:

```bash
docker compose ps
docker compose logs -f app
```

### Bare Node.js (manual)

```bash
cd /opt/ise-alumni
git pull
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate
systemctl restart ise-alumni
```

## Backups

If using local SQLite, back up the database file regularly:

```bash
# Docker: copy from the named volume
docker compose cp app:/app/data/data.db /backups/ise-alumni-$(date +%F).db
```

If using Turso, backups are handled by the Turso platform.
