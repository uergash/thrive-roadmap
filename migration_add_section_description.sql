-- Add description field to Section table
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "description" TEXT;
