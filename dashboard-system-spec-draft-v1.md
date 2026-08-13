# Multi-Module Business Dashboard — Refined Spec (Draft v1)

> Status: Draft for review before final Claude CLI handoff. Terminology below is
> proposed — swap in your actual text-tag naming convention once decided, then
> this becomes the final MD.

---

## 1. Tech Stack

| Layer      | Choice                     | Notes |
|------------|-----------------------------|-------|
| Frontend   | React + Redux               | |
| Backend    | Node.js + Express, FastAPI  | Two backend services — confirm split of responsibilities (e.g. Express = CRUD/auth, FastAPI = ML/scheduling logic?) |
| ORM        | Prisma                      | Node/PostgreSQL layer |
| Database   | PostgreSQL                  | |

**Open question:** Express and FastAPI both listed as backend — worth stating explicitly in the final doc *which module talks to which service*, or whether FastAPI is only for a specific compute-heavy piece (e.g. scheduling conflict checks). Otherwise Claude CLI will guess.

---

## 2. Project Structure

Per your direction, each dashboard becomes its own directory under one parent project:

```
/project-root
  /staff-directory
  /staff-recruitment
  /staff-attendance
  /resource-directory
  /operational-scheduling
  /shared
    /flags            (entitlement checks, shared across modules)
    /ui-tags           (the uniform text-tag/label constants — pending your input)
    /components        (reusable patterns: edit/view toggle, time-window picker, kebab menu)
  /backend
    /express
    /fastapi
  /prisma
```

`/shared/ui-tags` is where the uniform text tags you mentioned would live once defined — a single source of truth so labels like "Status", "Business Status", "Employment Type" etc. aren't spelled/cased differently module to module (raw spec currently has `businss_status`, `oprational_status`, `sheduling` inconsistently).

---

## 3. Entitlement Flags (business_id-level)

Seven flags on the business account, each gating a dashboard/feature:

1. `staff_directory`
2. `staff_recruitment`
3. `staff_attendance`
4. `resource_directory`
5. `operational_scheduling`
6. `operational_scheduling_premium`
7. `verification_level` — *not a boolean purchase flag like the other six; it's an enum (`basic` | `enhanced`) that gates recruitment behavior. Worth flagging that it's a different kind of attribute rather than counting it as a 7th purchasable flag, unless it genuinely has its own price/purchase flow.*

### Dependencies between flags
- `operational_scheduling` requires **both** `staff_directory` AND `resource_directory` to be purchased.
- `operational_scheduling_premium` requires `operational_scheduling`.
- `staff_recruitment` gating by `verification_level`:
  - `recruitment_model_type = B2C only` → requires `verification_level = enhanced`; if not enhanced, redirect to enhanced-verification flow.
  - `recruitment_model_type = internal only` → requires `verification_level = basic` OR `enhanced`.
  - `recruitment_model_type = both` → requires `verification_level = enhanced`; if not, redirect to enhanced-verification flow.

### Changeable business settings (post-purchase)
- `recruitment_model_type`: enum `b2c` | `internal` | `both` — mutable via a "Change" action inside Staff Recruitment settings.

---

## 4. Shared UI Patterns (define once, reuse everywhere)

The raw spec repeats these identically in every module — pull them into `/shared/components` and reference them instead of re-describing:

**Row actions menu (kebab / 3-dot):**
- `View details` → opens record in view mode
- `Edit` → opens record in edit mode
- `Delete` → removes record

**Detail page header:**
- Back button (top) → returns to list
- If `mode == view`: show `Edit` button
- If `mode == edit`: show `Save` and `Cancel (X)`
  - `Save` → persists changes, returns to view mode
  - `Cancel` → discards changes, returns to view mode

**Time window / working schedule picker** (used in Staff Directory working schedule, and Operational Scheduling assignment):
- Per day of week: one or more time ranges, each removable
- `+ Add Time Window` to add another range for that day
- Day can be marked `Off`

**Repeat pattern** (Operational Scheduling assignment):
- `Do not repeat`
- `Repeat weekly`
- `Custom` → interval (weeks, +/- stepper), start date, end date

---

## 5. Module: Staff Directory
*Gate: `staff_directory`. Holder role: Staff Manager.*

**Summary (read-only):** Total Staff, Pending Invitations

**Filters:** Title, Status, Employment Type, Time Window, Responsibility

**List actions:** `+ Invite Staff` (takes account_id, creates row with `status: pending`, other fields empty), Search, Filter, Archived view

