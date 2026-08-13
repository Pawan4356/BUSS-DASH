# Local setup

## Prerequisites

- Node.js 20+
- Python 3.11+
- A local PostgreSQL instance

## 1. Install dependencies

```bash
# from the repo root — installs the frontend + Express workspaces
npm install

# FastAPI service
cd backend/fastapi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

## 2. Create a Postgres role and database

If you don't already have one, `.env.example`'s `DATABASE_URL` is a
placeholder, not real credentials — create a dedicated role/db:

```bash
sudo -u postgres psql -c "CREATE USER bussdash WITH PASSWORD 'bussdash' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE bussdash OWNER bussdash;"
```

`CREATEDB` is required because `prisma migrate dev` creates a disposable
"shadow database" on each run to diff migrations against — without it you'll
hit `P3014: permission denied to create database`.

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — set `DATABASE_URL` to match the role/db above (e.g.
`postgresql://bussdash:bussdash@localhost:5432/bussdash`) and set a real
`JWT_SECRET`. All three services (Express, FastAPI, and Prisma's CLI) read
this same file.

## 4. Create the schema and seed demo data

```bash
npm run prisma:migrate   # creates the tables from prisma/schema.prisma
npm run --workspace backend/express seed
```

The seed script creates one business with every entitlement flag turned on
and a login: `owner@demo.test` / `password123`.

## 5. Run the three services

```bash
npm run dev:express    # http://localhost:4000
npm run dev:fastapi    # http://localhost:8000
npm run dev:frontend   # http://localhost:5173
```

Open `http://localhost:5173` and sign in with the seed login above.

## Notes

- Express and FastAPI both read/write the same Postgres database — Prisma
  owns the schema (`prisma migrate`), FastAPI's SQLAlchemy models mirror the
  tables it touches. See `docs/decisions.md` #2 for why the two backends are
  split the way they are.
- If you change `prisma/schema.prisma`, re-run `npm run prisma:generate`
  before restarting Express so its Prisma Client matches.
