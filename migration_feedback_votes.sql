-- Adds per-user voting for feedback prioritization

CREATE TABLE "FeedbackVote" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedbackVote_feedbackId_userId_key" ON "FeedbackVote"("feedbackId", "userId");

ALTER TABLE "FeedbackVote"
  ADD CONSTRAINT "FeedbackVote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeedbackVote"
  ADD CONSTRAINT "FeedbackVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
