from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

DAY_KEYS = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"}


class TimeWindowIn(BaseModel):
    dayOfWeek: Literal["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    startTime: str
    endTime: str

    @field_validator("endTime")
    @classmethod
    def end_after_start(cls, end_time: str, info):
        start_time = info.data.get("startTime")
        if start_time and end_time <= start_time:
            raise ValueError("endTime must be after startTime")
        return end_time


class AssignmentCreate(BaseModel):
    staffId: str
    workspaceId: Optional[str] = None
    resourceId: Optional[str] = None
    timeWindows: list[TimeWindowIn]
    repeatPattern: Literal["NONE", "WEEKLY", "CUSTOM"] = "NONE"
    repeatInterval: Optional[int] = None
    startDate: date
    endDate: Optional[date] = None
    note: Optional[str] = None
    forceAssign: bool = False

    @field_validator("timeWindows")
    @classmethod
    def at_least_one_window(cls, windows):
        if len(windows) == 0:
            raise ValueError("At least one time window is required")
        return windows

    @field_validator("resourceId")
    @classmethod
    def requires_a_target(cls, resource_id, info):
        if not resource_id and not info.data.get("workspaceId"):
            raise ValueError("Either workspaceId or resourceId is required")
        return resource_id
