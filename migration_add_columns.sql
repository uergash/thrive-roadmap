-- Add Column model for dynamic roadmap columns
CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quarter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- Add columnId to Quarter table (nullable for backward compatibility)
ALTER TABLE "Quarter" ADD COLUMN IF NOT EXISTS "columnId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Column" ADD CONSTRAINT "Column_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default columns for existing roadmaps (Q1-Q4)
-- Note: This will need to be run per roadmap, or you can create them via the app
