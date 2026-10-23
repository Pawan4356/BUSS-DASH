# Seed Data & Account Profiles

This document describes the dataset loaded by `npm run --workspace backend/express seed`,
the sign-in accounts it creates, and the account profile / avatar feature.

- Seed runner: `backend/express/src/seed.js`
- Company data: `backend/express/src/seed-data/*.js` (one file per company)
- Profile API: `backend/express/src/routes/profile.js`, `backend/express/src/lib/profileHelpers.js`
- Profile UI: `frontend/src/app/ProfilePage.jsx`, `frontend/src/shared/components/Avatar.jsx`

---

## 1. Running the seed

```bash
npm run prisma:migrate                    # applies the account_profile migration
npm run --workspace backend/express seed
```

The seed is **idempotent**. On every run it:

1. Deletes the legacy placeholder business (`demo-business`) if it is still there.
2. Deletes each seeded company by its fixed ID. Every child row cascades.
3. Recreates the companies with dates **relative to today**: joining dates, attendance
   history, recruitment launch dates, interview dates and assignment windows.

So the data always looks current. For example, today's attendance register shows people
who are checked in right now, people who have finished their shift, and people whose shift
hasn't started yet.

> Re-running the seed wipes any changes made through the UI in these five businesses.
> Businesses you created yourself are left alone.

---

## 2. Sign-in accounts

**Every account uses the password `Parsor@2026`.**

The Avatar column shows the preset key; the database stores it as `preset:<key>`
(for example `preset:person-coral`).

### Meridian Health Clinic: every module unlocked

| Email | Role | Name | Job title | Avatar |
|---|---|---|---|---|
| `kavita.raman@meridianhealth.in` | Owner | Kavita Raman | Medical Director | `person-coral` (bun) |
| `arvind.menon@meridianhealth.in` | Staff Manager | Arvind Menon | HR Manager | `person-ocean` (short hair) |
| `nisha.bhatt@meridianhealth.in` | Recruitment Manager | Nisha Bhatt | Talent Acquisition Lead | `person-sage` (long hair) |
| `sameer.qureshi@meridianhealth.in` | Attendance Manager | Sameer Qureshi | Shift Coordinator | `person-slate` (bald, beard) |
| `lakshmi.iyer@meridianhealth.in` | Resource Manager | Lakshmi Iyer | Facilities Manager | `person-berry` (bun, glasses) |
| `rahul.desai@meridianhealth.in` | Operations Manager | Rahul Desai | Operations Manager | `person-forest` (side part, beard) |
| `pooja.sinha@meridianhealth.in` | Staff | Pooja Sinha | Senior Staff Nurse | *Initials (none set)* |

### Bluepeak Logistics: all modules except premium scheduling

| Email | Role | Name | Job title | Avatar |
|---|---|---|---|---|
| `harpreet.gill@bluepeaklogistics.com` | Owner | Harpreet Gill | Managing Director | `person-amber` (grey hair, beard) |
| `anil.kumar@bluepeaklogistics.com` | Operations Manager | Anil Kumar | Fleet Operations Manager | `attack-helicopter` 🚁 |
| `fatima.siddiqui@bluepeaklogistics.com` | Attendance Manager | Fatima Siddiqui | Warehouse Supervisor | `person-plum` (side part, glasses) |
| `george.mathew@bluepeaklogistics.com` | Recruitment Manager | George Mathew | People Partner | `gorilla` 🦍 |

### Saffron Table Café: some modules locked by entitlement rules

| Email | Role | Name | Job title | Avatar |
|---|---|---|---|---|
| `meenakshi@saffrontable.in` | Owner | Meenakshi Pillai | Founder & Head Chef | `person-rose` (long hair, glasses) |
| `daniel@saffrontable.in` | Staff Manager | Daniel D'Souza | Café Manager | `person-indigo` (curly hair, glasses) |

### Lumen Design Studio: no modules purchased

| Email | Role | Name | Job title | Avatar |
|---|---|---|---|---|
| `tara.malhotra@lumenstudio.co` | Owner | Tara Malhotra | Founder & Creative Director | *Initials (partial profile)* |
| `studio.ops@lumenstudio.co` | Operations Manager | *(blank profile)* | — | *Initials from email* |

