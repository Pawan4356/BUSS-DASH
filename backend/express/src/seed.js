import './lib/loadEnv.js'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const business = await prisma.business.upsert({
    where: { id: 'demo-business' },
    update: {},
    create: {
      id: 'demo-business',
      name: 'Demo Business',
      verificationLevel: 'ENHANCED',
      recruitmentModelType: 'BOTH',
      flags: {
        create: {
          staffDirectory: true,
          staffRecruitment: true,
          staffAttendance: true,
          resourceDirectory: true,
          operationalScheduling: true,
          operationalSchedulingPremium: true,
        },
      },
    },
  })

  await prisma.account.upsert({
    where: { email: 'owner@demo.test' },
    update: {},
    create: {
      businessId: business.id,
      email: 'owner@demo.test',
      passwordHash,
      role: 'OWNER',
    },
  })

  console.log('Seeded demo business.')
  console.log('  Login: owner@demo.test / password123')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
