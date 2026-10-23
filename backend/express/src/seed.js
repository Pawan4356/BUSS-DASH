import './lib/loadEnv.js'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { computeLateEarly } from './lib/attendanceHelpers.js'
import { COMPANIES, LEGACY_BUSINESS_IDS, SEED_PASSWORD } from './seed-data/index.js'

// Seeds every company in seed-data/. Each run deletes and recreates those
// businesses (all child rows cascade), so the dataset is always fresh and
// relative to today. See docs/seed-data.md for what each company covers.

const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// ─── Dates ────────────────────────────────────────────────────────────────
// Attendance dates mirror startOfDay() in attendanceHelpers (local midnight)
// so seeded rows line up with what the register queries for "today" on any
// server timezone. Assignment dates are plain calendar dates (UTC midnight of
// the local date), which is what FastAPI compares against date.today().

function localMidnight(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d
}

function localAt(offsetDays, hhmm, shiftMinutes = 0) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = localMidnight(offsetDays)
  d.setHours(h, m + shiftMinutes, 0, 0)
  return d
}

function calendarDate(offsetDays = 0) {
  const d = localMidnight(offsetDays)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function dayKey(offsetDays = 0) {
  return DAY_KEYS[localMidnight(offsetDays).getDay()]
}

function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Deterministic 0..1 noise so attendance looks organic but is stable per seed run. */
function noise(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

// ─── Builders ─────────────────────────────────────────────────────────────

/** Expands [{ days, start, end }, { days, off: true }] into WorkingScheduleEntry rows. */
function expandSchedule(blocks = []) {
  return blocks.flatMap((block) =>
    block.days.map((dayOfWeek) =>
      block.off
        ? { dayOfWeek, isOff: true, startTime: null, endTime: null }
        : { dayOfWeek, isOff: false, startTime: block.start, endTime: block.end },
    ),
  )
}

function windowsFor(schedule, dow) {
  return schedule
    .filter((w) => w.dayOfWeek === dow && !w.isOff)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

async function createBusiness(company) {
  return prisma.business.create({
    data: {
      id: company.id,
      name: company.name,
      verificationLevel: company.verificationLevel,
      recruitmentModelType: company.recruitmentModelType,
      flags: { create: company.flags },
    },
  })
}

async function createAccounts(company, passwordHash) {
  for (const account of company.accounts) {
    await prisma.account.create({ data: { ...account, businessId: company.id, passwordHash } })
  }
}

async function createStaff(company) {
  const byKey = {}
  for (const person of company.staff ?? []) {
    const { key, schedule, responsibility, joinedDaysAgo, birthDate, archived, attendance, ...fields } = person
    const workingSchedule = expandSchedule(schedule)
    const staff = await prisma.staff.create({
      data: {
        ...fields,
        accountId: key,
        businessId: company.id,
        archived: Boolean(archived),
        dateOfJoining: joinedDaysAgo == null ? null : calendarDate(-joinedDaysAgo),
        dateOfBirth: birthDate ? new Date(`${birthDate}T00:00:00Z`) : null,
        workingSchedule: { create: workingSchedule },
        ...(responsibility && { workResponsibility: { create: responsibility } }),
      },
    })
    byKey[key] = { ...staff, workingSchedule, attendance }
  }
  return byKey
}

async function createResourceDirectory(company, staff) {
  const workspaces = {}
  for (const ws of company.workspaces ?? []) {
    const { subSpaces = [], responsible = [], ...fields } = ws
    const created = await prisma.workspace.create({
      data: {
        ...fields,
        businessId: company.id,
        subSpaces: { create: subSpaces.map((name) => ({ name })) },
        responsibleStaff: { create: responsible.map((key) => ({ staffId: staff[key].id })) },
      },
    })
    workspaces[ws.name] = created
  }

  const resources = {}
  for (const res of company.resources ?? []) {
    const { count = 1, workspaces: wsNames = [], responsible = {}, maintenance = [], ...fields } = res
    // Same "Name(n)" convention the API uses when a resource is added with quantity > 1.
    for (let i = 1; i <= count; i += 1) {
      const name = count > 1 ? `${res.name}(${i})` : res.name
      const owners = Array.isArray(responsible) ? responsible : responsible[i] ?? []
      resources[name] = await prisma.resource.create({
        data: {
          ...fields,
          name,
          businessId: company.id,
          businessStatus: maintenance.includes(i) ? 'MAINTENANCE' : fields.businessStatus ?? 'ACTIVE',
          workspaces: { create: wsNames.map((w) => ({ workspaceId: workspaces[w].id })) },
          responsibleStaff: { create: owners.map((key) => ({ staffId: staff[key].id })) },
        },
      })
    }
  }
  return { workspaces, resources }
}

async function createRecruitments(company, staff) {
  for (const rec of company.recruitments ?? []) {
    const { rounds = [], candidates = [], launchedDaysAgo, ...fields } = rec
    await prisma.recruitment.create({
      data: {
        ...fields,
        businessId: company.id,
        launchDate: launchedDaysAgo == null ? null : calendarDate(-launchedDaysAgo),
        interviewRounds: {
          create: rounds.map(({ dayOffset, interviewer, ...round }, i) => ({
            ...round,
            roundNumber: i + 1,
            date: dayOffset == null ? null : calendarDate(dayOffset),
            interviewerStaffId: interviewer && staff[interviewer] ? staff[interviewer].id : null,
            interviewerManualName: interviewer && !staff[interviewer] ? interviewer : null,
          })),
        },
        candidates: {
          create: candidates.map(({ appliedDaysAgo, ...c }) => ({ ...c, appliedDate: calendarDate(-appliedDaysAgo) })),
        },
      },
    })
  }
}

/**
 * Generates `company.attendanceDays` of history per staff member from their
 * working schedule and an attendance profile:
 *   punctual | late-prone | leaves-early | irregular
 * plus explicit per-day overrides ({ [-offset]: 'LEAVE' | 'ABSENT' | 'NO_CHECKOUT' }).
 * Today is generated against the real clock: shifts not yet started get no
 * row, shifts in progress are checked-in only, finished shifts are complete.
 */
async function createAttendance(company, staff) {
  const days = company.attendanceDays ?? 0
  const now = nowHHMM()
  const rows = []

  for (const [key, person] of Object.entries(staff)) {
    const profile = person.attendance
    if (!profile || person.archived) continue

    for (let offset = -days; offset <= 0; offset += 1) {
      const dow = dayKey(offset)
      const windows = windowsFor(person.workingSchedule, dow)
      const override = profile.overrides?.[offset]
      const base = { businessId: company.id, staffId: person.id, date: localMidnight(offset) }

      if (profile.type === 'on-leave') {
        if (windows.length) rows.push({ ...base, status: 'LEAVE' })
        continue
      }
      if (!windows.length) {
        rows.push({ ...base, status: 'OFF' })
        continue
      }
      if (override === 'LEAVE' || override === 'ABSENT') {
        rows.push({ ...base, status: override })
        continue
      }

      const first = windows[0]
      const last = windows[windows.length - 1]
      if (offset === 0 && now < first.startTime) continue // shift hasn't started yet

      const r = noise(`${key}:${offset}`)
      let inShift = -Math.round(r * 10) // 0..10 min early: on time
      let outShift = Math.round(r * 12) // 0..12 min after shift end
      if (profile.type === 'late-prone' && r < 0.45) inShift = 8 + Math.round(r * 40)
      if (profile.type === 'leaves-early' && r > 0.5) outShift = -(15 + Math.round(r * 50))
      if (profile.type === 'irregular') {
        if (r < 0.15) {
          rows.push({ ...base, status: 'ABSENT' })
          continue
        }
        if (r > 0.7) inShift = 5 + Math.round(r * 30)
        if (r < 0.3) outShift = -(10 + Math.round(r * 60))
      }

      const checkIn = localAt(offset, first.startTime, inShift)
      const shiftOver = offset < 0 || now > last.endTime
      const checkOut = override === 'NO_CHECKOUT' || !shiftOver ? null : localAt(offset, last.endTime, outShift)
      rows.push({ ...base, status: 'PRESENT', checkIn, checkOut, ...computeLateEarly({ checkIn, checkOut, dayWindows: windows }) })
    }
  }

  await prisma.attendanceRecord.createMany({ data: rows })
  return rows.length
}

/** Rough status so the list looks right before FastAPI's first recompute (it re-derives on read). */
function initialAssignmentStatus(a) {
  if (a.status === 'CANCELLED') return 'CANCELLED'
  if (a.endOffset != null && a.endOffset < 0) return 'COMPLETED'
  if (a.startOffset > 0) return 'UPCOMING'
  const now = nowHHMM()
  const today = dayKey(0)
  const live = a.windows.some((w) => (w.day === 'TODAY' ? today : w.day) === today && w.start <= now && now <= w.end)
  return live ? 'ACTIVE' : 'UPCOMING'
}

async function createAssignments(company, staff, directory) {
  for (const a of company.assignments ?? []) {
    // A one-off ("NONE") assignment runs on its start date, so its window day is derived from it.
    const windows = a.windows.map((w) => ({
      dayOfWeek: w.day === 'TODAY' || a.repeatPattern === 'NONE' ? dayKey(a.startOffset) : w.day,
      startTime: w.start,
      endTime: w.end,
    }))
    await prisma.assignment.create({
      data: {
        businessId: company.id,
        staffId: staff[a.staff].id,
        workspaceId: a.workspace ? directory.workspaces[a.workspace].id : null,
        resourceId: a.resource ? directory.resources[a.resource].id : null,
        repeatPattern: a.repeatPattern,
        repeatInterval: a.repeatInterval ?? null,
        startDate: calendarDate(a.startOffset),
        endDate: a.endOffset == null ? null : calendarDate(a.endOffset),
        note: a.note ?? null,
        status: initialAssignmentStatus(a),
        timeWindows: { create: windows },
      },
    })
  }
}

async function seedCompany(company, passwordHash) {
  await prisma.business.deleteMany({ where: { id: company.id } })
  await createBusiness(company)
  await createAccounts(company, passwordHash)
  const staff = await createStaff(company)
  const directory = await createResourceDirectory(company, staff)
  await createRecruitments(company, staff)
  const attendanceRows = await createAttendance(company, staff)
  await createAssignments(company, staff, directory)

  return {
    name: company.name,
    accounts: company.accounts.length,
    staff: Object.keys(staff).length,
    workspaces: Object.keys(directory.workspaces).length,
    resources: Object.keys(directory.resources).length,
    recruitments: company.recruitments?.length ?? 0,
    attendanceRows,
    assignments: company.assignments?.length ?? 0,
    owner: company.accounts.find((a) => a.role === 'OWNER')?.email,
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  // Older builds seeded a single placeholder business; drop it so it doesn't linger.
  await prisma.business.deleteMany({ where: { id: { in: LEGACY_BUSINESS_IDS } } })

  const summaries = []
  for (const company of COMPANIES) summaries.push(await seedCompany(company, passwordHash))

  console.table(
    summaries.map(({ owner, ...s }) => s),
    ['name', 'accounts', 'staff', 'workspaces', 'resources', 'recruitments', 'attendanceRows', 'assignments'],
  )
  console.log(`\nAll accounts use the password: ${SEED_PASSWORD}`)
  for (const s of summaries) console.log(`  ${s.name.padEnd(28)} owner → ${s.owner}`)
  console.log('\nFull account list: docs/seed-data.md')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
