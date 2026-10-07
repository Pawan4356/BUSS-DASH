// Minimal in-memory stand-in for the Prisma client. It implements only the
// calls the three modules make, so HTTP tests run without PostgreSQL.
let seq = 0
const newId = (p) => `${p}_${++seq}`

function matchValue(actual, cond) {
  if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
    if ('contains' in cond) {
      if (actual == null) return false
      const a = String(actual)
      const b = String(cond.contains)
      return cond.mode === 'insensitive' ? a.toLowerCase().includes(b.toLowerCase()) : a.includes(b)
    }
    if ('gte' in cond || 'lt' in cond) {
      const t = +actual
      return (cond.gte === undefined || t >= +cond.gte) && (cond.lt === undefined || t < +cond.lt)
    }
  }
  if (cond instanceof Date) return actual instanceof Date && +actual === +cond
  return actual === cond
}

function matches(row, where = {}, db) {
  return Object.entries(where).every(([k, v]) => {
    if (v === undefined) return true
    if (k === 'OR') return v.some((w) => matches(row, w, db))
    if (k === 'workResponsibility') {
      const wr = db.workResponsibility.find((r) => r.staffId === row.id)
      return Object.entries(v).every(([f, val]) => wr?.[f] === val)
    }
    return matchValue(row[k], v)
  })
}

export function createFakePrisma() {
  const db = {
    business: [],
    account: [],
    staff: [],
    workingScheduleEntry: [],
    workResponsibility: [],
    workspaceResponsibility: [],
    resourceResponsibility: [],
    attendanceRecord: [],
  }

  const withStaffIncludes = (s, include) => {
    if (!s || !include) return s
    const out = { ...s }
    if (include.workingSchedule) {
      const w = include.workingSchedule.where ?? {}
      out.workingSchedule = db.workingScheduleEntry.filter((e) => e.staffId === s.id && matches(e, w, db))
    }
    if (include.workResponsibility) {
      out.workResponsibility = db.workResponsibility.find((r) => r.staffId === s.id) ?? null
    }
    if (include.workspaceResponsibilities) {
      out.workspaceResponsibilities = db.workspaceResponsibility
        .filter((r) => r.staffId === s.id)
        .map((r) => ({ ...r, workspace: { id: r.workspaceId, name: `WS ${r.workspaceId}` } }))
    }
    if (include.resourceResponsibilities) {
      out.resourceResponsibilities = db.resourceResponsibility
        .filter((r) => r.staffId === s.id)
        .map((r) => ({ ...r, resource: { id: r.resourceId, name: `RES ${r.resourceId}` } }))
    }
    if (include.attendanceRecords) {
      const w = include.attendanceRecords.where ?? {}
      out.attendanceRecords = db.attendanceRecord.filter((r) => r.staffId === s.id && matches(r, w, db))
    }
    return out
  }

  const prisma = {
    _db: db,

    business: {
      findUnique: async ({ where, include }) => {
        const b = db.business.find((x) => x.id === where.id)
        return b ? { ...b, ...(include?.flags && { flags: b.flags ?? null }) } : null
      },
    },

    account: {
      findUnique: async ({ where, include }) => {
        const a = db.account.find((x) => (where.id ? x.id === where.id : x.email === where.email))
        if (!a) return null
        if (!include?.business) return a
        const b = db.business.find((x) => x.id === a.businessId)
        return { ...a, business: { ...b, flags: b.flags ?? null } }
      },
    },

    staff: {
      count: async ({ where }) => db.staff.filter((s) => matches(s, where, db)).length,
      findMany: async ({ where, include, orderBy } = {}) => {
        let rows = db.staff.filter((s) => matches(s, where, db))
        if (orderBy?.createdAt === 'desc') rows = [...rows].sort((a, b) => b.createdAt - a.createdAt)
        return rows.map((s) => withStaffIncludes(s, include))
      },
      findFirst: async ({ where, include }) =>
        withStaffIncludes(db.staff.find((s) => matches(s, where, db)), include) ?? null,
      findUnique: async ({ where, include }) =>
        withStaffIncludes(db.staff.find((s) => s.id === where.id), include) ?? null,
      create: async ({ data, include }) => {
        const now = new Date(Date.now() + seq) // strictly increasing createdAt
        const row = {
          id: newId('staff'), accountId: null, firstName: null, lastName: null, phoneNumber: null,
          gender: null, dateOfBirth: null, profilePhoto: null, title: null, dateOfJoining: null,
          yearsOfExperience: null, qualifications: null, pastExperience: null, employmentType: null,
          status: 'PENDING', archived: false, createdAt: now, updatedAt: now, ...data,
        }
        db.staff.push(row)
        return withStaffIncludes(row, include)
      },
      update: async ({ where, data }) => {
        const row = db.staff.find((s) => s.id === where.id)
        Object.assign(row, data, { updatedAt: new Date() })
        return row
      },
      delete: async ({ where }) => {
        db.staff = db.staff.filter((s) => s.id !== where.id)
        prisma._db.staff = db.staff
        for (const k of ['workingScheduleEntry', 'workResponsibility', 'workspaceResponsibility', 'resourceResponsibility', 'attendanceRecord']) {
          db[k] = db[k].filter((r) => r.staffId !== where.id)
        }
      },
    },

    workingScheduleEntry: {
      findMany: async ({ where, orderBy } = {}) => {
        let rows = db.workingScheduleEntry.filter((e) => matches(e, where, db))
        if (orderBy?.startTime === 'asc') rows = [...rows].sort((a, b) => (a.startTime > b.startTime ? 1 : -1))
        return rows
      },
      deleteMany: async ({ where }) => {
        db.workingScheduleEntry = db.workingScheduleEntry.filter((e) => !matches(e, where, db))
      },
      createMany: async ({ data }) => {
        data.forEach((d) => db.workingScheduleEntry.push({ id: newId('wse'), startTime: null, endTime: null, ...d }))
      },
    },

    workResponsibility: {
      upsert: async ({ where, create, update }) => {
        const existing = db.workResponsibility.find((r) => r.staffId === where.staffId)
        if (existing) return Object.assign(existing, update)
        const row = { staffRecruitment: false, staffAttendance: false, operationalScheduling: false, ...create }
        db.workResponsibility.push(row)
        return row
      },
    },

    workspaceResponsibility: {
      deleteMany: async ({ where }) => {
        db.workspaceResponsibility = db.workspaceResponsibility.filter((r) => r.staffId !== where.staffId)
      },
      createMany: async ({ data }) => db.workspaceResponsibility.push(...data),
    },

    resourceResponsibility: {
      deleteMany: async ({ where }) => {
        db.resourceResponsibility = db.resourceResponsibility.filter((r) => r.staffId !== where.staffId)
      },
      createMany: async ({ data }) => db.resourceResponsibility.push(...data),
    },

    attendanceRecord: {
      findMany: async ({ where, orderBy } = {}) => {
        let rows = db.attendanceRecord.filter((r) => matches(r, where, db))
        if (orderBy?.date === 'asc') rows = [...rows].sort((a, b) => a.date - b.date)
        return rows
      },
      upsert: async ({ where, create, update }) => {
        const { staffId, date } = where.staffId_date
        const existing = db.attendanceRecord.find((r) => r.staffId === staffId && +r.date === +date)
        if (existing) return Object.assign(existing, update)
        const row = { id: newId('att'), ...create }
        db.attendanceRecord.push(row)
        return row
      },
    },

    $transaction: async (fn) => fn(prisma),
  }
  return prisma
}

