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

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum, point `DATABASE_URL` at your Postgres instance and
set a real `JWT_SECRET`. All three services (Express, FastAPI, and Prisma's
CLI) read this same file.

## 3. Create the schema and seed demo data

```bash
npm run prisma:migrate   # creates the tables from prisma/schema.prisma
npm run --workspace backend/express seed
```

The seed script creates one business with every entitlement flag turned on
and a login: `owner@demo.test` / `password123`.

## 4. Run the three services

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