### Lala Company: the meme tenant

Every module is unlocked. Its numbers are deliberately strange, to test how the dashboards
cope with extremes.

| Email | Role | Name | Job title | Avatar |
|---|---|---|---|---|
| `pavan.chamar@lalacompany.in` | Owner | Pavan Chamar | Supreme Owner & Helicopter Pilot | `attack-helicopter` 🚁 |
| `bijay.sing@lalacompany.in` | Staff | Bijay Sing | Assistant to the Assistant Photocopier Operator | `gorilla` 🦍 |
| `valid.shake@lalacompany.in` | Staff | Valid Shake | Unpaid Intern to the Intern | `gorilla` 🦍 |
| `yashu.father@lalacompany.in` | Staff Manager | Yashu Father | Father | `gorilla` 🦍 |

What it exercises:

| Oddity | Shows up as |
|---|---|
| Pavan works 5 minutes a week (Mon 14:00–14:05) | Near-zero hours and utilisation; late-prone attendance |
| Bijay works 03:00–03:30 every day | 2.1% utilisation; always late; a missed check-out and two absences |
| Valid works only Sunday, 00:00–23:59, and is suspended a day after joining | Full-day assignment; an irregular history for a suspended person |
| Yashu works 06:00–22:00 seven days a week, with 69 years of experience | 16 h/day: 8 h overtime and a coral overtime bar every day |
| 69 plastic chairs, 4 under maintenance | 73 resources in total; a long resource list |
| A goat shared across two workspaces, a broken photocopier, a server room that is a fridge | Custom categories (Livestock, Furniture); Maintenance statuses |
| "Professional Excuse Maker": 69 openings, a 3 a.m. interview, a final round run by the goat | Large opening count; interviewer entered by name |

> The email domains are made up for local development. No email is ever sent.

---

## 3. Companies at a glance

| | Meridian Health Clinic | Bluepeak Logistics | Saffron Table Café | Lumen Design Studio |
|---|---|---|---|---|
| Business ID | `biz-meridian-health` | `biz-bluepeak-logistics` | `biz-saffron-table` | `biz-lumen-studio` |
| Industry | Healthcare (outpatient clinic) | Warehousing & last-mile delivery | Food & beverage | Creative agency |
| Verification | ENHANCED | BASIC | BASIC | BASIC |
| Recruitment model | BOTH | INTERNAL | B2C | INTERNAL |
| Staff Directory | ✅ | ✅ | ✅ | 🔒 not purchased |
| Staff Recruitment | ✅ | ✅ (internal needs only BASIC) | 🔒 B2C requires ENHANCED | 🔒 not purchased |
| Staff Attendance | ✅ | ✅ | ✅ | 🔒 not purchased |
| Resource Directory | ✅ | ✅ | 🔒 not purchased | 🔒 not purchased |
| Operational Scheduling | ✅ | ✅ | 🔒 needs Resource Directory | 🔒 not purchased |
| Scheduling Premium | ✅ | ❌ not purchased | ❌ | ❌ |
| Accounts | 7 | 4 | 2 | 2 |
| Staff | 14 | 10 | 7 | 0 |
| Workspaces / Resources | 7 / 18 | 4 / 15 | — | — |
| Recruitments | 5 | 4 | 1 (hidden while locked) | — |
| Attendance history | 30 days | 21 days | 14 days | — |
| Assignments | 11 | 7 | — | — |

Together, the four main companies cover every branch of `resolveModuleAccess`
(`backend/express/src/lib/entitlements.js`): allowed, `not-purchased`,
`requires-enhanced-verification` and `requires-staff-and-resource-directory`.

---

## 4. Use-case coverage

### Staff Directory

