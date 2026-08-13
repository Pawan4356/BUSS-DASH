from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import SchedulingContext, require_scheduling_access
from ..db import get_db
from ..models import Assignment, AssignmentTimeWindow, Resource, ResourceWorkspace, Staff, Workspace
from ..schemas import AssignmentCreate
from ..services import scheduling as svc

router = APIRouter(prefix="/scheduling", tags=["operational-scheduling"])


def _parse_date(value: str | None) -> date:
    return date.fromisoformat(value) if value else date.today()


def _staff_label(staff: Staff) -> str:
    return " ".join(filter(None, [staff.firstName, staff.lastName])) or staff.id


def serialize_assignment(assignment: Assignment) -> dict:
    return {
        "id": assignment.id,
        "staffId": assignment.staffId,
        "staffName": _staff_label(assignment.staff) if assignment.staff else None,
        "workspaceId": assignment.workspaceId,
        "resourceId": assignment.resourceId,
        "note": assignment.note,
        "repeatPattern": assignment.repeatPattern,
        "repeatInterval": assignment.repeatInterval,
        "startDate": assignment.startDate.isoformat(),
        "endDate": assignment.endDate.isoformat() if assignment.endDate else None,
        "status": assignment.status,
        "timeWindows": [
            {"dayOfWeek": w.dayOfWeek, "startTime": w.startTime, "endTime": w.endTime}
            for w in assignment.timeWindows
        ],
    }


@router.get("/summary")
def get_summary(
    date_str: str | None = None,
    ctx: SchedulingContext = Depends(require_scheduling_access()),
    db: Session = Depends(get_db),
):
    svc.recompute_statuses(db, ctx.business.id)
    svc.refresh_operational_status(db, ctx.business.id)
    target = _parse_date(date_str)

    total_staff = db.query(Staff).filter(Staff.businessId == ctx.business.id, Staff.archived.is_(False)).count()
    total_workspaces = db.query(Workspace).filter(
        Workspace.businessId == ctx.business.id, Workspace.businessStatus == "ACTIVE"
    ).count()
    total_resources = db.query(Resource).filter(
        Resource.businessId == ctx.business.id, Resource.businessStatus == "ACTIVE"
    ).count()

    active_assignments = (
        db.query(Assignment).filter(Assignment.businessId == ctx.business.id, Assignment.status == "ACTIVE").all()
    )
    scheduled_staff_ids = {a.staffId for a in active_assignments}
    occupied_workspace_ids = {a.workspaceId for a in active_assignments if a.workspaceId}
    occupied_resource_ids = {a.resourceId for a in active_assignments if a.resourceId}

    counts = {
        status_key: db.query(Assignment)
        .filter(Assignment.businessId == ctx.business.id, Assignment.status == status_key)
        .count()
        for status_key in ("ACTIVE", "UPCOMING", "COMPLETED")
    }

    today_summary = {
        "totalStaffScheduled": total_staff,
        "availableStaff": max(0, total_staff - len(scheduled_staff_ids)),
        "totalWorkspaceAssignments": total_workspaces,
        "availableWorkspaces": max(0, total_workspaces - len(occupied_workspace_ids)),
        "totalResourceAssignments": total_resources,
        "availableResources": max(0, total_resources - len(occupied_resource_ids)),
        "activeAssignments": counts["ACTIVE"],
        "upcomingAssignments": counts["UPCOMING"],
        "completedAssignments": counts["COMPLETED"],
    }

    payload = {"today": today_summary, "breakdown": svc.utilization_for_date(db, ctx.business.id, target), "date": target.isoformat()}

    if ctx.flags.operationalSchedulingPremium:
        payload["workload"] = svc.hourly_workload(db, ctx.business.id, target)

    return payload


@router.get("/summary/trend")
def get_trend(
    month: str | None = None,
    ctx: SchedulingContext = Depends(require_scheduling_access()),
    db: Session = Depends(get_db),
):
    anchor = date.fromisoformat(f"{month}-01") if month else date.today().replace(day=1)
    next_month = (anchor.replace(day=28) + timedelta(days=4)).replace(day=1)
    days_in_month = (next_month - anchor).days

    points = []
    for offset in range(days_in_month):
        day = anchor + timedelta(days=offset)
        breakdown = svc.utilization_for_date(db, ctx.business.id, day)
        points.append(
            {
                "date": day.isoformat(),
                "staffHours": round(sum(r["assignedHours"] for r in breakdown["staff"]), 2),
                "workspaceHours": round(sum(r["occupiedHours"] for r in breakdown["workspaces"]), 2),
                "resourceHours": round(sum(r["usageHours"] for r in breakdown["resources"]), 2),
            }
        )
    return {"month": anchor.strftime("%Y-%m"), "points": points}


