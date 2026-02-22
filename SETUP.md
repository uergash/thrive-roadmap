# Setup Instructions

## Step 1: Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/thrive_roadmap?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Important:**
- Replace `user`, `password`, `localhost`, `5432`, and `thrive_roadmap` with your actual PostgreSQL credentials
- Generate a secure secret key by running: `openssl rand -base64 32`
- Replace `your-secret-key-here` with the generated secret

## Step 2: Set Up Database

Make sure PostgreSQL is running and create the database:

```bash
# Connect to PostgreSQL and create database
psql -U postgres
CREATE DATABASE thrive_roadmap;
\q
```

## Step 3: Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all the database tables
- Set up the schema

## Step 4: Create Your First Admin User

```bash
npm run create-admin your-email@example.com your-password
```

Replace `your-email@example.com` and `your-password` with your desired credentials.

## Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 6: Log In

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Use the email and password you created in Step 4

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready` or check your PostgreSQL service
- Double-check your DATABASE_URL in `.env.local`
- Ensure the database exists: `psql -U postgres -l` (should list `thrive_roadmap`)

### Prisma Issues
- If migrations fail, try: `npx prisma migrate reset` (⚠️ This will delete all data)
- Regenerate Prisma client: `npx prisma generate`

### NextAuth Issues
- Ensure NEXTAUTH_SECRET is set and is a valid base64 string
- Check that NEXTAUTH_URL matches your actual URL

### Port Already in Use
- Change the port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

## Next Steps After Setup

1. Log in with your admin account
2. Navigate to the Users page to create additional users
3. Start creating sections and roadmap items
4. Link items to JIRA tickets as needed
