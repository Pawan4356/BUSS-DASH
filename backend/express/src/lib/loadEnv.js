import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// .env lives at the monorepo root (shared with FastAPI/Prisma), not in this
// package — plain `dotenv/config` only checks process.cwd(), which npm sets
// to this workspace dir when run via `npm run --workspace`. See docs/setup.md.
const rootEnvPath = path.resolve(fileURLToPath(import.meta.url), '../../../../../.env')
config({ path: rootEnvPath })
