# PARSOR <i>(Multi-Module Business Dashboard)</i>

PARSOR (internal codename **BUSS-DASH**) is a dashboard for running a business's people
and physical resources. A business buys the modules it needs, and each one is unlocked
independently:

| Module | What it does |
|---|---|
| **Staff Directory** | Invite and manage staff, weekly working schedules, work responsibilities, a live "who's on the floor today" timeline |
| **Staff Recruitment** | Recruitment drives (draft → launched → closed), interview rounds, candidate pipeline, hire a candidate straight into the directory |
| **Staff Attendance** | Daily attendance register (check-in / check-out, late and early flags, status corrections) and per-person monthly history |
| **Resource Directory** | Workspaces (with sub-spaces) and resources (equipment, vehicles, rooms…), maintenance state, responsible people |
| **Operational Scheduling** | Assign staff to workspaces/resources in time windows with conflict detection, utilisation summary and trends; the *premium* tier adds an hourly workload chart and per-staff schedules |

On top of the modules there is sign-in, a per-account **profile page** (name, job title,
contact details, timezone, avatar, password change) and a light/dark theme.

## Contents

1. [Architecture](#1-architecture)
2. [Getting started](#2-getting-started)
3. [Demo accounts](#3-demo-accounts)
4. [Entitlements: who can see what](#4-entitlements-who-can-see-what)
5. [Repository layout](#5-repository-layout)
6. [Backend: Express API](#6-backend-express-api)
7. [Backend: FastAPI scheduling engine](#7-backend-fastapi-scheduling-engine)
8. [Database](#8-database)
9. [Frontend](#9-frontend)
10. [Branding and theme](#10-branding-and-theme)
11. [Testing](#11-testing)
12. [Design decisions](#12-design-decisions)
13. [Known limitations](#13-known-limitations)
14. [Troubleshooting](#14-troubleshooting)

## 1. Architecture

![Image](docs/media/image1.png)

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Redux Toolkit + RTK Query, Vite 5 |
| CRUD / auth API | Node.js 20+, Express 4, Prisma 5, `jsonwebtoken`, `bcryptjs` |
| Scheduling engine | Python 3.11+, FastAPI, SQLAlchemy 2, `python-jose` |
| Database | PostgreSQL |
| Tests | Vitest, Supertest, V8 coverage |

- **One database, two services.** Prisma owns the schema and migrations. FastAPI reads and
  writes the same tables through SQLAlchemy models (`backend/fastapi/app/models.py`) that
  mirror the Prisma schema. Change the Prisma schema first, then update those models.
- **One token.** Express signs a JWT on login using `JWT_SECRET`. FastAPI verifies the
  same token with the same secret, so the frontend sends one token to both services.
- **One `.env`** at the repository root is shared by Prisma, Express, FastAPI and Vite.

## 2. Getting started

Prerequisites: **Node.js 20+**, **Python 3.11+**, a local **PostgreSQL** server.

```bash
# 1. Install JavaScript dependencies (npm workspaces: frontend + backend/express)
npm install

# 2. Install Python dependencies for the scheduling engine
cd backend/fastapi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ../..

# 3. Create a Postgres role and database
sudo -u postgres psql -c "CREATE USER bussdash WITH PASSWORD 'bussdash' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE bussdash OWNER bussdash;"

# 4. Configure the environment (file lives at the repo root)
cp .env.example .env
#   DATABASE_URL="postgresql://bussdash:bussdash@localhost:5432/bussdash"
#   JWT_SECRET="<any long random string>"

# 5. Create the schema and load demo data
npm run prisma:migrate
npm run --workspace backend/express seed

# 6. Start the three services (one terminal each)
npm run dev:express     # http://localhost:4000
npm run dev:fastapi     # http://localhost:8000  (activate the venv first)
npm run dev:frontend    # http://localhost:5173
```

Open <http://localhost:5173> and sign in with **`kavita.raman@meridianhealth.in`** /
**`Parsor@2026`**, the owner of the company that has every module unlocked.

### Environment variables (`.env`)

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Prisma, Express, FastAPI | Postgres connection string |
| `JWT_SECRET` | Express, FastAPI | Signs and verifies login tokens; **must be identical** for both |
| `PORT` | Express | API port (default `4000`) |
| `FASTAPI_PORT` | FastAPI | Port (default `8000`) |
| `VITE_EXPRESS_API_URL` | Frontend | Express base URL (default `http://localhost:4000`) |
| `VITE_FASTAPI_URL` | Frontend | FastAPI base URL (default `http://localhost:8000`) |

### npm scripts

| Command | What it does |
|---|---|
| `npm run dev:frontend` | Vite dev server |
| `npm run dev:express` | Express with `node --watch` (restarts on change) |
| `npm run dev:fastapi` | `uvicorn app.main:app --reload --port 8000` |
| `npm run prisma:migrate` | Apply migrations / create a new one from `schema.prisma` |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run --workspace backend/express seed` | Reset and reload the demo companies |
| `npm run build --workspace frontend` | Production build of the frontend into `frontend/dist` |
| `npm run lint --workspace frontend` | ESLint (React + hooks rules, config in `frontend/.eslintrc.cjs`) |
| `npm run test --workspace backend/express` | Run the test suite (see [Testing](#11-testing)) |
| `npm run test:cases --workspace backend/express` | Run the suite and regenerate `testScripts/tests/TEST_CASES.md` |

## 3. Demo accounts

The seed (`backend/express/src/seed.js`, data in `backend/express/src/seed-data/`, one
file per company) creates five companies chosen so that, between them, every module
state and every entitlement rule can be seen in the UI.

**Every seeded account uses the password `Parsor@2026`.**

| Company | Sign in as (owner) | Set-up | What it demonstrates |
|---|---|---|---|
| Meridian Health Clinic | `kavita.raman@meridianhealth.in` | ENHANCED, recruitment BOTH | Everything unlocked, including Scheduling Premium |
| Bluepeak Logistics | `harpreet.gill@bluepeaklogistics.com` | BASIC, recruitment INTERNAL | All modules but no Scheduling Premium; internal hiring only needs BASIC verification |
| Saffron Table Café | `meenakshi@saffrontable.in` | BASIC, recruitment B2C | Recruitment locked (B2C needs ENHANCED); Scheduling locked (no Resource Directory) |
| Lumen Design Studio | `tara.malhotra@lumenstudio.co` | BASIC, INTERNAL | Nothing purchased: every module shows its locked state |
| Lala Company | `pavan.chamar@lalacompany.in` | — | A light-hearted extra tenant with joke profiles and avatars |

Each company also has accounts for its other roles (Staff Manager, Recruitment Manager,
Attendance Manager, Resource Manager, Operations Manager, Staff).

The seed is **idempotent and date-relative**. Each run deletes the seeded companies (by
fixed ID, cascading to all child rows) and recreates them with joining dates, attendance
history, interview dates and assignment windows computed relative to *today*. The data
therefore always looks current: today's register shows people checked in right now,
people who have finished, and people whose shift hasn't started. Re-running it wipes UI
changes made in those companies, but leaves any business you created yourself alone.

Full account list, per-company counts, attendance personas, which record covers which
use case, and how to add seed data: **[`docs/seed-data.md`](./docs/seed-data.md)**.

## 4. Entitlements: who can see what

Each business has a `BusinessFlags` row (what was purchased), a `verificationLevel`
(`BASIC` / `ENHANCED`) and a `recruitmentModelType` (`INTERNAL` / `B2C` / `BOTH`).
`resolveModuleAccess(flagKey, { flags, business })` turns these into
`{ allowed, reason }`:

| Module | Allowed when | Otherwise `reason` |
|---|---|---|
| Staff Directory | `staffDirectory` purchased | `not-purchased` |
| Staff Attendance | `staffAttendance` purchased | `not-purchased` |
| Resource Directory | `resourceDirectory` purchased | `not-purchased` |
| Staff Recruitment | `staffRecruitment` purchased **and** verification is ENHANCED for `B2C`/`BOTH`, or BASIC/ENHANCED for `INTERNAL` | `not-purchased`, `requires-enhanced-verification` |
| Operational Scheduling | `operationalScheduling` purchased **and** Staff Directory **and** Resource Directory purchased | `not-purchased`, `requires-staff-and-resource-directory` |
| Scheduling Premium | Scheduling allowed **and** `operationalSchedulingPremium` purchased | as above |

The same logic exists in three places, kept in sync on purpose:

| Copy | Role |
|---|---|
| `backend/express/src/lib/entitlements.js` | **Authoritative.** The `requireFlag` middleware returns `403 { message, reason }` |
| `backend/fastapi/app/entitlements.py` | Same rules for the scheduling endpoints |
| `frontend/src/shared/flags/index.js` | UX only: sidebar lock icons, route guards (`RequireModule`), friendly "why it's locked" screens |

A white-box test checks the frontend and backend copies agree on all 2,304 flag/business
combinations.

Account **roles** (`OWNER`, `STAFF_MANAGER`, `RECRUITMENT_MANAGER`, `ATTENDANCE_MANAGER`,
`RESOURCE_MANAGER`, `OPERATIONS_MANAGER`, `STAFF`) are stored and shown, but are **not yet
enforced** by the API. Access is per business, not per role (see
[Known limitations](#13-known-limitations)).

## 5. Repository layout

![Image](docs/media/image2.png)

## 6. Backend: Express API

Base URL `http://localhost:4000`. Except for `/health` and `/auth/login`, every route
requires `Authorization: Bearer <token>`. Module routes also pass `requireFlag(...)`, so
a business without the module gets `403` with a `reason`. All data is scoped to the
caller's business: another tenant's IDs return `404`.

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/login` → `{ token, account, profile, business, flags }` · `GET /auth/me` (same shape, used to restore a session on reload) |
| Profile | `GET /profile` · `PATCH /profile` (name, job title, department, phone, location, timezone, avatar) · `POST /profile/password` |
| Staff Directory | `GET /staff-directory/summary` · `GET, POST /staff-directory/staff` · `GET, PATCH, DELETE /staff-directory/staff/:id` |
| Staff Recruitment | `GET /staff-recruitment/summary` · `GET, POST /recruitments` · `GET, PATCH /recruitments/:id` · `POST /recruitments/:id/{duplicate,launch,close}` · `GET, POST /recruitments/:id/candidates` · `GET, PATCH /candidates/:id` · `POST /candidates/:id/hire` |
| Staff Attendance | `GET /staff-attendance/summary` · `GET /staff-attendance/register?date=` · `PATCH /staff-attendance/register/:staffId` · `GET /staff-attendance/staff/:staffId/history` |
| Resource Directory | `GET /resource-directory/summary` · `GET, POST /workspaces` · `GET, PATCH, DELETE /workspaces/:id` · `GET, POST /resources` · `GET, PATCH, DELETE /resources/:id` |

(Recruitment and Resource Directory paths are relative to `/staff-recruitment` and
`/resource-directory`.)

Notes:

- Passwords are hashed with bcrypt. Tokens are HS256 JWTs carrying `accountId`, valid
  for 7 days.
- Avatars are either a preset key (e.g. `person-coral`) or an uploaded image stored as a
  data URL, which is why the JSON body limit is 1 MB.
- Attendance: a check-in after the start of the person's scheduled working window is
  flagged *late*, and a check-out before its end is flagged *early*
  (`lib/attendanceHelpers.js`). The tests use a 09:00–17:00 schedule.
- Errors are returned as `{ message }` with the matching HTTP status.

## 7. Backend: FastAPI scheduling engine

Base URL `http://localhost:8000`. Interactive docs at <http://localhost:8000/docs>.
Only the Operational Scheduling module lives here, because it needs the heavier logic:
overlap detection, status classification over repeat patterns, and utilisation
aggregation.

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check |
| `GET /scheduling/summary?date=` | Today's counts (active / upcoming / completed assignments, available resources) and a per-workspace utilisation breakdown; **premium** adds an hourly `workload` series |
| `GET /scheduling/summary/trend` | Utilisation over recent days (sparkline data) |
| `GET /scheduling/list` | Assignments grouped by workspace and resource; **premium** adds a per-staff schedule view |
| `POST /scheduling/assignments` | Create an assignment; returns **409 with the conflicts** if the staff member, workspace or resource is already booked in an overlapping window |
| `DELETE /scheduling/assignments/{id}` | Remove an assignment |

Assignments have a repeat pattern (`NONE` = one-off, `WEEKLY`, `CUSTOM`), a date range
and one or more time windows. Their status (`UPCOMING` / `ACTIVE` / `COMPLETED` /
`CANCELLED`) is recomputed from the
current date and time, and the operational status of workspaces/resources is refreshed
from it.

## 8. Database

`prisma/schema.prisma` is the source of truth. Main models:

| Group | Models |
|---|---|
| Tenancy | `Business` (verification level, recruitment model), `BusinessFlags` (purchased modules), `Account` (login, role, profile fields, avatar) |
| Staff | `Staff` (status `PENDING → ACTIVE`, archived), `WorkingScheduleEntry` (per day-of-week windows), `WorkResponsibility`, `WorkspaceResponsibility`, `ResourceResponsibility` |
| Recruitment | `Recruitment` (status, audience), `InterviewRound`, `Candidate` (source, status) |
| Attendance | `AttendanceRecord` (date, check-in/out, late/early flags, status) |
| Resources | `Workspace`, `SubSpace`, `Resource` (behaviour, scheduling required), `ResourceWorkspace` |
| Scheduling | `Assignment` (repeat pattern, date range, status), `AssignmentTimeWindow` |

Every business-owned row carries `businessId`, and deleting a business cascades to all
of its data. Migrations:

- `20260813165745_bussdash`: initial schema.
- `20261023104052_account_profile`: account profile fields and avatar.

When you change the schema: run `npm run prisma:migrate` (it creates a new migration and
regenerates the client), update the SQLAlchemy mirror in `backend/fastapi/app/models.py`
if FastAPI uses the table, and add fields to the seed data / fake test database as needed.

## 9. Frontend

- **Routing** (`src/App.jsx`): `/login` is public. Everything else sits inside
  `RequireAuth` → `Layout` (sidebar + content). Each module is mounted under its own path
  (`/staff-directory`, `/staff-recruitment`, `/staff-attendance`, `/resource-directory`,
  `/operational-scheduling`) and wrapped in `RequireModule`, which shows the "locked"
  reason instead of the page. `/` redirects to Staff Directory, `/profile` is the profile
  page, and unknown paths show `NotFound`.
- **State**: `authSlice` holds the token, account, profile, business and flags. The token
  is persisted in `localStorage`, and on reload `SessionBootstrap` calls `GET /auth/me`
  to restore the rest. Logout clears it client-side.
- **Data**: RTK Query, with one base API per backend (`api/baseApi.js` for Express,
  `api/schedulingBaseApi.js` for FastAPI). Each module has its own `api.js` injecting
  endpoints, with cache tags for invalidation.
- **Module structure**: `modules/<module>/routes.jsx` (its route list), `api.js`
  (endpoints), and page components (list / detail / modals).
- **Shared UI** (`shared/components`): `Modal`, `ConfirmDialog`, `Tabs`, `KebabMenu`,
  `SearchInput`, `DatePicker`, `TimeWindowPicker`, `RepeatPatternPicker`, `StatusBadge`,
  `SummaryStats`, `EmptyState`, `TableSkeleton`, `Toast`, `Avatar`, `PersonCell`,
  `ScrollArea`, `DetailHeader`, `NotFound`, `ParsorLogo`.
- **Labels**: every user-visible field name and status label comes from
  `shared/ui-tags` rather than being hard-coded per module.

## 10. Branding and theme

- **Logo**: `ParsorLogo` (`shared/components/ParsorLogo.jsx`) draws the "parsor" wordmark
  in DM Sans Bold. The "p" has a brass doorway in its counter and the "o" is a clock.
  `ParsorMark` is the "p" on its own, used for icons. It is drawn in `currentColor`, so it
  adapts to light and dark backgrounds. The brass accent comes from the `--logo-accent`
  CSS variable. The original kit (SVGs, CSS, component) lives in
  `frontend/public/parsor-logo-kit/`, and `frontend/public/favicon.svg` is the app icon.
- **Sidebar**: always dark. It shows the logo, the signed-in company's name with a small
  animated brass wave underneath (static when the OS asks for reduced motion), the module
  list with lock states, and the account / theme / logout controls.
- **Theme**: `shared/styles/theme.css` defines colour, spacing and type tokens on `:root`.
  Dark mode follows the OS by default and can be toggled. The choice is stored in
  `localStorage` and applied as `data-theme` on `<html>`. Fonts: DM Sans (UI) and Young
  Serif (page titles).

## 11. Testing

The test suite lives in **`testScripts/`** and tests the real Express code **without a
database**. Prisma is swapped for an in-memory fake (`tests/helpers/fakePrisma.js`), while
the routers and middleware run unmodified. Its scope is **Authentication & Entitlements,
Staff Directory, Staff Attendance and the Account Profile**: 325 test cases, with 100%
statement and branch coverage on the 11 files in scope.

| Command (from repo root) | Runs |
|---|---|
| `npm run test --workspace backend/express` | All tests |
| `npm run test:blackbox --workspace backend/express` | Black-box tests only |
| `npm run test:whitebox --workspace backend/express` | White-box tests only |
| `npm run test:coverage --workspace backend/express` | All tests + coverage (HTML in `coverage/index.html`) |
| `npm run test:cases --workspace backend/express` | Runs the suite and regenerates `TEST_CASES.md` |

```
testScripts/
├── vitest.config.js        Config; coverage limited to the files in scope
├── generateTestCases.js    Writes tests/TEST_CASES.md from a JSON test run
└── tests/
    ├── helpers/            setup.js (env, TZ=UTC), fakePrisma.js, testApp.js (app + tokens)
    ├── blackbox/           auth, staffDirectory, staffAttendance, profile: HTTP in, HTTP out
    ├── whitebox/           entitlements, middleware, attendance/staff/profile helpers,
    │                       route paths, knownDefects
    ├── README.md           Techniques used and where (for the testing report)
    └── TEST_CASES.md       Register of every test case and its result
```

**Black-box techniques:**
- **Equivalence partitioning:** login inputs, token classes, profile field types, avatar
  formats.
- **Boundary values:**
  - late check-in at 08:59 / 09:00 / 09:01, early check-out at 16:59 / 17:00 / 17:01;
  - month edges;
  - profile field length 120 / 121, avatar size 500,000 / 500,001, password length 7 / 8.
- **Decision table** for flag combinations.
- **State transitions:** staff `PENDING → ACTIVE → archived → deleted`, check-in →
  check-out, password change.
- **CRUD life cycle** for staff.
- **Security / error guessing:** SQL injection, user enumeration, password-hash leaks,
  tenant isolation, protected fields, SVG avatars.

**White-box techniques:**
- 100% statement and branch coverage.
- **Basis-path testing:** `resolveModuleAccess` P01–P19, `PATCH /staff/:id` P1–P11, the
  `/profile` handlers.
- Condition coverage.
- **Internal-state checks with spies:** a single `$transaction`, only whitelisted fields
  written, no write on rejected profile or password requests.
- **Frontend/backend parity:** entitlement logic and the avatar preset list.

**Known defects (`DEF-01` … `DEF-10`):** these tests assert the *correct* behaviour and
are marked `it.fails`, so the suite stays green. When a defect is fixed its test starts
"unexpectedly passing"; remove `.fails` then.

| ID | Module | Defect |
|---|---|---|
| DEF-01 | Attendance | Sending only `checkOut` after a late check-in resets `lateCheckIn` to false |
| DEF-02 | Attendance | Sending only `checkIn` resets `earlyCheckOut` |
| DEF-03 | Attendance | Early check-out is judged against the first working window only (split shifts are wrong) |
| DEF-04 | Attendance | `?date=garbage` returns 500 instead of 400 |
| DEF-05 | Attendance | On a non-UTC server (e.g. IST) `/register` reports the previous calendar date |
| DEF-06 | Attendance | An unknown `status` value is not rejected with 400 |
| DEF-07 | Directory | Role `STAFF` can delete staff (Staff Manager role not enforced) |
| DEF-08 | Attendance | Attendance Manager role not enforced |
| DEF-09 | Directory | Work-responsibility checklist is not gated by purchased flags |
| DEF-10 | Directory | The same `accountId` can be invited twice in one business |

Not covered by automated tests: Recruitment, Resource Directory, Scheduling (FastAPI) and
the React UI. When you change the code in scope, add or adjust tests, then run
`test:coverage` (should stay at 100%) and `test:cases`.


## 12. Design decisions

The original specification left several things open. Each was closed with a
defensible default, and code comments refer to these by number
(e.g. "README.md › Design decisions #2").

1. **Label convention.** The spec spelled labels inconsistently between modules
   ("Business Status" / `business_status` / `businss_status`). All display labels live in
   `frontend/src/shared/ui-tags` as `SCREAMING_SNAKE` constants holding Title Case text,
   and every module imports them from there.
2. **Express vs FastAPI split.** Express owns everything CRUD/auth: four modules, the
   profile and the entitlement middleware. FastAPI owns only the Operational Scheduling
   compute path (conflict checks on create, status recomputation, utilisation/workload
   aggregation). It reads and writes the same Postgres tables through SQLAlchemy, and no
   table is FastAPI-only.
3. **`verificationLevel`** is an attribute of the business (`BASIC` | `ENHANCED`), not a
   purchasable flag, so it isn't in `BusinessFlags`. Recruitment gating reads it from the
   business record.
4. **Resource Directory summary** shows Total Workspaces, Total Resources, Active
   Resources, Under Maintenance and Awaiting Scheduling. "Awaiting Scheduling" means
   `schedulingRequired = true` with no current assignment.
5. **Database modelling.**
   - Fields the spec marks "+ custom" (employment type, category…) are plain `String`
     columns: the UI offers presets from `ui-tags` plus free text.
   - Truly closed sets (statuses, repeat pattern, day of week…) are Prisma enums.
   - Staff ↔ workspace/resource responsibility are join tables.
   - Weekly *availability* (`WorkingScheduleEntry`) and booked *time blocks*
     (`AssignmentTimeWindow`) are separate tables even though they share a picker UI.
6. **"Offers Sent"** (Recruitment summary). The candidate statuses are Applied /
   Shortlisted / Rejected / Hired, with no "Offered" state, so Offers Sent is approximated
   as the number of Shortlisted candidates.
7. **Utilisation maths** (Scheduling). The spec defines no business hours. Each day is
   therefore a 24-hour capacity window, staff overtime is time beyond an 8-hour day, and a
   resource in `MAINTENANCE` counts the whole day as maintenance hours. What's left is
   downtime.
8. **Total / Available counts** (Scheduling "today" panel). Total = active entities of
   that type. Available = Total minus those with an `ACTIVE` assignment right now, i.e.
   free capacity.
9. **Entitlement logic is duplicated on purpose.** The backend is authoritative, and the
   frontend copy only avoids a round-trip before hiding or redirecting. A parity test
   guards against drift.
10. **A single root `.env`.** Vite (`envDir: '../'`), Express (`lib/loadEnv.js`) and
    FastAPI all read the same file, so ports, URLs and `JWT_SECRET` can't drift apart.
11. **Avatars** are stored on the account as `preset:<key>` (built-in illustrations) or a
    `data:image/png|jpeg|webp` URL. The client resizes uploads to 256×256 and the server
    caps them at 500,000 characters. SVG is rejected because it can carry script. The
    preset list exists in both `lib/profileHelpers.js` and `shared/components/Avatar.jsx`,
    and a test keeps the two identical.

The original spec (`dashboard-system-spec-draft-v1.md`) and the earlier `docs/decisions.md`
/ `docs/setup.md` were removed in commit `d882396`. Their content is folded into this
README, and the originals are still in git history.