@router.get("/list")
def get_list(
    date_str: str | None = None,
    ctx: SchedulingContext = Depends(require_scheduling_access()),
    db: Session = Depends(get_db),
):
    svc.recompute_statuses(db, ctx.business.id)
    target = _parse_date(date_str)

    def assignments_for(*, workspace_id=None, resource_id=None, staff_id=None):
        q = db.query(Assignment).filter(Assignment.businessId == ctx.business.id, Assignment.status != "CANCELLED")
        if workspace_id:
            q = q.filter(Assignment.workspaceId == workspace_id)
        if resource_id:
            q = q.filter(Assignment.resourceId == resource_id)
        if staff_id:
            q = q.filter(Assignment.staffId == staff_id)
        return [serialize_assignment(a) for a in q.all() if svc.covers_date(a, target)]

    def serialize_resource_card(resource: Resource):
        card = {
            "id": resource.id,
            "name": resource.name,
            "behavior": resource.behavior,
            "schedulingRequired": resource.schedulingRequired,
        }
        entries = assignments_for(resource_id=resource.id)
        if resource.behavior == "DEDICATED":
            card["assignee"] = entries[0]["staffName"] if entries else None
        else:
            card["assignments"] = entries
        return card

    workspaces = db.query(Workspace).filter(
        Workspace.businessId == ctx.business.id, Workspace.businessStatus == "ACTIVE"
    ).all()
    workspace_resources_tab = []
    linked_resource_ids = set()
    for workspace in workspaces:
        resources = (
            db.query(Resource)
            .join(ResourceWorkspace, ResourceWorkspace.resourceId == Resource.id)
            .filter(
                ResourceWorkspace.workspaceId == workspace.id,
                Resource.businessId == ctx.business.id,
                Resource.businessStatus == "ACTIVE",
            )
            .all()
        )
        linked_resource_ids.update(r.id for r in resources)
        workspace_resources_tab.append(
            {
                "id": workspace.id,
                "name": workspace.name,
                "assignments": assignments_for(workspace_id=workspace.id),
                "resources": [serialize_resource_card(r) for r in resources],
            }
        )

    independent_query = db.query(Resource).filter(
        Resource.businessId == ctx.business.id, Resource.businessStatus == "ACTIVE"
    )
    if linked_resource_ids:
        independent_query = independent_query.filter(~Resource.id.in_(linked_resource_ids))
    independent_resources = independent_query.all()
    independent_resources_tab = [serialize_resource_card(r) for r in independent_resources]

    payload = {
        "date": target.isoformat(),
        "workspaceResources": workspace_resources_tab,
        "independentResources": independent_resources_tab,
        "pickers": {
            "staff": [
                {"id": s.id, "name": _staff_label(s)}
                for s in db.query(Staff).filter(Staff.businessId == ctx.business.id, Staff.status == "ACTIVE").all()
            ],
            "workspaces": [{"id": w.id, "name": w.name} for w in workspaces],
            "resources": [
                {"id": r.id, "name": r.name}
                for r in db.query(Resource)
                .filter(Resource.businessId == ctx.business.id, Resource.businessStatus == "ACTIVE")
                .all()
            ],
        },
    }

    if ctx.flags.operationalSchedulingPremium:
        staff_rows = db.query(Staff).filter(Staff.businessId == ctx.business.id, Staff.status == "ACTIVE").all()
        payload["staff"] = [
            {"id": s.id, "name": _staff_label(s), "schedule": assignments_for(staff_id=s.id)} for s in staff_rows
        ]

    return payload


@router.post("/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(
    body: AssignmentCreate,
    ctx: SchedulingContext = Depends(require_scheduling_access()),
    db: Session = Depends(get_db),
):
    conflicts = svc.find_conflicts(
        db,
        business_id=ctx.business.id,
        staff_id=body.staffId,
        workspace_id=body.workspaceId,
        resource_id=body.resourceId,
        time_windows=body.timeWindows,
        start_date=body.startDate,
        end_date=body.endDate,
    )
    if conflicts and not body.forceAssign:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"conflicts": conflicts})

    now = datetime.now()
    assignment = Assignment(
        id=svc.new_id(),
        businessId=ctx.business.id,
        staffId=body.staffId,
        workspaceId=body.workspaceId,
        resourceId=body.resourceId,
        repeatPattern=body.repeatPattern,
        repeatInterval=body.repeatInterval,
        startDate=body.startDate,
        endDate=body.endDate,
        note=body.note,
        status="UPCOMING",
        createdAt=now,
        updatedAt=now,
    )
    db.add(assignment)
    db.flush()
    for w in body.timeWindows:
        db.add(
            AssignmentTimeWindow(
                id=svc.new_id(),
                assignmentId=assignment.id,
                dayOfWeek=w.dayOfWeek,
                startTime=w.startTime,
                endTime=w.endTime,
            )
        )
    db.commit()

    svc.recompute_statuses(db, ctx.business.id)
    svc.refresh_operational_status(db, ctx.business.id)
    db.refresh(assignment)
    return serialize_assignment(assignment)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_assignment(
    assignment_id: str,
    ctx: SchedulingContext = Depends(require_scheduling_access()),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if not assignment or assignment.businessId != ctx.business.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    assignment.status = "CANCELLED"
    db.commit()
    svc.refresh_operational_status(db, ctx.business.id)
