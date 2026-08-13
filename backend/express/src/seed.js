import './lib/loadEnv.js'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'

const BUSINESS_ID = 'demo-business'
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const ALL_DAYS = [...WEEKDAYS, 'SAT', 'SUN']

function dateOnly(offsetDays = 0) {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d
}

function atTime(offsetDays, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = dateOnly(offsetDays)
  d.setUTCHours(h, m, 0, 0)
  return d
}

/** Wipes every module row scoped to the demo business, so re-running the
 * seed always leaves a clean, predictable dataset instead of piling up
 * duplicates. Business/BusinessFlags/Account are left alone (upserted). */
async function resetDemoData() {
  await prisma.assignment.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.candidate.deleteMany({ where: { recruitment: { businessId: BUSINESS_ID } } })
  await prisma.interviewRound.deleteMany({ where: { recruitment: { businessId: BUSINESS_ID } } })
  await prisma.recruitment.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.attendanceRecord.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.workingScheduleEntry.deleteMany({ where: { staff: { businessId: BUSINESS_ID } } })
  await prisma.workResponsibility.deleteMany({ where: { staff: { businessId: BUSINESS_ID } } })
  await prisma.workspaceResponsibility.deleteMany({ where: { staff: { businessId: BUSINESS_ID } } })
  await prisma.resourceResponsibility.deleteMany({ where: { staff: { businessId: BUSINESS_ID } } })
  await prisma.staff.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.resourceWorkspace.deleteMany({ where: { resource: { businessId: BUSINESS_ID } } })
  await prisma.subSpace.deleteMany({ where: { workspace: { businessId: BUSINESS_ID } } })
  await prisma.resource.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.workspace.deleteMany({ where: { businessId: BUSINESS_ID } })
}

function weeklySchedule(days, start, end) {
  return {
    create: days.map((dayOfWeek) => ({ dayOfWeek, isOff: false, startTime: start, endTime: end })),
  }
}

