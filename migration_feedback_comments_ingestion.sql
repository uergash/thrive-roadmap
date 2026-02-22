-- Feedback comments + external ingestion metadata

DO $$ BEGIN
  CREATE TYPE "ExternalFeedbackSource" AS ENUM ('MANUAL', 'NOTION', 'SLACK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "FeedbackEntry"
  ADD COLUMN IF NOT EXISTS "externalSource" "ExternalFeedbackSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "rawSourceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackEntry_externalSource_externalId_key"
  ON "FeedbackEntry"("externalSource", "externalId");

CREATE TABLE IF NOT EXISTS "FeedbackComment" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FeedbackComment" DROP CONSTRAINT IF EXISTS "FeedbackComment_feedbackId_fkey";
ALTER TABLE "FeedbackComment"
  ADD CONSTRAINT "FeedbackComment_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "FeedbackEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeedbackComment" DROP CONSTRAINT IF EXISTS "FeedbackComment_authorId_fkey";
ALTER TABLE "FeedbackComment"
  ADD CONSTRAINT "FeedbackComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
