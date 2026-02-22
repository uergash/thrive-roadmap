# ✅ Supabase Setup Complete!

## What's Been Done

1. ✅ Database tables created in Supabase
2. ✅ Admin user created
3. ✅ Environment variables configured
4. ✅ Connection string set up (using pooler for Next.js app)

## Your Admin Credentials

- **Email:** `admin@thrive.com`
- **Password:** `admin123`

**⚠️ Important:** Change this password after first login!

## Next Steps

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open the Application

Navigate to: http://localhost:3000

### 3. Log In

- Use the email: `admin@thrive.com`
- Use the password: `admin123`

### 4. Create Additional Users (Optional)

Once logged in as admin:
1. Click "Users" in the header
2. Click "Add User" to create more users
3. Assign roles (VIEWER or ADMIN)

## Connection Details

- **Application uses:** Pooler connection (port 6543) - optimized for Next.js
- **Migrations use:** Direct connection (port 5432) - when needed

Both connection strings are configured in:
- `.env.local` - Pooler (for app)
- `.env` - Direct (for migrations, if needed)

## Troubleshooting

### If you can't log in:
- Verify the user exists in Supabase Table Editor
- Check that the password is correct
- Make sure `.env.local` has the correct DATABASE_URL

### If the app can't connect:
- Verify Supabase is running
- Check the connection string in `.env.local`
- Make sure the pooler connection is active

## Security Notes

1. **Change the default admin password** after first login
2. **Never commit** `.env.local` or `.env` to git (already in `.gitignore`)
3. **Rotate** `NEXTAUTH_SECRET` in production
4. **Use environment variables** for production deployment