async function seedStaff() {
  const roster = [
    {
      accountId: 'ACC-1001',
      firstName: 'Aditi',
      lastName: 'Sharma',
      title: 'Front Desk Manager',
      employmentType: 'Full-Time',
      status: 'ACTIVE',
      gender: 'Female',
      phoneNumber: '+91 90000 10001',
      dateOfJoining: dateOnly(-540),
      yearsOfExperience: 6,
      qualifications: 'B.Com, Hospitality Management Diploma',
      schedule: weeklySchedule(WEEKDAYS, '09:00', '17:00'),
      responsibility: { staffRecruitment: true, staffAttendance: false, operationalScheduling: true },
    },
    {
      accountId: 'ACC-1002',
      firstName: 'Rohan',
      lastName: 'Mehta',
      title: 'Staff Nurse',
      employmentType: 'Full-Time',
      status: 'ACTIVE',
      gender: 'Male',
      phoneNumber: '+91 90000 10002',
      dateOfJoining: dateOnly(-720),
      yearsOfExperience: 4,
      qualifications: 'B.Sc Nursing',
      schedule: weeklySchedule(['MON', 'WED', 'FRI'], '09:00', '13:00'),
      responsibility: { staffRecruitment: false, staffAttendance: true, operationalScheduling: true },
    },
    {
      accountId: 'ACC-1003',
      firstName: 'Priya',
      lastName: 'Nair',
      title: 'Radiology Technician',
      employmentType: 'Part-Time',
      status: 'ACTIVE',
      gender: 'Female',
      phoneNumber: '+91 90000 10003',
      dateOfJoining: dateOnly(-300),
      yearsOfExperience: 3,
      qualifications: 'Diploma in Radiography',
      schedule: weeklySchedule(['TUE', 'THU'], '10:00', '16:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: true },
    },
    {
      accountId: 'ACC-1004',
      firstName: 'Karan',
      lastName: 'Verma',
      title: 'Delivery Driver',
      employmentType: 'Contract',
      status: 'ACTIVE',
      gender: 'Male',
      phoneNumber: '+91 90000 10004',
      dateOfJoining: dateOnly(-180),
      yearsOfExperience: 8,
      qualifications: 'Commercial Driving License',
      schedule: weeklySchedule(WEEKDAYS, '08:00', '18:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: true },
    },
    {
      accountId: 'ACC-1005',
      firstName: 'Sneha',
      lastName: 'Iyer',
      title: 'Receptionist',
      employmentType: 'Full-Time',
      status: 'ON_LEAVE',
      gender: 'Female',
      phoneNumber: '+91 90000 10005',
      dateOfJoining: dateOnly(-420),
      yearsOfExperience: 2,
      qualifications: 'BA English',
      schedule: weeklySchedule(WEEKDAYS, '09:00', '17:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: false },
    },
    {
      accountId: 'ACC-1006',
      firstName: 'Arjun',
      lastName: 'Rao',
      title: 'Security Officer',
      employmentType: 'Full-Time',
      status: 'ACTIVE',
      gender: 'Male',
      phoneNumber: '+91 90000 10006',
      dateOfJoining: dateOnly(-900),
      yearsOfExperience: 10,
      qualifications: 'Certified Security Guard',
      schedule: weeklySchedule(ALL_DAYS, '18:00', '23:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: true },
    },
    {
      accountId: 'ACC-1007',
      firstName: 'Meera',
      lastName: 'Joshi',
      title: 'Housekeeping Staff',
      employmentType: 'Part-Time',
      status: 'SUSPENDED',
      gender: 'Female',
      phoneNumber: '+91 90000 10007',
      dateOfJoining: dateOnly(-260),
      yearsOfExperience: 1,
      qualifications: null,
      schedule: weeklySchedule(WEEKDAYS, '07:00', '11:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: false },
    },
    {
      accountId: 'ACC-1008',
      firstName: 'Vikram',
      lastName: 'Singh',
      title: 'Maintenance Technician',
      employmentType: 'Full-Time',
      status: 'RESIGNED',
      gender: 'Male',
      phoneNumber: '+91 90000 10008',
      dateOfJoining: dateOnly(-1100),
      yearsOfExperience: 12,
      qualifications: 'ITI Electrician',
      schedule: { create: [] },
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: false },
      archived: true,
    },
    {
      accountId: 'ACC-1009',
      firstName: 'Ananya',
      lastName: 'Gupta',
      title: 'Front Desk Intern',
      employmentType: 'Intern',
      status: 'ACTIVE',
      gender: 'Female',
      phoneNumber: '+91 90000 10009',
      dateOfJoining: dateOnly(-45),
      yearsOfExperience: 0,
      qualifications: 'Pursuing BBA',
      schedule: weeklySchedule(WEEKDAYS, '10:00', '15:00'),
      responsibility: { staffRecruitment: false, staffAttendance: false, operationalScheduling: false },
    },
    {
      accountId: 'ACC-1010',
      firstName: null,
      lastName: null,
      title: null,
      employmentType: null,
      status: 'PENDING',
      schedule: { create: [] },
      responsibility: null,
    },
  ]

  const created = {}
  for (const person of roster) {
    const staff = await prisma.staff.create({
      data: {
        businessId: BUSINESS_ID,
        accountId: person.accountId,
        firstName: person.firstName,
        lastName: person.lastName,
        title: person.title,
        employmentType: person.employmentType,
        status: person.status,
        gender: person.gender ?? null,
        phoneNumber: person.phoneNumber ?? null,
        dateOfJoining: person.dateOfJoining ?? null,
        yearsOfExperience: person.yearsOfExperience ?? null,
        qualifications: person.qualifications ?? null,
        archived: Boolean(person.archived),
        workingSchedule: person.schedule,
        ...(person.responsibility && { workResponsibility: { create: person.responsibility } }),
      },
    })
    created[person.accountId] = staff
  }
  return created
}

async function seedResourceDirectory(staff) {
  const mainClinic = await prisma.workspace.create({
    data: {
      businessId: BUSINESS_ID,
      name: 'Main Clinic',
      type: 'Clinic',
      businessStatus: 'ACTIVE',
      subSpaces: { create: [{ name: 'Consultation Room 1' }, { name: 'Consultation Room 2' }, { name: 'Waiting Area' }] },
    },
  })
  const warehouse = await prisma.workspace.create({
    data: {
      businessId: BUSINESS_ID,
      name: 'Warehouse A',
      type: 'Storage',
      businessStatus: 'ACTIVE',
      subSpaces: { create: [{ name: 'Cold Storage' }, { name: 'Dry Storage' }] },
    },
  })
  await prisma.workspace.create({
    data: { businessId: BUSINESS_ID, name: 'Front Desk', type: 'Reception', businessStatus: 'ACTIVE' },
  })

  const beds = []
  for (let i = 1; i <= 4; i += 1) {
    beds.push(
      await prisma.resource.create({
        data: {
          businessId: BUSINESS_ID,
          name: `Patient Bed(${i})`,
          category: 'Bed',
          behavior: 'SHARED',
          schedulingRequired: true,
          businessStatus: i === 4 ? 'MAINTENANCE' : 'ACTIVE',
          workspaces: { create: [{ workspaceId: mainClinic.id }] },
        },
      }),
    )
  }

  const xray = await prisma.resource.create({
    data: {
      businessId: BUSINESS_ID,
      name: 'X-Ray Machine',
      category: 'Machine',
      behavior: 'DEDICATED',
      schedulingRequired: true,
      businessStatus: 'ACTIVE',
      workspaces: { create: [{ workspaceId: mainClinic.id }] },
    },
  })

  const vans = []
  for (let i = 1; i <= 2; i += 1) {
    vans.push(
      await prisma.resource.create({
        data: {
          businessId: BUSINESS_ID,
          name: `Delivery Van(${i})`,
          category: 'Vehicle',
          behavior: 'SHARED',
          schedulingRequired: true,
          businessStatus: 'ACTIVE',
        },
      }),
    )
  }

  for (let i = 1; i <= 3; i += 1) {
    await prisma.resource.create({
      data: {
        businessId: BUSINESS_ID,
        name: `Front Desk Laptop(${i})`,
        category: 'Equipment',
        behavior: 'DEDICATED',
        schedulingRequired: false,
        businessStatus: 'ACTIVE',
      },
    })
  }

  await prisma.resource.create({
    data: {
      businessId: BUSINESS_ID,
      name: 'Cold Storage Freezer',
      category: 'Equipment',
      behavior: 'SHARED',
      schedulingRequired: false,
      businessStatus: 'ACTIVE',
      workspaces: { create: [{ workspaceId: warehouse.id }] },
    },
  })

  await prisma.workspaceResponsibility.create({
    data: { staffId: staff['ACC-1001'].id, workspaceId: mainClinic.id },
  })
  await prisma.resourceResponsibility.create({
    data: { staffId: staff['ACC-1002'].id, resourceId: beds[0].id },
  })
  await prisma.resourceResponsibility.create({
    data: { staffId: staff['ACC-1003'].id, resourceId: xray.id },
  })

  return { mainClinic, warehouse, beds, xray, vans }
}

async function seedRecruitment(staff) {
  const nurse = await prisma.recruitment.create({
    data: {
      businessId: BUSINESS_ID,
      role: 'Registered Nurse',
      experienceRequired: '2+ years',
      employmentType: 'Full-Time',
      numberOfOpenings: 2,
      description: 'Provide patient care across our clinic locations.',
      requirements: 'B.Sc Nursing, valid registration',
      benefits: 'Health insurance, paid leave',
      audience: 'B2C',
      status: 'ACTIVE',
      launchDate: dateOnly(-20),
      interviewRequired: true,
      interviewRounds: {
        create: [
          {
            roundNumber: 1,
            type: 'ONLINE',
            onlineLink: 'https://meet.example.com/nurse-r1',
            date: dateOnly(-10),
            time: '11:00',
            interviewerStaffId: staff['ACC-1001'].id,
            description: 'Screening call',
            status: 'COMPLETED',
          },
          {
            roundNumber: 2,
            type: 'LOCATION',
            locationAddress: 'Main Clinic, 2nd Floor',
            date: dateOnly(3),
            time: '15:00',
            interviewerStaffId: staff['ACC-1002'].id,
            description: 'In-person clinical assessment',
            status: 'SCHEDULED',
          },
        ],
      },
      candidates: {
        create: [
          {
            accountId: 'CAND-2001',
            name: 'Divya Menon',
            email: 'divya.menon@example.com',
            phone: '+91 98765 20001',
            experience: '3 years',
            qualifications: 'B.Sc Nursing',
            source: 'B2C',
            appliedDate: dateOnly(-18),
            status: 'HIRED',
          },
          {
            accountId: 'CAND-2002',
            name: 'Farah Sheikh',
            email: 'farah.sheikh@example.com',
            phone: '+91 98765 20002',
            experience: '2 years',
            qualifications: 'B.Sc Nursing',
            source: 'B2C',
            appliedDate: dateOnly(-15),
            status: 'SHORTLISTED',
          },
          {
            accountId: 'CAND-2003',
            name: 'Neha Kulkarni',
            email: 'neha.kulkarni@example.com',
            phone: '+91 98765 20003',
            experience: '1 year',
            qualifications: 'GNM Nursing',
            source: 'B2C',
            appliedDate: dateOnly(-9),
            status: 'APPLIED',
          },
        ],
      },
    },
  })

  await prisma.recruitment.create({
    data: {
      businessId: BUSINESS_ID,
      role: 'Delivery Driver',
      experienceRequired: '1+ years',
      employmentType: 'Contract',
      numberOfOpenings: 1,
      description: 'Handle scheduled deliveries between warehouse and clinic sites.',
      requirements: 'Valid commercial license',
      audience: 'INTERNAL',
      status: 'ACTIVE',
      launchDate: dateOnly(-12),
      interviewRequired: false,
      candidates: {
        create: [
          {
            name: 'Suresh Pillai',
            phone: '+91 98765 30001',
            experience: '5 years',
            source: 'WALK_IN',
            appliedDate: dateOnly(-11),
            status: 'HIRED',
          },
          {
            name: 'Manoj Tiwari',
            phone: '+91 98765 30002',
            experience: '6 months',
            source: 'WALK_IN',
            appliedDate: dateOnly(-8),
            status: 'REJECTED',
          },
          {
            name: 'Ramesh Yadav',
            phone: '+91 98765 30003',
            experience: '2 years',
            source: 'WALK_IN',
            appliedDate: dateOnly(-2),
            status: 'APPLIED',
          },
        ],
      },
    },
  })

  await prisma.recruitment.create({
    data: {
      businessId: BUSINESS_ID,
      role: 'Lab Technician',
      experienceRequired: '1+ years',
      employmentType: 'Full-Time',
      numberOfOpenings: 1,
      description: 'Run diagnostic lab tests and maintain equipment logs.',
      audience: 'B2C',
      status: 'INACTIVE',
      interviewRequired: true,
    },
  })

  await prisma.recruitment.create({
    data: {
      businessId: BUSINESS_ID,
      role: 'Housekeeping Staff',
      employmentType: 'Part-Time',
      numberOfOpenings: 1,
      audience: 'INTERNAL',
      status: 'CLOSED',
      launchDate: dateOnly(-60),
      candidates: {
        create: [
          {
            name: 'Geeta Devi',
            phone: '+91 98765 40001',
            source: 'WALK_IN',
            appliedDate: dateOnly(-58),
            status: 'HIRED',
          },
          {
            name: 'Sunita Rani',
            phone: '+91 98765 40002',
            source: 'WALK_IN',
            appliedDate: dateOnly(-57),
            status: 'REJECTED',
          },
        ],
      },
    },
  })

  return nurse
}

async function seedAttendance(staff) {
  const trackable = ['ACC-1001', 'ACC-1002', 'ACC-1003', 'ACC-1004', 'ACC-1006', 'ACC-1009']

  for (const accountId of trackable) {
    const person = staff[accountId]
    for (let offset = -14; offset <= 0; offset += 1) {
      const day = dateOnly(offset)
      const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6
      let status = 'PRESENT'
      if (isWeekend && accountId !== 'ACC-1006') status = 'OFF'
      else if (offset === -6) status = 'LEAVE'
      else if (offset === -3 && accountId === 'ACC-1003') status = 'ABSENT'

      const checkIn = status === 'PRESENT' ? atTime(offset, offset % 5 === 0 ? '09:20' : '09:00') : null
      const checkOut = status === 'PRESENT' ? atTime(offset, offset % 7 === 0 ? '16:30' : '17:00') : null

      await prisma.attendanceRecord.create({
        data: {
          businessId: BUSINESS_ID,
          staffId: person.id,
          date: day,
          status,
          checkIn,
          checkOut,
          lateCheckIn: status === 'PRESENT' && offset % 5 === 0,
          earlyCheckOut: status === 'PRESENT' && offset % 7 === 0,
        },
      })
    }
  }
}

async function seedScheduling(staff, resources) {
  const { mainClinic, warehouse, beds, xray, vans } = resources

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1002'].id,
      resourceId: beds[0].id,
      repeatPattern: 'WEEKLY',
      startDate: dateOnly(-14),
      note: 'Primary bedside care',
      status: 'ACTIVE',
      timeWindows: { create: [{ dayOfWeek: 'MON', startTime: '09:00', endTime: '13:00' }, { dayOfWeek: 'WED', startTime: '09:00', endTime: '13:00' }, { dayOfWeek: 'FRI', startTime: '09:00', endTime: '13:00' }] },
    },
  })

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1003'].id,
      resourceId: xray.id,
      workspaceId: mainClinic.id,
      repeatPattern: 'WEEKLY',
      startDate: dateOnly(-14),
      status: 'ACTIVE',
      timeWindows: { create: [{ dayOfWeek: 'TUE', startTime: '10:00', endTime: '16:00' }, { dayOfWeek: 'THU', startTime: '10:00', endTime: '16:00' }] },
    },
  })

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1004'].id,
      resourceId: vans[0].id,
      repeatPattern: 'NONE',
      startDate: dateOnly(0),
      note: 'Morning delivery run',
      status: 'UPCOMING',
      timeWindows: { create: [{ dayOfWeek: dowKey(dateOnly(0)), startTime: '08:00', endTime: '18:00' }] },
    },
  })

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1001'].id,
      workspaceId: mainClinic.id,
      repeatPattern: 'WEEKLY',
      startDate: dateOnly(-14),
      status: 'ACTIVE',
      timeWindows: { create: WEEKDAYS.map((dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '17:00' })) },
    },
  })

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1006'].id,
      workspaceId: warehouse.id,
      repeatPattern: 'CUSTOM',
      repeatInterval: 2,
      startDate: dateOnly(3),
      status: 'UPCOMING',
      note: 'Bi-weekly night patrol, starting next week',
      timeWindows: { create: [{ dayOfWeek: 'SAT', startTime: '20:00', endTime: '23:00' }] },
    },
  })

  await prisma.assignment.create({
    data: {
      businessId: BUSINESS_ID,
      staffId: staff['ACC-1009'].id,
      workspaceId: mainClinic.id,
      repeatPattern: 'WEEKLY',
      startDate: dateOnly(-60),
      endDate: dateOnly(-30),
      status: 'COMPLETED',
      note: 'Completed onboarding rotation',
      timeWindows: { create: [{ dayOfWeek: 'MON', startTime: '10:00', endTime: '15:00' }] },
    },
  })
}

function dowKey(date) {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getUTCDay()]
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: {},
    create: {
      id: BUSINESS_ID,
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
    create: { businessId: BUSINESS_ID, email: 'owner@demo.test', passwordHash, role: 'OWNER' },
  })

  await resetDemoData()

  const staff = await seedStaff()
  const resources = await seedResourceDirectory(staff)
  await seedRecruitment(staff)
  await seedAttendance(staff)
  await seedScheduling(staff, resources)

  console.log('Seeded demo business with a full presentation dataset:')
  console.log('  - 10 staff (mixed statuses, schedules, responsibilities)')
  console.log('  - 3 workspaces, 11 resources')
  console.log('  - 4 recruitments with interview rounds and candidates')
  console.log('  - 15 days of attendance history')
  console.log('  - 6 operational scheduling assignments (active/upcoming/completed)')
  console.log('  Login: owner@demo.test / password123')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
