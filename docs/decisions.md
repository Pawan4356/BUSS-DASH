# Decisions on open spec items

The spec draft (§10) listed five items to be resolved before final handoff. This
build proceeded without a live round-trip, so each was closed out with the most
defensible default rather than left blocking. Revisit any of these with the
business owner if they don't match intent.

## 1. Text-tag convention

No text-tag list was supplied. `frontend/src/shared/ui-tags/index.js` establishes
one: `SCREAMING_SNAKE` constant names holding TitleCase display labels, one file
per domain (statuses, employment types, categories, etc.), so every module
imports the same label instead of re-typing "Business Status" / "business_status"
/ "businss_status" inconsistently.

## 2. Express vs FastAPI split

- **Express** owns everything CRUD/auth: staff directory, recruitment,
  attendance, resource directory, and the entitlement-flag middleware.
- **FastAPI** owns only the Operational Scheduling compute path: availability/
  conflict checks when creating an assignment, and the utilization/workload
  aggregation used by the scheduling summary view. It reads/writes the same
  Postgres database via SQLAlchemy against the `Assignment` / `AssignmentTimeWindow`
  tables Prisma also owns — no schema is FastAPI-exclusive.

Rationale: conflict-checking across overlapping time windows and rollup math is
the one place a Python numerical/scheduling toolset earns its keep; everything
else is routine CRUD better served by staying in one Node service with Prisma.

## 3. `verification_level`

Modeled as an **account attribute** (`Business.verificationLevel` enum:
`BASIC` | `ENHANCED`), not a purchasable flag — it isn't in `BusinessFlags`. The
recruitment-gating rules in spec §3 read it directly off the business record.

## 4. Resource Directory summary (Option 1)

Defined as: Total Workspaces, Total Resources, Active Resources, Under
Maintenance, Awaiting Scheduling (resources with `schedulingRequired = true`
and no current assignment). Implemented in
`backend/express/src/routes/resourceDirectory.js` (`GET /summary`).

## 5. Database schema

Drafted in `prisma/schema.prisma`, covering all five modules plus the shared
Business/Account/Flags layer. Notable modeling calls:

- Fields the spec marks "+ custom" (Employment Type, Status, Category, …) are
  plain `String` columns, not Prisma enums — the UI supplies presets from
  `shared/ui-tags` plus a free-text option, so the DB can't constrain the set.
- Truly closed sets (business/operational status, interview status, candidate
  status, repeat pattern, day of week, …) are Prisma enums.
- `WorkspaceResponsibility` / `ResourceResponsibility` are join tables (a staff
  member can be responsible for many workspaces/resources and vice versa).
- Staff Directory's weekly *availability* (`WorkingScheduleEntry`) and
  Operational Scheduling's assignment *time blocks* (`AssignmentTimeWindow`)
  are separate tables even though the picker UI is shared — they mean
  different things (capacity vs. an actual booking) and belong to different
  owners.

## 6. "Offers Sent" metric (Staff Recruitment summary — surfaced during build, not in the original open-items list)

The candidate status enum spec §6 gives is a closed set — `Applied` (default) /
`Shortlisted` / `Rejected` / `Hired` — with no "Offered" state, yet the summary
(Option 1) asks for both "Offers Sent" and "Hired Candidates" as separate
counts. Rather than invent a status the detail view doesn't list, `Offers Sent`
is approximated as the count of `Shortlisted` candidates (the pre-hire stage
in this simplified funnel). Flag this to the business owner if a distinct
offer step turns out to be intentional — it would need its own status value.

## 7. Utilization math (Operational Scheduling date-scoped breakdown)

The spec asks for Utilization %, Idle/Free Hours, Overtime Hours, and
Downtime/Maintenance Hours (spec §9) without ever defining business hours or
a maintenance time window, so `backend/fastapi/app/services/scheduling.py`
picks pragmatic defaults:

- Every day is a 24-hour capacity window (no separate "operating hours"
  concept exists to divide by instead).
- Staff **Overtime Hours** = hours assigned beyond an 8-hour standard day.
- A resource's `businessStatus == MAINTENANCE` counts as the *entire* day
  under **Maintenance Hours** (the field isn't itself time-scoped); leftover
  idle time is **Downtime**.

These are clearly-labeled approximations, not guesses buried in the code —
revisit if the business defines real operating hours.

## 8. "Total/Available" summary counts (Operational Scheduling today panel)

Spec §9 lists "Total/Available Staff Scheduled", "Total/Available Workspace
Assignments", "Total/Available Resource Assignments" without defining the
Total/Available split. Implemented as: Total = count of that entity type with
an active (business_status/status = active) record; Available = Total minus
however many currently have an ACTIVE assignment right now. In other words,
"Available" reads as free capacity, not entities without any assignment ever.
