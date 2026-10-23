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


# Practical 11 — Testing the 3 implemented modules (BUSS-DASH)

Modules under test: **Authentication & Entitlement**, **Staff Directory**, **Staff Attendance**
Stack under test: the real repo code (Node/Express + Prisma). Tests run with **no database**:
Prisma is replaced by a small in-memory fake (`helpers/fakePrisma.js`), the Express routers and
middleware run unmodified.

## Setup (once)

The test suite is stored in `testScripts/` and runs against the existing
Express backend. From the repository root:

```bash
npm install
```

## Run

| Command | What it does |
|---|---|
| `npm run test --workspace backend/express` | all tests |
| `npm run test:blackbox --workspace backend/express` | black-box only |
| `npm run test:whitebox --workspace backend/express` | white-box only |
| `npm run test:coverage --workspace backend/express` | all tests + statement/branch coverage table (HTML in `coverage/index.html`) |

`tests/whitebox/entitlements.whitebox.test.js` also compares the frontend copy of the flag logic
(`frontend/src/shared/flags`) with the backend copy; it needs the repo's original folder layout
and is skipped with a warning otherwise.

## Layout

```
tests/
  helpers/        setup.js (env, TZ=UTC), fakePrisma.js (in-memory DB), testApp.js (app + tokens)
  blackbox/       auth / staffDirectory / staffAttendance  — HTTP in, HTTP out, no source knowledge
  whitebox/       entitlements, middleware, attendanceHelpers, staffHelpers, paths (route handlers),
                  knownDefects
  TEST_CASES.md   auto-generated register of every test case with its result
```

## Black-box techniques used (what to cite in the report)

| Technique | Where |
|---|---|
| Equivalence partitioning | login inputs (valid / wrong password / unknown user / missing fields), token classes (missing / malformed / wrong secret / expired / deleted account), status values |
| Boundary value analysis | late check-in 08:59 / 09:00 / 09:01, early check-out 16:59 / 17:00 / 17:01, stay time 0 / 1 min / negative, month history 1st & last day vs neighbouring months, yearsOfExperience = 0 |
| Decision table | flag combinations (directory x attendance) -> 200/403 (`TC-E0x`) |
| State transition | staff PENDING -> ACTIVE -> archived -> deleted; check-in -> check-out; status correction |
| CRUD life-cycle | create -> read -> update -> delete for staff |
| Security / error guessing | SQL-injection input, user enumeration, password-hash leak, tenant isolation (another business gets 404 / empty list), protected fields on PATCH |

## White-box techniques used

| Technique | Where |
|---|---|
| Statement + branch coverage | `npm run test:coverage` -> 100 % statements, 100 % branches on the 9 files of the 3 modules |
| Basis-path testing | `resolveModuleAccess` (19 paths, `P01`–`P19`), `PATCH /staff/:id` (`P1`–`P11`) |
| Condition coverage | `a \|\| b` in the scheduling prerequisite, `flags.resourceDirectory && ids`, `!checkIn \|\| !checkOut` |
| Internal-state checks | spies verify `$transaction` is used once, `staff.update` is skipped for empty bodies, only whitelisted keys reach the DB, `createMany` skipped for empty schedules |
| Frontend/backend parity | 2 304 flag/business combinations give identical results in both copies |

## Known defects found (tests `DEF-01` … `DEF-10`)

These tests assert the **correct** behaviour and are marked `it.fails`, so the suite stays green and
they flip to "unexpectedly passed" when someone fixes the code (then delete `.fails`).

| ID | Module | Defect |
|---|---|---|
| DEF-01 | Attendance | Sending only `checkOut` after a late check-in resets `lateCheckIn` to false |
| DEF-02 | Attendance | Mirror of DEF-01: sending only `checkIn` resets `earlyCheckOut` |
| DEF-03 | Attendance | Early check-out is judged against the end of the **first** working window only (split shifts wrong) |
| DEF-04 | Attendance | `?date=garbage` -> 500 instead of 400 |
| DEF-05 | Attendance | On a non-UTC server (e.g. IST) `/register` reports the previous calendar date |
| DEF-06 | Attendance | Unknown `status` value is not validated (no 400) |
| DEF-07 | Directory | Spec §5 "Holder role: Staff Manager" not enforced — role `STAFF` can delete staff |
| DEF-08 | Attendance | Spec §7 "Holder role: Attendance Manager" not enforced |
| DEF-09 | Directory | Work-responsibility checklist is not gated by purchased flags (spec §5) |
| DEF-10 | Directory | Same `accountId` can be invited twice in one business |

## Things to know

* **Logout** is client-side only (`frontend/src/app/authSlice.js` -> `loggedOut`). There is no
  server endpoint, so it is covered as "request without a token is refused" (`TC-A13`) plus a manual
  UI test-case you can add to the report.
* Tests pin `TZ=UTC` so date assertions are deterministic; DEF-05 switches to `Asia/Kolkata` on purpose.
* Not covered (outside these 3 modules): Recruitment, Resource Directory, Scheduling, and all React UI code.