**List columns:** id, name, role_title, employment_type, status, responsibilities_count → row actions menu (see §4)

**Detail view sections:**
- *General:* First Name, Last Name, Phone Number, Gender, Date of Birth, Profile Photo
- *Professional:* account_id (read-only, set at invite), Title (custom input), Date of Joining, Years of Experience, Qualifications, Past Experience, Employment Type (Full-Time / Part-Time / Intern / Contract / Visiting Consultant / custom), Status (Active / On Leave / Suspended / Resigned / custom), Responsibilities Count
- *Working Schedule:* weekly availability using the shared time-window picker (§4) — availability, not shift assignment

**Conditional section — if `resource_directory` purchased:**
- *Workspace Responsibility:* checklist of workspaces this staff is permanently responsible for
- *Resources Responsibility:* checklist of resources this staff is permanently responsible for

**Work Responsibility (subscription-gated checklist):**
- ☑ Staff Recruitment (if `staff_recruitment` purchased)
- ☑ Staff Attendance (if `staff_attendance` purchased)
- ☑ Operational Scheduling (if `operational_scheduling` purchased)

---

## 6. Module: Staff Recruitment
*Gate: `staff_recruitment`. Holder role: Recruitment Manager.*

Verification-level gating logic — see §3.

### Option 1 — Summary (read-only)
Total Open Positions, Active Recruitments, Applications Received, Interviews Scheduled, Offers Sent, Hired Candidates

### Option 2 — Recruitment List
**Actions:** `+ Create Recruitment` (takes recruitment id + role; other fields blank, `hired: 0`, `total_candidates: 0`, `status: inactive`), Search, Filter

**Columns:** id, role, employment_type, status, total_candidates, hired → row menu:
- View setting
- Duplicate Recruitment (copies as "name copy(1)", `status: inactive`)
- Close Recruitment (if `status == active`)
- Launch (if `status == inactive`)
- Edit setting

**Recruitment detail/settings:**
- id, Role, Experience Required, Employment Type, Number of Openings, Description, Requirements, Benefits
- *Recruitment Audience:* if `recruitment_model_type == both`, choose B2C or Internal Only per posting; otherwise read-only display of the account-level setting
- *Interview Settings:* toggle Interview Required (Yes/No). If Yes: number of rounds, and per round — Interview Type (Location w/ address, or Online w/ link), Date, Time, Interviewer(s) (select from Staff List or manual name), Description, Interview Status (Scheduled / Completed / Cancelled)
- `Launch` button (if inactive) → sets `status: active`, stores `launch_date`

### Option 3 — Candidate Applications
Launched recruitments shown as horizontal cards; tap to open candidates for that posting.

- If `recruitment_model_type == b2c` → "B2C Applicant" tab (auto-filled by applicant)
- If `internal` → "Walk-in Applicant" tab (manually filled)
- If `both` → both tabs
- `+ Add Candidate` action only shown when `recruitment_model_type` is `internal` or `both`

**Columns:** Account ID, Name, Experience, Applied Date, Status (Applied [default] / Shortlisted / Rejected / Hired) → row menu

**Candidate detail:** Account ID, Name, Email, Phone, CV/Resume, Qualifications, Experience, Cover Note, Portfolio
- `Hire` button → converts to Staff, auto-fills into Staff Directory
- Row menu: View, Edit (only for walk-in applicants)

---

## 7. Module: Staff Attendance
*Gate: `staff_attendance`. Holder role: Attendance Manager.*

### Option 1 — Summary (read-only)
Total Staff, Present Today, Absent Today, On Leave, Off Today, Late Check-ins (auto, from working schedule), Early Check-outs (auto, from working schedule)

### Option 2 — Attendance Register
**Actions:** Date selector (default today), Search Staff, Filter

**Table:** Staff ID, Name, Working Schedule (for that day), Check-In, Check-Out, Status (Present / Absent / Leave / Off), Stay Time (auto-calculated: check-out − check-in)

**Row action:** View Attendance History → full month history for that staff, including any mid-month changes

---

## 8. Module: Resource Directory
*Gate: `resource_directory`. Holder role: Resource Manager.*

### Option 1 — Summary
(TBD — no detail given yet in raw spec)

### Option 2 — Workspaces
`+ Add Workspace` (unique name required)

Each workspace card shows: name, sub-space count, resource count (read-only, derived from Resources list), business_status (Inactive by default, editable)
Row actions: View / Edit / Delete (edit/view pattern per §4)

