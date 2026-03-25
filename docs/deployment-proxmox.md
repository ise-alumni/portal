# Deploying to Proxmox

This guide covers running the ISE Alumni Portal on a Proxmox host, either as a Docker container inside an LXC or as a bare Node.js process managed by systemd. Both approaches serve the API and the static frontend from a single process.

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
SQLite file (local) or Turso (cloud)
```

A single Hono process handles everything. Caddy sits in front for HTTPS.

## Option A: Docker in an LXC Container

### 1. Create an LXC container

In the Proxmox web UI, create a new unprivileged LXC container with a Debian 12 template. 1 CPU, 512 MB RAM, and 4 GB disk is enough. Enable nesting if you want Docker inside the container.

### 2. Install Docker

```bash
apt update && apt install -y docker.io docker-compose-plugin
systemctl enable --now docker
```

### 3. Build and transfer the image

On your dev machine:

```bash
just docker-build ise-alumni:latest
docker save ise-alumni:latest | gzip > ise-alumni.tar.gz
scp ise-alumni.tar.gz root@proxmox-lxc:/tmp/
```

On the LXC:

```bash
docker load < /tmp/ise-alumni.tar.gz
```

### 4. Create an env file

```bash
cat > /opt/ise-alumni/.env <<'EOF'
NODE_ENV=production
DATABASE_URL=file:/data/ise-alumni.db
TURSO_AUTH_TOKEN=
BETTER_AUTH_SECRET=generate-a-real-secret-here
BETTER_AUTH_URL=https://alumni.yourdomain.com
PORT=3000
CORS_ORIGIN=https://alumni.yourdomain.com
VITE_API_URL=https://alumni.yourdomain.com
VITE_MAPBOX_TOKEN=your_token
VITE_LOG_LEVEL=warn
EOF
```

### 5. Run the container

```bash
docker run -d \
  --name ise-alumni \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/ise-alumni/.env \
  -v /opt/ise-alumni/data:/data \
  ise-alumni:latest
```

The `-v` flag mounts a host directory so the SQLite database persists across container restarts.

Run migrations once:

```bash
docker exec ise-alumni node --import tsx server/migrate.ts
```

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
git clone https://github.com/bxrne/ise-alumni.git .
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

### Docker

```bash
# On dev machine
just deploy-build ise-alumni:latest
docker save ise-alumni:latest | gzip > ise-alumni.tar.gz
scp ise-alumni.tar.gz root@proxmox-lxc:/tmp/

# On the LXC
docker load < /tmp/ise-alumni.tar.gz
docker stop ise-alumni && docker rm ise-alumni
# Re-run the docker run command from step 5
docker exec ise-alumni node --import tsx server/migrate.ts
```

### Bare Node.js

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
cp /opt/ise-alumni/data/ise-alumni.db /backups/ise-alumni-$(date +%F).db
```

If using Turso, backups are handled by the Turso platform.