| Scenario | Where to see it |
|---|---|
| Every staff status: Pending, Active, On Leave, Suspended, Resigned | Meridian: `MHC-010` Pending, Sneha Kapoor On Leave, Meera Joshi Suspended, Vikram Singh Resigned |
| Archived staff (hidden from lists) | Vikram Singh (Meridian), Prakash Gaikwad (Bluepeak) |
| Pending invite with only an account ID | `MHC-010`, `BPL-109`, `STC-07` |
| All employment types: Full-Time, Part-Time, Contract, Intern, Visiting Consultant | Meridian roster |
| Standard weekday shift | Aditi Sharma 09:00–17:00 Mon–Fri |
| Split shift (two windows on one day) | Dr. Farhan Ali (09–13 and 17–20), Ravi Shankar at Saffron (lunch and dinner) |
| Explicit day off (`isOff` entry) | Imran Shaikh, off on Wednesday; Kavya Subramanian, off on Tuesday |
| Evening/night shift, seven days a week | Arjun Rao 18:00–23:30 |
| Early-morning shift | Sandeep Patil 06:00, Ganesh Kale 05:00 |
| Weekend-only part-timer | Ayesha Khan (Fri–Sun) |
| No working schedule | Pending invites and resigned staff |
| Work-responsibility checklist, from all three on to none | Aditi Sharma all three on; Rohan Mehta scheduling only; Sneha Kapoor none |
| Workspace and resource responsibilities | Aditi → Outpatient Wing + Reception; Rohan → Patient Bed(1); Priya → Digital X-Ray System |
| Recently hired from a recruitment | Divya Menon: hired in "Registered Nurse", joined 12 days ago |

### Staff Attendance

Each person's history comes from their schedule and an attendance profile, so the
patterns are realistic and the same on every run:

| Profile | Behaviour | Example |
|---|---|---|
| `punctual` | Checks in 0–10 minutes early, leaves on time | Aditi Sharma, Deepa Krishnan |
| `late-prone` | About 45% of days late by 8–48 minutes | Rohan Mehta, Imran Shaikh, Mohammed Irfan |
| `leaves-early` | About 50% of days out 15–65 minutes early | Dr. Farhan Ali, Rekha Jadhav |
| `irregular` | Occasional absences, late arrivals and early exits | Ananya Gupta, Suresh Pillai, Thomas Fernandes |
| `on-leave` | LEAVE on every working day | Sneha Kapoor, Ganesh Kale, Lavanya Ramesh |

| Scenario | Where to see it |
|---|---|
| Present, Absent, Leave and Off statuses | All companies (Off is generated on days outside the schedule) |
| Late check-in / early check-out flags | Calculated with the same `computeLateEarly` function the API uses |
| Planned leave inside an otherwise normal history | Aditi Sharma 9 days ago; Imran Shaikh 11–12 days ago; Sandeep Patil 4 days ago |
| One-off absence | Priya Nair, 5 days ago |
| Forgot to check out (check-in only) | Arjun Rao, 3 days ago |
| **Today**: shift in progress (checked in, no check-out yet) | Anyone whose shift is running when you seed |
| **Today**: shift finished | Anyone whose shift ended before you seeded |
| **Today**: shift not started (no record, shows as Absent) | For example, Arjun Rao before 18:00 |
| Split-shift early-checkout flag (known defect DEF-03) | Dr. Farhan Ali and Ravi Shankar, flagged against their first window |
| Suspended staff with no records | Meera Joshi |

### Staff Recruitment

| Scenario | Where to see it |
|---|---|
| Statuses Active, Inactive (draft) and Closed | Meridian: Registered Nurse (Active), Lab Technician (Inactive), Housekeeping Associate (Closed) |
| B2C and Internal-only audiences | Meridian has both; Bluepeak has internal only |
| Interview required vs not required | Radiographer (required) vs Physiotherapist and Delivery Driver (not required) |
| Online and on-site interview rounds | Registered Nurse round 1 (Google Meet) and round 2 (on-site) |
| Interview statuses Scheduled, Completed and Cancelled | Registered Nurse R1 Completed, R2 Scheduled; Radiographer R2 Cancelled |
| Staff interviewer vs interviewer entered by name | Rohan Mehta (staff) vs "Dr. S. Venkatesh (Visiting Radiologist)" |
| Candidate statuses Applied, Shortlisted, Rejected and Hired | Registered Nurse pipeline has all four |
| Candidate sources B2C and Walk-in | Registered Nurse has both |
| Candidates with a CV link and cover note | Farah Sheikh (CV), Divya Menon (cover note) |
| Active job with no applicants (empty pipeline) | Physiotherapist |
| Closed job with several hires | Housekeeping Associate (2 hired, 1 rejected) |
| Recruitment locked by verification level | Saffron Table Café |

