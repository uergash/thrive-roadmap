-- Adds feedback table fields for operational transparency and richer concept storytelling

CREATE TYPE "FeedbackWorkflowStatus" AS ENUM ('NOT_STARTED', 'TRIAGED', 'IN_PROGRESS', 'ADDRESSED');

ALTER TABLE "FeedbackEntry"
  ADD COLUMN "submittedBy" TEXT,
  ADD COLUMN "isBeingAddressed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "workflowStatus" "FeedbackWorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "jiraUrl" TEXT;

ALTER TABLE "Concept"
  ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "howItWorks" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "whyValuable" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "validationPlan" TEXT NOT NULL DEFAULT '';

UPDATE "Concept"
SET
  "summary" = COALESCE(NULLIF("title", ''), 'Concept summary pending'),
  "howItWorks" = COALESCE(NULLIF("hypothesis", ''), 'Details pending'),
  "whyValuable" = COALESCE(NULLIF("problem", ''), 'Value statement pending'),
  "validationPlan" = 'Validation approach pending';
