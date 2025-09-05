# GreenGlowWebfolio — CI/CD with Docker on VPS (Debian + GitHub Actions)

This document explains how the application (frontend + backend + database) can be deployed to a **VPS with Docker Compose** using **GitHub Actions** for CI/CD.  
It is intended as an example of a simple, production-ready pipeline — using HTTP only (no domain/HTTPS).

---

## Overview

- **Repository**: public, single branch `main`
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
- **VPS Infrastructure**:
  - Docker & Docker Compose plugin
  - Application served on port `80` (HTTP)
- **Docker services**:
  - `web`: Nginx serving the React build + reverse proxy to `api:5000`
  - `api`: Node/Express (+ Prisma) exposed on port `5000`
  - `db`: PostgreSQL 16 (persistent Docker volume)

---

## Project Structure (deployment relevant)

```
.
├── client/              # React frontend
├── server/              # Express + Prisma backend
├── nginx.conf           # Nginx config (SPA + proxy /api)
├── docker-compose.yml   # Compose for web/api/db
└── .github/
    └── workflows/
        └── deploy.yml   # CI/CD workflow
```

---

## GitHub Environment Secrets

Create an Environment (e.g., `GreenGlowWebfolio`) in GitHub and configure the following secrets:

- `VPS_HOST` — IP address of the VPS (e.g., `123.45.67.89`)
- `VPS_USER` — SSH user (e.g., `debian`)
- `VPS_PASSWORD` — SSH password (or configure SSH key instead)
- `VPS_SSH_PORT` — SSH port (default: `22`)
- `VPS_DIR` — deployment directory on VPS (e.g., `/home/debian/greenglow`)
- `DB_PASSWORD` — persistent PostgreSQL password
- `JWT_SECRET` — persistent JWT secret

**Optional**
- `COOKIE_SECURE` — set to `true` only if HTTPS is enabled

---

## docker-compose.yml Highlights

- `db`: `postgres:16-alpine` + volume `greenglow_db_data`
- `api`: built from `server/Dockerfile`, runs migrations and seed via `entrypoint.sh`
- `web`: built with Vite → Nginx serving static files on port 80

---

## GitHub Actions Workflow

### Triggers
- `push` on `main`
- manual `workflow_dispatch`

### Steps
1. Checkout repo
2. Build minimal deployment bundle
3. Upload to VPS (via `scp-action`)
4. Deploy on VPS (via `ssh-action`):
   - Create `.env` file if missing
   - Run `docker compose build && docker compose up -d`

**Example `.env` file on VPS:**
```env
POSTGRES_DB=greenglow
POSTGRES_USER=greenglow
POSTGRES_PASSWORD=<DB_PASSWORD>
DATABASE_URL=postgresql://greenglow:<DB_PASSWORD>@db:5432/greenglow?schema=public

NODE_ENV=production
PORT=5000
JWT_SECRET=<JWT_SECRET>
SEED_ON_START=false
COOKIE_SECURE=false
```

---

## Database Seeding

- Prisma seed script (`server/prisma/seed.js`) is idempotent.
- To seed automatically at startup → set `SEED_ON_START=true` in `.env`.
- To run manually:
```bash
docker compose exec api node prisma/seed.js
```

---

## Useful Commands (on VPS)

```bash
# Status & logs
docker compose ps -a
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# Rebuild & restart
docker compose up -d --build

# Reset with DB loss
docker compose down -v --remove-orphans
```

---

## Prisma Migrations Workflow

1. Locally: update `schema.prisma` then run:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
2. Commit & push → CI/CD deploys
3. In production, migrations are applied automatically via `migrate deploy`.

---

## Access in Production

- **Frontend**: `http://<VPS_HOST>/`
- **API**: `http://<VPS_HOST>/api/...`

Example:
```bash
curl http://<VPS_HOST>/api/products
```

---

## Notes

This setup is meant for demonstration. For a production-ready environment, you should:
- Add HTTPS (reverse proxy with TLS)
- Use SSH keys instead of passwords
- Monitor logs and resources
