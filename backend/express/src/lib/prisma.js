import { PrismaClient } from '@prisma/client'

// One client per process (avoids exhausting Postgres connections under
// node --watch's module reloads in dev).
export const prisma = globalThis.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
