# Supabase Setup Guide

## What You Need to Provide

To connect your Supabase database, I need:

1. **Database Connection String** (Connection Pooling or Direct)
2. **NEXTAUTH_SECRET** (I can generate this for you)

## Getting Your Supabase Connection String

### Option 1: Connection Pooling (Recommended for Serverless/Next.js)

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, select **Connection pooling** tab
4. Copy the connection string (it will look like):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Option 2: Direct Connection (Alternative)

1. Go to **Settings** → **Database**
2. Under **Connection string**, select **URI** tab
3. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

**Note:** For Next.js, the connection pooling option is recommended as it handles serverless environments better.

## Connection String Format

The connection string should include the `schema=public` parameter:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

Or for direct connection:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public
```

## What I'll Do Once You Provide the Details

1. ✅ Create/update `.env.local` with your Supabase connection string
2. ✅ Generate a secure `NEXTAUTH_SECRET`
3. ✅ Run Prisma migrations to create all tables in Supabase
4. ✅ Create your first admin user
5. ✅ Test the connection

## Security Note

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your database password secure
- The connection string contains your database password, so treat it as sensitive
