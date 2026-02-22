# Migration: Add Section Description

## Run this SQL in Supabase

Go to Supabase SQL Editor and run:

```sql
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "description" TEXT;
```

This adds the `description` field to the Section table to support section descriptions in the side panel.
