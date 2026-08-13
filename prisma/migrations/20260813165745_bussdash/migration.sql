-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('OWNER', 'STAFF_MANAGER', 'RECRUITMENT_MANAGER', 'ATTENDANCE_MANAGER', 'RESOURCE_MANAGER', 'OPERATIONS_MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BASIC', 'ENHANCED');

-- CreateEnum
CREATE TYPE "RecruitmentModelType" AS ENUM ('B2C', 'INTERNAL', 'BOTH');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('PENDING', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "RecruitmentStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RecruitmentAudience" AS ENUM ('B2C', 'INTERNAL');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('LOCATION', 'ONLINE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('B2C', 'WALK_IN');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE', 'OFF');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "ResourceBehavior" AS ENUM ('DEDICATED', 'SHARED');

-- CreateEnum
CREATE TYPE "RepeatPattern" AS ENUM ('NONE', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'BASIC',
    "recruitmentModelType" "RecruitmentModelType" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFlags" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffDirectory" BOOLEAN NOT NULL DEFAULT false,
    "staffRecruitment" BOOLEAN NOT NULL DEFAULT false,
    "staffAttendance" BOOLEAN NOT NULL DEFAULT false,
    "resourceDirectory" BOOLEAN NOT NULL DEFAULT false,
    "operationalScheduling" BOOLEAN NOT NULL DEFAULT false,
    "operationalSchedulingPremium" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "accountId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "profilePhoto" TEXT,
    "title" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "yearsOfExperience" DOUBLE PRECISION,
    "qualifications" TEXT,
    "pastExperience" TEXT,
    "employmentType" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'PENDING',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingScheduleEntry" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "isOff" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "WorkingScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkResponsibility" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffRecruitment" BOOLEAN NOT NULL DEFAULT false,
    "staffAttendance" BOOLEAN NOT NULL DEFAULT false,
    "operationalScheduling" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkResponsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceResponsibility" (
    "staffId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceResponsibility_pkey" PRIMARY KEY ("staffId","workspaceId")
);

-- CreateTable
CREATE TABLE "ResourceResponsibility" (
    "staffId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "ResourceResponsibility_pkey" PRIMARY KEY ("staffId","resourceId")
);

-- CreateTable
CREATE TABLE "Recruitment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experienceRequired" TEXT,
    "employmentType" TEXT,
    "numberOfOpenings" INTEGER,
    "description" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "audience" "RecruitmentAudience",
    "status" "RecruitmentStatus" NOT NULL DEFAULT 'INACTIVE',
    "interviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "launchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "recruitmentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "type" "InterviewType" NOT NULL,
    "locationAddress" TEXT,
    "onlineLink" TEXT,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "interviewerStaffId" TEXT,
    "interviewerManualName" TEXT,
    "description" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "recruitmentId" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cvUrl" TEXT,
    "qualifications" TEXT,
    "experience" TEXT,
    "coverNote" TEXT,
    "portfolio" TEXT,
    "source" "CandidateSource" NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CandidateStatus" NOT NULL DEFAULT 'APPLIED',

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "lateCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "earlyCheckOut" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "businessStatus" "BusinessStatus" NOT NULL DEFAULT 'INACTIVE',
    "operationalStatus" "OperationalStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubSpace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "businessStatus" "BusinessStatus" NOT NULL DEFAULT 'INACTIVE',
    "operationalStatus" "OperationalStatus",
    "behavior" "ResourceBehavior" NOT NULL DEFAULT 'SHARED',
    "schedulingRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceWorkspace" (
    "resourceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "ResourceWorkspace_pkey" PRIMARY KEY ("resourceId","workspaceId")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "resourceId" TEXT,
    "repeatPattern" "RepeatPattern" NOT NULL DEFAULT 'NONE',
    "repeatInterval" INTEGER,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "note" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentTimeWindow" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "AssignmentTimeWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFlags_businessId_key" ON "BusinessFlags"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Staff_businessId_idx" ON "Staff"("businessId");

-- CreateIndex
CREATE INDEX "Staff_accountId_idx" ON "Staff"("accountId");

-- CreateIndex
CREATE INDEX "WorkingScheduleEntry_staffId_idx" ON "WorkingScheduleEntry"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkResponsibility_staffId_key" ON "WorkResponsibility"("staffId");

-- CreateIndex
CREATE INDEX "Recruitment_businessId_idx" ON "Recruitment"("businessId");

-- CreateIndex
CREATE INDEX "InterviewRound_recruitmentId_idx" ON "InterviewRound"("recruitmentId");

-- CreateIndex
CREATE INDEX "Candidate_recruitmentId_idx" ON "Candidate"("recruitmentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_businessId_date_idx" ON "AttendanceRecord"("businessId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_staffId_date_key" ON "AttendanceRecord"("staffId", "date");

-- CreateIndex
CREATE INDEX "Workspace_businessId_idx" ON "Workspace"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_businessId_name_key" ON "Workspace"("businessId", "name");

-- CreateIndex
CREATE INDEX "SubSpace_workspaceId_idx" ON "SubSpace"("workspaceId");

-- CreateIndex
CREATE INDEX "Resource_businessId_idx" ON "Resource"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_businessId_name_key" ON "Resource"("businessId", "name");

-- CreateIndex
CREATE INDEX "Assignment_businessId_idx" ON "Assignment"("businessId");

-- CreateIndex
CREATE INDEX "Assignment_staffId_idx" ON "Assignment"("staffId");

-- CreateIndex
CREATE INDEX "Assignment_workspaceId_idx" ON "Assignment"("workspaceId");

-- CreateIndex
CREATE INDEX "Assignment_resourceId_idx" ON "Assignment"("resourceId");

-- CreateIndex
CREATE INDEX "AssignmentTimeWindow_assignmentId_idx" ON "AssignmentTimeWindow"("assignmentId");

-- AddForeignKey
ALTER TABLE "BusinessFlags" ADD CONSTRAINT "BusinessFlags_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingScheduleEntry" ADD CONSTRAINT "WorkingScheduleEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkResponsibility" ADD CONSTRAINT "WorkResponsibility_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceResponsibility" ADD CONSTRAINT "WorkspaceResponsibility_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceResponsibility" ADD CONSTRAINT "WorkspaceResponsibility_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceResponsibility" ADD CONSTRAINT "ResourceResponsibility_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceResponsibility" ADD CONSTRAINT "ResourceResponsibility_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_recruitmentId_fkey" FOREIGN KEY ("recruitmentId") REFERENCES "Recruitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_interviewerStaffId_fkey" FOREIGN KEY ("interviewerStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_recruitmentId_fkey" FOREIGN KEY ("recruitmentId") REFERENCES "Recruitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSpace" ADD CONSTRAINT "SubSpace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceWorkspace" ADD CONSTRAINT "ResourceWorkspace_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceWorkspace" ADD CONSTRAINT "ResourceWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentTimeWindow" ADD CONSTRAINT "AssignmentTimeWindow_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
