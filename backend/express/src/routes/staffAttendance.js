import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireFlag } from '../middleware/requireFlag.js'
import { FLAGS } from '../lib/entitlements.js'
import { computeLateEarly, dayOfWeekForDate, startOfDay, stayTimeMinutes } from '../lib/attendanceHelpers.js'

export const staffAttendanceRouter = Router()
staffAttendanceRouter.use(requireAuth, requireFlag(FLAGS.STAFF_ATTENDANCE))

staffAttendanceRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const today = startOfDay()
    const staff = await prisma.staff.findMany({
      where: { businessId: req.businessId, archived: false },
      select: { id: true },
    })
    const records = await prisma.attendanceRecord.findMany({
      where: { businessId: req.businessId, date: today },
    })
    const byStaff = new Map(records.map((r) => [r.staffId, r]))

    let present = 0
    let absent = 0
    let leave = 0
    let off = 0
    let lateCheckIns = 0
    let earlyCheckOuts = 0

    for (const s of staff) {
      const record = byStaff.get(s.id)
      const status = record?.status ?? 'ABSENT'
      if (status === 'PRESENT') present += 1
      else if (status === 'LEAVE') leave += 1
      else if (status === 'OFF') off += 1
      else absent += 1
      if (record?.lateCheckIn) lateCheckIns += 1
      if (record?.earlyCheckOut) earlyCheckOuts += 1
    }

    res.json({
      totalStaff: staff.length,
      presentToday: present,
      absentToday: absent,
      onLeave: leave,
      offToday: off,
      lateCheckIns,
      earlyCheckOuts,
    })
  }),
)

staffAttendanceRouter.get(
  '/register',
  asyncHandler(async (req, res) => {
    const date = startOfDay(req.query.date)
    const dayOfWeek = dayOfWeekForDate(date)
    const { search, status } = req.query

    const staff = await prisma.staff.findMany({
      where: {
        businessId: req.businessId,
        archived: false,
        ...(search && {
          OR: [
            { firstName: { contains: String(search), mode: 'insensitive' } },
            { lastName: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        workingSchedule: { where: { dayOfWeek } },
        attendanceRecords: { where: { date } },
      },
    })

    const rows = staff
      .map((s) => {
        const record = s.attendanceRecords[0]
        const daySchedule = s.workingSchedule
        return {
          staffId: s.id,
          name: [s.firstName, s.lastName].filter(Boolean).join(' ') || null,
          workingSchedule: daySchedule.map((w) => (w.isOff ? { isOff: true } : { start: w.startTime, end: w.endTime })),
          checkIn: record?.checkIn ?? null,
          checkOut: record?.checkOut ?? null,
          status: record?.status ?? 'ABSENT',
          stayTimeMinutes: record ? stayTimeMinutes(record.checkIn, record.checkOut) : null,
        }
      })
      .filter((row) => !status || row.status === status)

    res.json({ date: date.toISOString().slice(0, 10), rows })
  }),
)

staffAttendanceRouter.patch(
  '/register/:staffId',
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findFirst({ where: { id: req.params.staffId, businessId: req.businessId } })
    if (!staff) return res.status(404).json({ message: 'Staff member not found' })

    const date = startOfDay(req.query.date)
    const dayOfWeek = dayOfWeekForDate(date)
    const dayWindows = await prisma.workingScheduleEntry.findMany({
      where: { staffId: staff.id, dayOfWeek, isOff: false },
      orderBy: { startTime: 'asc' },
    })

    const { checkIn, checkOut, status } = req.body
    const { lateCheckIn, earlyCheckOut } = computeLateEarly({ checkIn, checkOut, dayWindows })

    const record = await prisma.attendanceRecord.upsert({
      where: { staffId_date: { staffId: staff.id, date } },
      create: {
        businessId: req.businessId,
        staffId: staff.id,
        date,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status ?? 'PRESENT',
        lateCheckIn,
        earlyCheckOut,
      },
      update: {
        ...(checkIn !== undefined && { checkIn: checkIn ? new Date(checkIn) : null }),
        ...(checkOut !== undefined && { checkOut: checkOut ? new Date(checkOut) : null }),
        ...(status && { status }),
        lateCheckIn,
        earlyCheckOut,
      },
    })

    res.json({
      staffId: record.staffId,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      lateCheckIn: record.lateCheckIn,
      earlyCheckOut: record.earlyCheckOut,
      stayTimeMinutes: stayTimeMinutes(record.checkIn, record.checkOut),
    })
  }),
)

staffAttendanceRouter.get(
  '/staff/:staffId/history',
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findFirst({ where: { id: req.params.staffId, businessId: req.businessId } })
    if (!staff) return res.status(404).json({ message: 'Staff member not found' })

    const month = req.query.month ?? new Date().toISOString().slice(0, 7)
    const start = new Date(`${month}-01T00:00:00.000Z`)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)

    const records = await prisma.attendanceRecord.findMany({
      where: { staffId: staff.id, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    })

    res.json(
      records.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        lateCheckIn: r.lateCheckIn,
        earlyCheckOut: r.earlyCheckOut,
        stayTimeMinutes: stayTimeMinutes(r.checkIn, r.checkOut),
      })),
    )
  }),
)