// ---- seed helpers -------------------------------------------------------
export function seedBusiness(prisma, { id = 'biz1', flags = {}, verificationLevel = 'BASIC', recruitmentModelType = 'INTERNAL' } = {}) {
  const allOn = {
    staffDirectory: true, staffRecruitment: false, staffAttendance: true,
    resourceDirectory: false, operationalScheduling: false, operationalSchedulingPremium: false,
  }
  const business = {
    id, name: `Business ${id}`, verificationLevel, recruitmentModelType,
    flags: flags === null ? null : { ...allOn, ...flags },
  }
  prisma._db.business.push(business)
  return business
}

export function seedAccount(prisma, { id, businessId = 'biz1', email, passwordHash, role = 'OWNER' }) {
  const acc = { id, businessId, email, passwordHash, role }
  prisma._db.account.push(acc)
  return acc
}

export function seedStaff(prisma, data) {
  const row = {
    id: newId('staff'), businessId: 'biz1', accountId: null, firstName: null, lastName: null,
    phoneNumber: null, title: null, employmentType: null, status: 'ACTIVE', archived: false,
    createdAt: new Date(), updatedAt: new Date(), ...data,
  }
  prisma._db.staff.push(row)
  return row
}

export function seedSchedule(prisma, staffId, entries) {
  entries.forEach((e) => prisma._db.workingScheduleEntry.push({ id: newId('wse'), staffId, isOff: false, startTime: null, endTime: null, ...e }))
}