### Resource Directory

| Scenario | Where to see it |
|---|---|
| Workspace statuses Active, Maintenance and Inactive | Meridian: Outpatient Wing, Minor Procedure Room, Physiotherapy Studio |
| Workspaces with and without sub-spaces | Outpatient Wing (4 rooms) vs Reception (none) |
| Multiple units with the `Name(n)` naming | Patient Bed(1–6), Delivery Van(1–4), Wheelchair(1–3) |
| A single unit under maintenance in a set | Patient Bed(6), Delivery Van(4) |
| Inactive resource | Vaccine Refrigerator, Conveyor Sorter |
| Dedicated vs Shared behaviour | Digital X-Ray System (Dedicated) vs Patient Beds (Shared) |
| Scheduling required vs not required | Ultrasound Scanner vs Hematology Analyzer |
| **Awaiting scheduling** (requires scheduling, no assignment) | Ultrasound Scanner, Patient Bed(3–5), Delivery Van(4), Forklift(2) |
| Resource in more than one workspace | ECG Machine (Outpatient Wing + Day-Care Ward), Handheld Scanners |
| Independent resource (not in any workspace) | Ambulance, Wheelchairs |
| Custom category beyond the presets | "Mobility Aid" (Wheelchair) |

### Operational Scheduling

| Scenario | Where to see it |
|---|---|
| Weekly repeat | Most assignments, for example Rohan Mehta on Patient Bed(1), Mon/Wed/Fri |
| One-off (do not repeat) today | Suresh Pillai on the Ambulance (patient transfer) |
| One-off in the future | ECG health camp in 2 days; Bluepeak bulk B2B drop tomorrow |
| Custom repeat, every N weeks | Arjun Rao every 2 weeks (Sat); Bluepeak monthly cycle count (every 4 weeks) |
| Starts in the future (Upcoming) | Arjun Rao's fortnightly round starts in 3 days |
| Ended (Completed) | Ananya Gupta's onboarding rotation; Bluepeak's dairy contract |
| Cancelled | Imran Shaikh's medication-counselling desk |
| Live right now (Active) | Whatever window covers the current time when you open the page |
| Assignment to a workspace only, a resource only, or both | Reception (workspace), Ambulance (resource), X-Ray + Radiology Suite (both) |
| Several windows per day | Dr. Farhan Ali's morning and evening OPD |
| Premium workload and utilisation views | Meridian (premium on) vs Bluepeak (premium off) |
| Scheduling locked by a missing prerequisite | Saffron Table Café |

> FastAPI recalculates assignment status (Upcoming, Active, Completed) every time the page
> loads, so the seeded statuses are only a starting point. Cancelled is never recalculated.

### Accounts, profiles & avatars

| Scenario | Where to see it |
|---|---|
| One account per role | Meridian (all 7 `AccountRole` values) |
| Preset avatar | Most accounts |
| The fun presets | Anil Kumar (`attack-helicopter`), George Mathew (`gorilla`) at Bluepeak |
| Initials fallback, full profile | Pooja Sinha |
| Partly filled profile | Tara Malhotra |
| Blank profile (sidebar shows the email) | `studio.ops@lumenstudio.co` |
| Uploaded photo | Upload one on `/profile`. Photos aren't seeded. |

---

## 5. Account profile & avatars

### What a profile holds

These fields are general enough to suit any kind of business:

| Field | Column | Notes |
|---|---|---|
| First name / Last name | `firstName`, `lastName` | Joined into `displayName`, which the sidebar shows |
| Job title | `jobTitle` | Shown under the name on the profile page |
| Department | `department` | |
| Phone number | `phone` | |
| Work location | `location` | For example, a branch or site |
| Time zone | `timezone` | IANA name, chosen from a list of suggestions |
| Avatar | `avatar` | See below |
| Email, Role, Business, Member since | *(read-only)* | Come from the account and business |

All of these are nullable columns on `Account`, added by migration
`prisma/migrations/20261023104052_account_profile`.

### Avatar options

The `avatar` column stores one of three things:

