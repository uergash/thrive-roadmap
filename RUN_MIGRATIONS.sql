-- Run this in Supabase SQL Editor if roadmap page fails to load
-- Combines: migration_add_section_description + migration_risks_publish_changelog
-- Additional feedback sync/comments changes live in: migration_feedback_comments_ingestion.sql

-- Add description field to Section table
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add published to Roadmap
ALTER TABLE "Roadmap" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT false;

-- Add risk and blockerNotes to Item
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "risk" TEXT;
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "blockerNotes" TEXT;

-- Create RoadmapSnapshot table
CREATE TABLE IF NOT EXISTS "RoadmapSnapshot" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoadmapSnapshot_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "RoadmapSnapshot" DROP CONSTRAINT IF EXISTS "RoadmapSnapshot_roadmapId_fkey";
ALTER TABLE "RoadmapSnapshot" ADD CONSTRAINT "RoadmapSnapshot_roadmapId_fkey" 
    FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ItemDependency table
CREATE TABLE IF NOT EXISTS "ItemDependency" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemDependency_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ItemDependency" DROP CONSTRAINT IF EXISTS "ItemDependency_itemId_fkey";
ALTER TABLE "ItemDependency" ADD CONSTRAINT "ItemDependency_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemDependency" DROP CONSTRAINT IF EXISTS "ItemDependency_dependsOnId_fkey";
ALTER TABLE "ItemDependency" ADD CONSTRAINT "ItemDependency_dependsOnId_fkey" 
    FOREIGN KEY ("dependsOnId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ItemComment table
CREATE TABLE IF NOT EXISTS "ItemComment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemComment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ItemComment" DROP CONSTRAINT IF EXISTS "ItemComment_itemId_fkey";
ALTER TABLE "ItemComment" ADD CONSTRAINT "ItemComment_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ItemChangeLog table
CREATE TABLE IF NOT EXISTS "ItemChangeLog" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemChangeLog_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ItemChangeLog" DROP CONSTRAINT IF EXISTS "ItemChangeLog_itemId_fkey";
ALTER TABLE "ItemChangeLog" ADD CONSTRAINT "ItemChangeLog_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
