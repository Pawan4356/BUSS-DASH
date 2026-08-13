# BUSS-DASH — Multi-Module Business Dashboard

A business-account dashboard suite composed of five independently-gated modules:
Staff Directory, Staff Recruitment, Staff Attendance, Resource Directory, and
Operational Scheduling. Built from [`dashboard-system-spec-draft-v1.md`](./dashboard-system-spec-draft-v1.md).

## Tech stack

| Layer    | Choice                    |
|----------|---------------------------|
| Frontend | React + Redux Toolkit (RTK Query) + Vite |
| Backend  | Node.js/Express (CRUD + auth), Python/FastAPI (scheduling engine) |
| ORM      | Prisma                    |
| Database | PostgreSQL                |

## Project structure

```
/frontend                  React app (shell, modules, shared UI)
/backend/express            CRUD + auth service
/backend/fastapi            Scheduling/conflict-check engine
/prisma                     Shared Prisma schema (single Postgres DB, two services)
/docs                       Supplementary decisions and notes
```

## Decisions on the spec's open items

The spec draft left five items open before final handoff (§10). Since this build had
to proceed without a live back-and-forth, each was resolved with the most defensible
default and documented in [`docs/decisions.md`](./docs/decisions.md):

1. **Text-tag convention** — see `frontend/src/shared/ui-tags`.
2. **Express vs FastAPI split** — Express owns all CRUD/auth/entitlements; FastAPI
   owns only the Operational Scheduling conflict-check and utilization aggregation.
3. **`verification_level`** — modeled as a business account *attribute* (enum), not
   a purchasable flag.
4. **Resource Directory summary** — defined as Total Workspaces, Total Resources,
   Active Resources, Under Maintenance, Awaiting Scheduling.
5. **Database schema** — drafted in `prisma/schema.prisma`.

## Getting started

Prerequisites: Node.js 20+, Python 3.11+, a local PostgreSQL instance.

```bash
# 1. Install dependencies
npm install
cd backend/fastapi && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ../..

# 2. Create a Postgres role + database
sudo -u postgres psql -c "CREATE USER bussdash WITH PASSWORD 'bussdash' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE bussdash OWNER bussdash;"

# 3. Configure environment
cp .env.example .env
# edit .env: DATABASE_URL="postgresql://bussdash:bussdash@localhost:5432/bussdash"

# 4. Create the schema and load demo data
npm run prisma:migrate
npm run --workspace backend/express seed

# 5. Run all three services (separate terminals)
npm run dev:express    # http://localhost:4000
npm run dev:fastapi    # http://localhost:8000
npm run dev:frontend   # http://localhost:5173
```

Open `http://localhost:5173` and sign in with `owner@demo.test` / `password123`.

The seed script (`backend/express/src/seed.js`) loads a full presentation
dataset — 10 staff across every status, 3 workspaces, 11 resources, 4
recruitments in every stage with candidates and interview rounds, 15 days of
attendance history, and a mix of active/upcoming/completed scheduling
assignments. It's idempotent — re-run it any time to reset to a clean demo
state.

See `docs/setup.md` for troubleshooting notes (shadow-database permissions,
why `.env` lives at the repo root, etc.) and `docs/decisions.md` for the
reasoning behind every judgment call made while building this.
