"""
Core scheduling computations: conflict detection, assignment status
recomputation, and the utilization/workload aggregation behind the
Operational Scheduling summary (spec §9).

Utilization assumptions (no business-hours concept exists in the spec, so a
pragmatic default was picked — see docs/decisions.md #7):
  - Every day is treated as a 24-hour capacity window for Utilization %.
  - "Overtime Hours" (staff) = hours assigned beyond an 8-hour standard day.
  - A resource's "Maintenance Hours" = the full day when businessStatus is
    MAINTENANCE (status isn't itself time-scoped); "Downtime" is whatever's
    left over after usage and maintenance.
"""

from datetime import date, datetime, timedelta
import uuid

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from ..models import Assignment, AssignmentTimeWindow, Resource, Staff, Workspace

DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
STANDARD_DAY_HOURS = 8
CAPACITY_HOURS = 24


def new_id() -> str:
    return uuid.uuid4().hex


def day_key(d: date) -> str:
    return DAY_ORDER[d.weekday()]


def to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def window_hours(window: AssignmentTimeWindow) -> float:
    return max(0, to_minutes(window.endTime) - to_minutes(window.startTime)) / 60


def _effective_end(assignment: Assignment) -> date | None:
    if assignment.endDate:
        return assignment.endDate
    if assignment.repeatPattern == "NONE":
        return assignment.startDate
    return None  # open-ended weekly/custom recurrence


def covers_date(assignment: Assignment, target: date) -> bool:
    if target < assignment.startDate:
        return False
    end = _effective_end(assignment)
    if end and target > end:
        return False

    if assignment.repeatPattern == "NONE":
        return target == assignment.startDate
    if assignment.repeatPattern == "WEEKLY":
        return True
    # CUSTOM: every `repeatInterval` weeks from startDate
    interval = assignment.repeatPattern == "CUSTOM" and (assignment.repeatInterval or 1)
    weeks_elapsed = (target - assignment.startDate).days // 7
    return (target - assignment.startDate).days % (7 * interval) == 0 if interval else False


def classify_status(assignment: Assignment, today: date, now_hhmm: str) -> str:
    end = _effective_end(assignment)
    if end and end < today:
        return "COMPLETED"
    if assignment.startDate > today:
        return "UPCOMING"
    if not covers_date(assignment, today):
        return "UPCOMING"

    todays_key = day_key(today)
    active_now = any(
        w.dayOfWeek == todays_key and w.startTime <= now_hhmm <= w.endTime for w in assignment.timeWindows
    )
    return "ACTIVE" if active_now else "UPCOMING"


def recompute_statuses(db: Session, business_id: str) -> None:
    now = datetime.now()
    today = now.date()
    now_hhmm = now.strftime("%H:%M")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.businessId == business_id, Assignment.status != "CANCELLED")
        .all()
    )
    for assignment in assignments:
        new_status = classify_status(assignment, today, now_hhmm)
        if new_status != assignment.status:
            assignment.status = new_status
    db.commit()


def refresh_operational_status(db: Session, business_id: str) -> None:
    """Auto-updates Workspace/Resource.operationalStatus (spec §8) from
    whichever assignments are ACTIVE right now. Call after recompute_statuses."""
    active = db.query(Assignment).filter(Assignment.businessId == business_id, Assignment.status == "ACTIVE").all()
    active_workspace_ids = {a.workspaceId for a in active if a.workspaceId}
    active_resource_ids = {a.resourceId for a in active if a.resourceId}

    for workspace in db.query(Workspace).filter(Workspace.businessId == business_id).all():
        workspace.operationalStatus = "NOT_AVAILABLE" if workspace.id in active_workspace_ids else "AVAILABLE"
    for resource in db.query(Resource).filter(Resource.businessId == business_id).all():
        resource.operationalStatus = "NOT_AVAILABLE" if resource.id in active_resource_ids else "AVAILABLE"
    db.commit()


def windows_overlap(a: AssignmentTimeWindow, b) -> bool:
    return a.dayOfWeek == b.dayOfWeek and a.startTime < b.endTime and b.startTime < a.endTime


def find_conflicts(db: Session, *, business_id, staff_id, workspace_id, resource_id, time_windows, start_date, end_date, exclude_assignment_id=None):
    """Returns a list of {assignment, entity_type, entity_name} for any existing
    assignment on the same staff/workspace/resource whose active date range and
    weekly windows overlap the proposed ones."""

    entity_filters = [Assignment.staffId == staff_id]
    if workspace_id:
        entity_filters.append(Assignment.workspaceId == workspace_id)
    if resource_id:
        entity_filters.append(Assignment.resourceId == resource_id)

    query = db.query(Assignment).filter(
        Assignment.businessId == business_id,
        Assignment.status != "CANCELLED",
        or_(*entity_filters),
    )
    if exclude_assignment_id:
        query = query.filter(Assignment.id != exclude_assignment_id)

    proposed_end = end_date or start_date
    conflicts = []
    for candidate in query.all():
        candidate_end = _effective_end(candidate) or date.max
        if not (start_date <= candidate_end and candidate.startDate <= proposed_end):
            continue

        overlapping_window = next(
            (w for w in candidate.timeWindows for proposed in time_windows if windows_overlap(w, proposed)),
            None,
        )
        if not overlapping_window:
            continue

        if candidate.staffId == staff_id:
            entity_type, entity_name = "staff", _staff_name(db, staff_id)
        elif workspace_id and candidate.workspaceId == workspace_id:
            entity_type, entity_name = "workspace", _entity_name(db, Workspace, workspace_id)
        else:
            entity_type, entity_name = "resource", _entity_name(db, Resource, resource_id)

        conflicts.append(
            {
                "assignmentId": candidate.id,
                "conflictsOn": entity_type,
                "currentlyAssignedTo": entity_name,
                "dayOfWeek": overlapping_window.dayOfWeek,
                "window": {"start": overlapping_window.startTime, "end": overlapping_window.endTime},
            }
        )
    return conflicts