1. **A built-in preset:** `preset:<key>`. There are 15 presets, drawn as inline SVG with no
   external assets, and each has its own colours so it looks the same in light and dark themes.
   - 13 people, varying skin tone, hairstyle, glasses and beards: `person-ocean` (short hair),
     `person-sage` (long hair), `person-coral` (bun), `person-sun` (curly hair),
     `person-plum` (side part, glasses), `person-slate` (bald, beard), `person-teal` (hijab),
     `person-rose` (long hair, glasses), `person-amber` (grey hair, beard),
     `person-indigo` (curly hair, glasses), `person-forest` (side part, beard),
     `person-berry` (bun, glasses), `person-saffron` (turban, beard)
   - 2 just for fun: `gorilla` and `attack-helicopter`
2. **An uploaded photo:** a `data:image/(png|jpeg|webp);base64,...` URL. The browser crops it to a
   square and resizes it to a 256×256 JPEG before upload (source files up to 5 MB). The server
   rejects anything over about 375 KB.
3. **`null`:** the avatar shows initials taken from the name, or from the email when there's no name.

The list of preset keys is kept in two places that must match:
`AVATAR_PRESETS` in `frontend/src/shared/components/Avatar.jsx` and
`AVATAR_PRESET_KEYS` in `backend/express/src/lib/profileHelpers.js`.

### Where it appears

- **Sidebar:** the account bar shows the avatar, display name and role. Click it to open `/profile`.
- **Profile page (`/profile`):** the avatar picker, general details, read-only account details,
  and a change-password form.
- **Login toast:** greets the user by first name.

### API

All endpoints need `Authorization: Bearer <token>`.

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/profile` | — | Profile object |
| `PATCH` | `/profile` | Any subset of `firstName`, `lastName`, `jobTitle`, `department`, `phone`, `location`, `timezone`, `avatar` | Updated profile |
| `POST` | `/profile/password` | `{ currentPassword, newPassword }` (new password at least 8 characters) | `204`, or `400` with a message |

`POST /auth/login` and `GET /auth/me` now also return a `profile` object next to `account`.
The `account` object (`{ id, email, role }`) hasn't changed.

Validation rules: unknown fields are ignored; strings are trimmed and an empty string clears
the field; each field is limited to 120 characters; an avatar must be a known preset key or a
valid image data URL. A wrong current password returns `400`, not `401`, so the frontend's
"log out on 401" handler doesn't sign the user out.

These rules, the avatar formats and size limits, and the frontend/backend preset-list match
are covered by `testScripts/tests/blackbox/profile.blackbox.test.js` and
`testScripts/tests/whitebox/profileHelpers.whitebox.test.js`.

---

## 6. Adding or changing seed data

Each company is a plain object in `backend/express/src/seed-data/`. Add a new file and list
it in `seed-data/index.js`. The runner handles the rest. If you add a column to the Prisma
schema, add it here too, so the demo data shows it.

| Key | Shape |
|---|---|
| `id`, `name`, `verificationLevel`, `recruitmentModelType`, `flags` | Business row and entitlement flags |
| `accounts[]` | `{ email, role, firstName, lastName, jobTitle, department, phone, location, timezone, avatar }` |
| `staff[]` | `{ key, ...Staff fields, joinedDaysAgo, birthDate, schedule: [{ days, start, end } \| { days, off: true }], responsibility, attendance: { type, overrides } }`. `key` becomes `accountId`. |
| `workspaces[]` | `{ name, type, businessStatus, subSpaces: [names], responsible: [staff keys] }` |
| `resources[]` | `{ name, count, category, behavior, schedulingRequired, workspaces: [names], maintenance: [unit numbers], responsible: [keys] \| { unit: [keys] } }` |
| `recruitments[]` | `{ ...Recruitment fields, launchedDaysAgo, rounds: [{ type, dayOffset, time, interviewer, ... }], candidates: [{ ..., appliedDaysAgo }] }`. `interviewer` is a staff key, or any other text for a name-only interviewer. |
| `attendanceDays` | Number of past days of attendance to generate |
| `assignments[]` | `{ staff, workspace, resource, repeatPattern, repeatInterval, startOffset, endOffset, status, note, windows: [{ day \| 'TODAY', start, end }] }` |

Attendance override values for `attendance.overrides[-n]`: `LEAVE`, `ABSENT`, `NO_CHECKOUT`.
