# Manual Migration Instructions

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

## Step 2: Run the Migration SQL

1. Open the file `migration.sql` in this project
2. Copy the entire contents of `migration.sql`
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

## Step 3: Verify Tables Were Created

After running the migration, you should see these tables created:
- `User`
- `Roadmap`
- `Section`
- `Item`
- `Quarter`
- `JiraLink`

You can verify by:
1. Going to **Table Editor** in Supabase
2. You should see all 6 tables listed

## Step 4: Update Prisma to Recognize the Migration

After running the SQL manually, we need to tell Prisma that the migration is complete:

```bash
# Mark the migration as applied (without running it)
npx prisma migrate resolve --applied init
```

Or create a migration record manually:

```bash
# This will create the migration history
npx prisma migrate dev --create-only --name init
# Then mark it as applied
npx prisma migrate resolve --applied init
```

## Step 5: Create Your First Admin User

After the tables are created, create your first admin user:

```bash
npm run create-admin your-email@example.com your-password
```

**Note:** Make sure your `.env.local` file has the pooler connection string for the application to use (not the direct connection).

## Troubleshooting

### If you get errors about tables already existing:
- The tables might already exist from a previous attempt
- You can drop all tables and recreate them, or
- Check what tables exist first in Supabase Table Editor

### If foreign key constraints fail:
- Make sure you run the entire SQL script in order
- The CREATE TABLE statements must run before the ALTER TABLE (foreign key) statements
