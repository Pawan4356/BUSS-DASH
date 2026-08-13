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

See `docs/setup.md` for local dev instructions (Postgres, Prisma migrate, running
both backend services and the frontend).
