"""Server-side entitlement resolution — third copy of the spec §3 rules,
alongside frontend/src/shared/flags and backend/express/src/lib/entitlements.js.
FastAPI only ever needs the Operational Scheduling branch, but the full
dependency chain is kept here so the "requires-staff-and-resource-directory"
reason stays consistent with the other two services.
"""

OPERATIONAL_SCHEDULING = "operationalScheduling"
OPERATIONAL_SCHEDULING_PREMIUM = "operationalSchedulingPremium"


def resolve_scheduling_access(flags, premium_required: bool = False):
    if not flags:
        return False, "not-purchased"

    if not flags.operationalScheduling:
        return False, "not-purchased"
    if not flags.staffDirectory or not flags.resourceDirectory:
        return False, "requires-staff-and-resource-directory"

    if premium_required and not flags.operationalSchedulingPremium:
        return False, "not-purchased"

    return True, None
