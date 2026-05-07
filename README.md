# PingPath

Multi-tenant SaaS for vehicle GPS fleet tracking, built around the Concox GT06 hardware family. Targets the Bangladesh market: motorbike anti-theft, ride-sharing fleets, delivery riders, CNG/taxi operators, school vans, logistics.

See [`CLAUDE.md`](./CLAUDE.md) for the canonical product, architecture, and protocol specification. Read it before opening a PR.

---

## Quick start (local dev)

Bring up the data services:

```bash
cp .env.example .env
docker compose up -d
```

This starts:

| Service    | Port | Purpose                              |
|------------|------|--------------------------------------|
| PostgreSQL | 5432 | App database (PostGIS 3.4 enabled)   |
| Redis      | 6379 | Hot cache + location pub/sub channel |

The backend (Spring Boot + Netty TCP on `5023`) and frontend (Next.js on `3000`) are not yet implemented — that's Phase 1, see `CLAUDE.md` §16.

---

## Repository layout

```
pingpath/
├── CLAUDE.md             # Canonical spec — read first
├── docker-compose.yml    # Local Postgres + Redis
├── .env.example          # Required environment variables
├── backend/              # Spring Boot 3.3 + Netty + JdbcTemplate (Phase 1)
├── frontend/             # Next.js 15 + Tailwind + Mapbox (Phase 2)
├── infra/                # Terraform + Nginx config (Phase 6)
├── scripts/              # Device simulator, load test (Phase 1, Phase 6)
└── docs/                 # GT06 protocol notes, API ref, runbook
```

---

## Status

**Current phase:** Pre-Phase 1 — repo skeleton only. No application code yet.

See `CLAUDE.md` §16 for the 6-phase, 12-week build plan.
