-- Feedback + Concepts public communication data model

CREATE TYPE "FeedbackSource" AS ENUM ('SLACK', 'INTERVIEW', 'SUPPORT', 'SALES', 'OTHER');
CREATE TYPE "ConceptStage" AS ENUM ('EXPLORING', 'VALIDATING', 'PLANNED');
CREATE TYPE "ConceptArtifactType" AS ENUM ('MOCKUP', 'PROTOTYPE', 'DOC');

CREATE TABLE "FeedbackTheme" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackTheme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedbackTheme_name_key" ON "FeedbackTheme"("name");

CREATE TABLE "FeedbackEntry" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "source" "FeedbackSource" NOT NULL,
  "sourceRef" TEXT,
  "customerSegment" TEXT,
  "urgency" INTEGER NOT NULL DEFAULT 3,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "themeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedbackRoadmapItem" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackRoadmapItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedbackRoadmapItem_feedbackId_itemId_key" ON "FeedbackRoadmapItem"("feedbackId", "itemId");

CREATE TABLE "Concept" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "problem" TEXT NOT NULL,
  "hypothesis" TEXT NOT NULL,
  "stage" "ConceptStage" NOT NULL,
  "artifactType" "ConceptArtifactType" NOT NULL,
  "artifactUrl" TEXT NOT NULL,
  "artifactLabel" TEXT,
  "owner" TEXT,
  "decisionDate" TIMESTAMP(3),
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConceptRoadmapItem" (
  "id" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConceptRoadmapItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConceptRoadmapItem_conceptId_itemId_key" ON "ConceptRoadmapItem"("conceptId", "itemId");

ALTER TABLE "FeedbackEntry"
  ADD CONSTRAINT "FeedbackEntry_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "FeedbackTheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FeedbackRoadmapItem"
  ADD CONSTRAINT "FeedbackRoadmapItem_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeedbackRoadmapItem"
  ADD CONSTRAINT "FeedbackRoadmapItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConceptRoadmapItem"
  ADD CONSTRAINT "ConceptRoadmapItem_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConceptRoadmapItem"
  ADD CONSTRAINT "ConceptRoadmapItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