**Workspace detail fields:**
- Name, Type
- `business_status`: active / inactive / maintenance (manual)
- `operational_status` (only if `operational_scheduling` purchased): auto-updated to available/not-available by the scheduler
- `Responsible Person` (only if `staff_directory` purchased): read-only, sourced from Staff Directory → Workspace Responsibility Assignment
- Sub-space list (name input per sub-space)

### Option 3 — Resources
`+ Add Resource` (unique name + quantity; quantity > 1 auto-creates numbered rows, e.g. `name(1)`, `name(2)`)

**Table columns:** Name, Location, Category, Business Status, Operational Status, Responsible, Behavior, Scheduling Access → row menu (view/edit/delete per §4)

**Resource detail fields:**
- Location: `Inside Workspace` (select one or more workspaces) or `Independent Resource`
- Category: Bed / Machine / Equipment / Vehicle / Other (custom input)
- `business_status`: active / inactive / maintenance (manual)
- `operational_status` (only if `operational_scheduling` purchased): auto-updated by scheduler
- `Responsible Person` (only if `staff_directory` purchased): read-only, from Staff Directory → Resource Responsibility Assignment
- Behavior: Dedicated (belongs to one staff) or Shared (usable by multiple staff)
- Scheduling Required: Yes / No

**Filter panel:** Category, Type, Workspace, Business Status, Operational Status (if `operational_scheduling` purchased)
**Search:** keyword match on name
**Sort:** Name A–Z, Name Z–A, Recently Created, Recently Updated

---

## 9. Module: Operational Scheduling
*Gate: `staff_directory` AND `resource_directory` both purchased, AND `operational_scheduling` purchased.
Holder role: Resources & Staff Operation Manager.*

### Summary (default view)
**Today:** Total/Available Staff Scheduled, Total/Available Workspace Assignments, Total/Available Resource Assignments, Active Assignments (running now), Upcoming Assignments, Completed Assignments

**If `operational_scheduling_premium`:** Today's Workload chart (per staff/workspace/resource, hourly bar chart) + Peak Hour indicator

**Date-scoped breakdown** (date picker, default today):
- *Staff:* Assigned Hours, Idle Hours, Utilization %, Overtime Hours (sourced from assignment overtime, cross-referenced with Staff module)
- *Workspace:* Occupied Hours, Free Hours, Utilization %, Usage Count
- *Resource:* Usage Hours, Downtime, Maintenance Hours, Utilization %, Usage Count
- Monthly usage trend chart

### List view (second tab)
Scope: all `business_status == active` workspaces/resources/staff.
Date picker (default today) — assign actions enabled for today/future, read-only for past dates.
Tabs: Workspace Resources, Independent Resources, Staff (premium only), Quick Assign

**Workspace Resources tab:**
- Each workspace shown with current time-blocked assignments (name + role) and `+ Assign` action
- Expandable resource list per workspace, same pattern (assignments + `+ Assign`)
- Resources marked `Dedicated` show a fixed assignee instead of a time-blocked schedule

**Independent Resources tab:**
- Same card pattern, flat list, no workspace grouping

**Assign flow** (from either tab):
- Select staff (searchable list, multi-select)
- Weekly time-window picker (§4) per day
- Repeat pattern (§4)
- Note (short text)
- `Cancel` / `Assign`
- On submit: check staff/workspace/resource availability for that window; if conflicted, show what it's currently assigned to and offer Assign-anyway / Cancel

**Staff tab (premium only):**
- Each staff shown with their current schedule (time block → workspace + resources in use)
- `Assign` from staff side: pick Workspace and/or Resource, then same time/repeat/note/assign flow

**Quick Assign (premium only):**
- Pick staff, then workspace and/or resource, same flow

---

## 10. Open Items Before Final Handoff

1. **Text-tag convention** — you mentioned you'll provide the uniform label/tag set; once given, replace placeholder labels above (Status, Business Status, etc.) with the final naming and I'll fold it into `/shared/ui-tags`.
2. **Express vs FastAPI split** — needs an explicit rule so Claude CLI doesn't guess which endpoints live where.
3. **`verification_level`** — confirm whether it's truly a 7th purchasable flag or an account attribute with its own separate flow.
4. **Resource Directory Option 1 (Summary)** — no fields specified yet in the raw notes.
5. **Database schema** — Prisma models per module aren't drafted yet; worth doing once the above are locked, so Claude CLI has a schema to scaffold against rather than inferring one.

---

*Once you send the text-tag list, I'll fold it in and we can treat this as the final MD for Claude CLI.*
