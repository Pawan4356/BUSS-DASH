from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import Account, Business, BusinessFlags
from .entitlements import resolve_scheduling_access

bearer_scheme = HTTPBearer()


@dataclass
class SchedulingContext:
    account: Account
    business: Business
    flags: BusinessFlags


def get_current_account(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Account:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    account = db.get(Account, payload.get("accountId"))
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists")
    return account


REASON_MESSAGES = {
    "not-purchased": "This module is not part of your current plan.",
    "requires-staff-and-resource-directory": "Operational Scheduling requires both Staff Directory and Resource Directory.",
}


SCHEDULING_MANAGER_ROLES = {"OWNER", "OPERATIONS_MANAGER"}


def require_scheduling_access(premium: bool = False, manage: bool = False):
    def dependency(
        account: Account = Depends(get_current_account),
        db: Session = Depends(get_db),
    ) -> SchedulingContext:
        business = db.get(Business, account.businessId)
        flags = business.flags if business else None
        allowed, reason = resolve_scheduling_access(flags, premium_required=premium)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": REASON_MESSAGES.get(reason, "Access denied"), "reason": reason},
            )
        # Mirrors backend/express/src/lib/permissions.js — writes need a
        # role that manages Operational Scheduling.
        if manage and account.role not in SCHEDULING_MANAGER_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Your role does not allow changes in this module.", "reason": "insufficient-role"},
            )
        return SchedulingContext(account=account, business=business, flags=flags)

    return dependency
