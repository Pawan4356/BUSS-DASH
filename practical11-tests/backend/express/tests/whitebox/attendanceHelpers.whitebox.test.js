/**
 * WHITE-BOX TESTS — src/lib/attendanceHelpers.js
 * Technique: statement, branch and condition coverage; loop/boundary on string
 * time comparison ("HH:mm" compared lexicographically).
 */
import { describe, it, expect } from 'vitest'
import { computeLateEarly, dayOfWeekForDate, startOfDay, stayTimeMinutes } from '../../src/lib/attendanceHelpers.js'

const win = (startTime, endTime) => ({ startTime, endTime })
const iso = (hhmm) => `2026-09-22T${hhmm}:00`

describe('WB-ATT  dayOfWeekForDate — all 7 array indexes', () => {
  it.each([
    ['2026-09-20', 'SUN'], ['2026-09-21', 'MON'], ['2026-09-22', 'TUE'], ['2026-09-23', 'WED'],
    ['2026-09-24', 'THU'], ['2026-09-25', 'FRI'], ['2026-09-26', 'SAT'],
  ])('%s -> %s', (d, expected) => {
    expect(dayOfWeekForDate(new Date(`${d}T12:00:00`))).toBe(expected)
  })
})

describe('WB-ATT  startOfDay — both branches of the ternary', () => {
  it('with a date string -> that day at 00:00:00.000', () => {
    const d = startOfDay('2026-09-22T15:45:10')
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0])
  })
  it('without an argument -> today at 00:00:00.000', () => {
    const d = startOfDay()
    const now = new Date()
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([now.getFullYear(), now.getMonth(), now.getDate()])
    expect(d.getHours()).toBe(0)
  })
  it('returns a NEW Date each call (no shared mutable state)', () => {
    expect(startOfDay()).not.toBe(startOfDay())
  })
})

describe('WB-ATT  stayTimeMinutes — branches of (!checkIn || !checkOut) and Math.max', () => {
  it('no checkIn -> null', () => expect(stayTimeMinutes(null, iso('17:00'))).toBeNull())
  it('no checkOut -> null', () => expect(stayTimeMinutes(iso('09:00'), null)).toBeNull())
  it('neither -> null', () => expect(stayTimeMinutes(undefined, undefined)).toBeNull())
  it('positive duration', () => expect(stayTimeMinutes(iso('09:15'), iso('18:05'))).toBe(530))
  it('negative duration clamps to 0 (Math.max branch)', () => expect(stayTimeMinutes(iso('18:00'), iso('09:00'))).toBe(0))
  it('rounds 29 s down / 30 s up', () => {
    expect(stayTimeMinutes('2026-09-22T09:00:00', '2026-09-22T09:00:29')).toBe(0)
    expect(stayTimeMinutes('2026-09-22T09:00:00', '2026-09-22T09:00:30')).toBe(1)
  })
  it('accepts Date objects and ISO strings interchangeably', () => {
    expect(stayTimeMinutes(new Date(iso('09:00')), iso('10:00'))).toBe(60)
  })
})

describe('WB-ATT  computeLateEarly — condition coverage', () => {
  const windows = [win('09:00', '17:00')]

  it('C1 no working window -> both false, regardless of times (early return)', () => {
    expect(computeLateEarly({ checkIn: iso('23:00'), checkOut: iso('23:30'), dayWindows: [] })).toEqual({ lateCheckIn: false, earlyCheckOut: false })
  })
  it('C2 checkIn absent -> lateCheckIn false (falsy branch of the ternary)', () => {
    expect(computeLateEarly({ checkOut: iso('18:00'), dayWindows: windows }).lateCheckIn).toBe(false)
  })
  it('C3 checkOut absent -> earlyCheckOut false', () => {
    expect(computeLateEarly({ checkIn: iso('08:00'), dayWindows: windows }).earlyCheckOut).toBe(false)
  })
  it('C4 late only', () => {
    expect(computeLateEarly({ checkIn: iso('09:30'), checkOut: iso('17:30'), dayWindows: windows })).toEqual({ lateCheckIn: true, earlyCheckOut: false })
  })
  it('C5 early only', () => {
    expect(computeLateEarly({ checkIn: iso('08:30'), checkOut: iso('16:00'), dayWindows: windows })).toEqual({ lateCheckIn: false, earlyCheckOut: true })
  })
  it('C6 late and early', () => {
    expect(computeLateEarly({ checkIn: iso('09:30'), checkOut: iso('16:00'), dayWindows: windows })).toEqual({ lateCheckIn: true, earlyCheckOut: true })
  })
  it('C7 on time both ends -> neither', () => {
    expect(computeLateEarly({ checkIn: iso('09:00'), checkOut: iso('17:00'), dayWindows: windows })).toEqual({ lateCheckIn: false, earlyCheckOut: false })
  })
  it('C8 zero-padding in formatTime: 9:05 is "09:05" and compares correctly with "09:00"', () => {
    expect(computeLateEarly({ checkIn: iso('09:05'), dayWindows: windows }).lateCheckIn).toBe(true)
    expect(computeLateEarly({ checkIn: iso('00:05'), dayWindows: windows }).lateCheckIn).toBe(false)
  })
  it('C9 only the FIRST window of the day is consulted (documents current behaviour, see DEF-03)', () => {
    const split = [win('09:00', '13:00'), win('14:00', '18:00')]
    expect(computeLateEarly({ checkIn: iso('09:00'), checkOut: iso('15:00'), dayWindows: split }).earlyCheckOut).toBe(false)
  })
})