def _staff_name(db, staff_id):
    staff = db.get(Staff, staff_id)
    if not staff:
        return None
    return " ".join(filter(None, [staff.firstName, staff.lastName])) or staff_id


def _entity_name(db, model, entity_id):
    row = db.get(model, entity_id)
    return row.name if row else None


def utilization_for_date(db: Session, business_id: str, target: date):
    """Per-entity Assigned/Occupied/Usage Hours for the given date, per spec §9's
    date-scoped breakdown."""
    assignments = (
        db.query(Assignment)
        .filter(Assignment.businessId == business_id, Assignment.status != "CANCELLED")
        .all()
    )
    todays_key = day_key(target)

    staff_hours: dict[str, float] = {}
    workspace_hours: dict[str, float] = {}
    resource_hours: dict[str, float] = {}
    workspace_usage: dict[str, int] = {}
    resource_usage: dict[str, int] = {}

    for assignment in assignments:
        if not covers_date(assignment, target):
            continue
        todays_windows = [w for w in assignment.timeWindows if w.dayOfWeek == todays_key]
        if not todays_windows:
            continue
        hours = sum(window_hours(w) for w in todays_windows)

        staff_hours[assignment.staffId] = staff_hours.get(assignment.staffId, 0) + hours
        if assignment.workspaceId:
            workspace_hours[assignment.workspaceId] = workspace_hours.get(assignment.workspaceId, 0) + hours
            workspace_usage[assignment.workspaceId] = workspace_usage.get(assignment.workspaceId, 0) + 1
        if assignment.resourceId:
            resource_hours[assignment.resourceId] = resource_hours.get(assignment.resourceId, 0) + hours
            resource_usage[assignment.resourceId] = resource_usage.get(assignment.resourceId, 0) + 1

    staff_rows = []
    for staff in db.query(Staff).filter(Staff.businessId == business_id, Staff.archived.is_(False)).all():
        assigned = staff_hours.get(staff.id, 0)
        staff_rows.append(
            {
                "staffId": staff.id,
                "name": _staff_name(db, staff.id),
                "assignedHours": round(assigned, 2),
                "idleHours": round(max(0, CAPACITY_HOURS - assigned), 2),
                "utilizationPct": round(min(100, assigned / CAPACITY_HOURS * 100), 1),
                "overtimeHours": round(max(0, assigned - STANDARD_DAY_HOURS), 2),
            }
        )

    workspace_rows = []
    for workspace in db.query(Workspace).filter(Workspace.businessId == business_id).all():
        occupied = workspace_hours.get(workspace.id, 0)
        workspace_rows.append(
            {
                "workspaceId": workspace.id,
                "name": workspace.name,
                "occupiedHours": round(occupied, 2),
                "freeHours": round(max(0, CAPACITY_HOURS - occupied), 2),
                "utilizationPct": round(min(100, occupied / CAPACITY_HOURS * 100), 1),
                "usageCount": workspace_usage.get(workspace.id, 0),
            }
        )

    resource_rows = []
    for resource in db.query(Resource).filter(Resource.businessId == business_id).all():
        usage = resource_hours.get(resource.id, 0)
        maintenance = CAPACITY_HOURS if resource.businessStatus == "MAINTENANCE" else 0
        downtime = max(0, CAPACITY_HOURS - usage - maintenance)
        resource_rows.append(
            {
                "resourceId": resource.id,
                "name": resource.name,
                "usageHours": round(usage, 2),
                "downtimeHours": round(downtime, 2),
                "maintenanceHours": maintenance,
                "utilizationPct": round(min(100, usage / CAPACITY_HOURS * 100), 1),
                "usageCount": resource_usage.get(resource.id, 0),
            }
        )

    return {"staff": staff_rows, "workspaces": workspace_rows, "resources": resource_rows}


def hourly_workload(db: Session, business_id: str, target: date):
    """Premium: concurrent-assignment count per hour of `target`, for the
    workload bar chart, plus the peak hour."""
    assignments = (
        db.query(Assignment)
        .filter(Assignment.businessId == business_id, Assignment.status != "CANCELLED")
        .all()
    )
    todays_key = day_key(target)
    counts = [0] * 24

    for assignment in assignments:
        if not covers_date(assignment, target):
            continue
        for w in assignment.timeWindows:
            if w.dayOfWeek != todays_key:
                continue
            start_hour = to_minutes(w.startTime) // 60
            end_hour = max(start_hour, (to_minutes(w.endTime) - 1) // 60)
            for hour in range(start_hour, min(end_hour + 1, 24)):
                counts[hour] += 1

    peak_hour = max(range(24), key=lambda h: counts[h]) if any(counts) else None
    return {"hours": counts, "peakHour": peak_hour}
