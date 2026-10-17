-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'AUTHORITY', 'ZONE_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('HINDI', 'ENGLISH', 'HINGLISH');

-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('TEXT', 'VOICE', 'IMAGE');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING_REVIEW', 'DUPLICATE_REVIEW', 'APPROVED', 'REJECTED', 'MERGED_DUPLICATE');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DuplicateDecision" AS ENUM ('PENDING', 'SAME_ISSUE', 'DIFFERENT_ISSUE');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('CITIZEN', 'AUTHORITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ISSUE_SUBMITTED', 'ISSUE_APPROVED', 'ISSUE_REJECTED', 'DUPLICATE_DETECTED', 'ISSUE_ASSIGNED', 'STATUS_CHANGED', 'ISSUE_RESOLVED', 'NEW_MESSAGE', 'THIRTY_DAY_UPDATE', 'NEW_REVIEW', 'POSSIBLE_DUPLICATE', 'HIGH_URGENCY', 'APPROACHING_30_DAYS', 'EXPLANATION_REQUIRED');

-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('VALIDATED', 'IMPORTED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "departmentId" TEXT,
    "zoneWardIds" INTEGER[],
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "slaHours" INTEGER NOT NULL DEFAULT 72,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "keywords" TEXT[],
    "safetyRisk" INTEGER NOT NULL DEFAULT 0,
    "serviceRisk" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wardId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalityAlias" (
    "id" TEXT NOT NULL,
    "localityId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "isLandmark" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "reporterId" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "text" TEXT NOT NULL,
    "inputMode" "InputMode" NOT NULL DEFAULT 'TEXT',
    "imageUrl" TEXT,
    "imageCaption" TEXT,
    "locationText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" "Language",
    "aiDepartmentId" TEXT,
    "categoryId" TEXT,
    "urgency" "Urgency",
    "urgencyScore" INTEGER,
    "urgencyReasons" TEXT[],
    "localityId" TEXT,
    "wardId" INTEGER,
    "keyTerms" TEXT[],
    "aiConfidence" DOUBLE PRECISION,
    "aiExplanation" JSONB,
    "aiIsDemo" BOOLEAN NOT NULL DEFAULT true,
    "embedding" DOUBLE PRECISION[],
    "issueId" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "localityId" TEXT,
    "wardId" INTEGER,
    "urgency" "Urgency" NOT NULL,
    "urgencyScore" INTEGER NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'APPROVED',
    "reportCount" INTEGER NOT NULL DEFAULT 1,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "firstReportedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateMatch" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "textScore" DOUBLE PRECISION NOT NULL,
    "locationScore" DOUBLE PRECISION NOT NULL,
    "categoryScore" DOUBLE PRECISION NOT NULL,
    "timeScore" DOUBLE PRECISION NOT NULL,
    "decision" "DuplicateDecision" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("issueId","userId")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ASSIGNED',
    "expectedResolution" TIMESTAMP(3) NOT NULL,
    "medianHoursAtCreate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueUpdate" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "IssueStatus",
    "note" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityExplanation" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "expectedResolution" TIMESTAMP(3) NOT NULL,
    "actionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorityExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionRecord" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL,
    "evidenceUrl" TEXT,

    CONSTRAINT "ResolutionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalRecord" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT,
    "externalId" TEXT,
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT,
    "wardId" INTEGER,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "HistoricalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "complaintId" TEXT,
    "sender" "MessageSender" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyDigest" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL,
    "totalRecords" INTEGER NOT NULL,
    "validRecords" INTEGER NOT NULL,
    "invalidRecords" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Category_departmentId_idx" ON "Category"("departmentId");

-- CreateIndex
CREATE INDEX "Locality_wardId_idx" ON "Locality"("wardId");

-- CreateIndex
CREATE INDEX "LocalityAlias_alias_idx" ON "LocalityAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "LocalityAlias_localityId_alias_key" ON "LocalityAlias"("localityId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_reference_key" ON "Complaint"("reference");

-- CreateIndex
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_reporterId_idx" ON "Complaint"("reporterId");

-- CreateIndex
CREATE INDEX "Complaint_issueId_idx" ON "Complaint"("issueId");

-- CreateIndex
CREATE INDEX "Complaint_categoryId_wardId_createdAt_idx" ON "Complaint"("categoryId", "wardId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_reference_key" ON "Issue"("reference");

-- CreateIndex
CREATE INDEX "Issue_status_firstReportedAt_idx" ON "Issue"("status", "firstReportedAt");

-- CreateIndex
CREATE INDEX "Issue_departmentId_status_idx" ON "Issue"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Issue_wardId_categoryId_idx" ON "Issue"("wardId", "categoryId");

-- CreateIndex
CREATE INDEX "Issue_upvoteCount_idx" ON "Issue"("upvoteCount");

-- CreateIndex
CREATE INDEX "DuplicateMatch_decision_idx" ON "DuplicateMatch"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateMatch_complaintId_issueId_key" ON "DuplicateMatch"("complaintId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_reference_key" ON "Ticket"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_issueId_key" ON "Ticket"("issueId");

-- CreateIndex
CREATE INDEX "Ticket_departmentId_status_idx" ON "Ticket"("departmentId", "status");

-- CreateIndex
CREATE INDEX "IssueUpdate_issueId_createdAt_idx" ON "IssueUpdate"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthorityExplanation_issueId_idx" ON "AuthorityExplanation"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionRecord_issueId_key" ON "ResolutionRecord"("issueId");

-- CreateIndex
CREATE INDEX "HistoricalRecord_departmentId_idx" ON "HistoricalRecord"("departmentId");

-- CreateIndex
CREATE INDEX "HistoricalRecord_categoryId_idx" ON "HistoricalRecord"("categoryId");

-- CreateIndex
CREATE INDEX "HistoricalRecord_wardId_idx" ON "HistoricalRecord"("wardId");

-- CreateIndex
CREATE INDEX "Message_issueId_createdAt_idx" ON "Message"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_complaintId_createdAt_idx" ON "Message"("complaintId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDigest_departmentId_weekStart_key" ON "WeeklyDigest"("departmentId", "weekStart");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locality" ADD CONSTRAINT "Locality_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalityAlias" ADD CONSTRAINT "LocalityAlias_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateMatch" ADD CONSTRAINT "DuplicateMatch_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateMatch" ADD CONSTRAINT "DuplicateMatch_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueUpdate" ADD CONSTRAINT "IssueUpdate_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityExplanation" ADD CONSTRAINT "AuthorityExplanation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionRecord" ADD CONSTRAINT "ResolutionRecord_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalRecord" ADD CONSTRAINT "HistoricalRecord_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDigest" ADD CONSTRAINT "WeeklyDigest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

