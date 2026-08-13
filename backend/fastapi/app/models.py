"""
SQLAlchemy models mirroring the Prisma schema (prisma/schema.prisma) — this
service reads/writes the same Postgres database Express/Prisma owns. Only the
tables the scheduling engine actually touches are modeled here; Prisma remains
the source of truth for the schema itself (see docs/decisions.md #2).

Enum-typed Postgres columns are declared as plain String — Prisma writes the
same label set (e.g. "AVAILABLE"/"NOT_AVAILABLE") we read/write here, so a
native SQLAlchemy Enum isn't needed and this avoids having to keep two enum
definitions in sync.
"""

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .db import Base


class Business(Base):
    __tablename__ = "Business"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    verificationLevel = Column(String, nullable=False)
    recruitmentModelType = Column(String, nullable=False)

    flags = relationship("BusinessFlags", back_populates="business", uselist=False)


class BusinessFlags(Base):
    __tablename__ = "BusinessFlags"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), unique=True, nullable=False)
    staffDirectory = Column(Boolean, default=False)
    staffRecruitment = Column(Boolean, default=False)
    staffAttendance = Column(Boolean, default=False)
    resourceDirectory = Column(Boolean, default=False)
    operationalScheduling = Column(Boolean, default=False)
    operationalSchedulingPremium = Column(Boolean, default=False)

    business = relationship("Business", back_populates="flags")


class Account(Base):
    __tablename__ = "Account"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)


class Staff(Base):
    __tablename__ = "Staff"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), nullable=False)
    firstName = Column(String)
    lastName = Column(String)
    status = Column(String, nullable=False)
    archived = Column(Boolean, default=False)


class Workspace(Base):
    __tablename__ = "Workspace"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), nullable=False)
    name = Column(String, nullable=False)
    businessStatus = Column(String, nullable=False)
    operationalStatus = Column(String)


class Resource(Base):
    __tablename__ = "Resource"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), nullable=False)
    name = Column(String, nullable=False)
    businessStatus = Column(String, nullable=False)
    operationalStatus = Column(String)
    behavior = Column(String, nullable=False)
    schedulingRequired = Column(Boolean, default=False)


class ResourceWorkspace(Base):
    __tablename__ = "ResourceWorkspace"

    resourceId = Column(String, ForeignKey("Resource.id"), primary_key=True)
    workspaceId = Column(String, ForeignKey("Workspace.id"), primary_key=True)


class Assignment(Base):
    __tablename__ = "Assignment"

    id = Column(String, primary_key=True)
    businessId = Column(String, ForeignKey("Business.id"), nullable=False)
    staffId = Column(String, ForeignKey("Staff.id"), nullable=False)
    workspaceId = Column(String, ForeignKey("Workspace.id"), nullable=True)
    resourceId = Column(String, ForeignKey("Resource.id"), nullable=True)
    repeatPattern = Column(String, nullable=False, default="NONE")
    repeatInterval = Column(Integer)
    startDate = Column(Date, nullable=False)
    endDate = Column(Date)
    note = Column(String)
    status = Column(String, nullable=False, default="UPCOMING")
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)

    timeWindows = relationship("AssignmentTimeWindow", back_populates="assignment", cascade="all, delete-orphan")
    staff = relationship("Staff")
    workspace = relationship("Workspace")
    resource = relationship("Resource")


class AssignmentTimeWindow(Base):
    __tablename__ = "AssignmentTimeWindow"

    id = Column(String, primary_key=True)
    assignmentId = Column(String, ForeignKey("Assignment.id"), nullable=False)
    dayOfWeek = Column(String, nullable=False)
    startTime = Column(String, nullable=False)
    endTime = Column(String, nullable=False)

    assignment = relationship("Assignment", back_populates="timeWindows")
