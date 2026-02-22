# Thrive Roadmap

A web-based product roadmap application that allows teams to create, manage, and visualize product initiatives organized by quarters.

## Features

- **Quarter-based Timeline View**: Visualize roadmap items across Q1-Q4
- **Section Grouping**: Organize items into sections (e.g., initiatives)
- **JIRA Integration**: Link roadmap items to JIRA tickets/epics
- **Public Feedback View**: Show recent customer/team feedback signals and roadmap linkage
- **Public Concepts View**: Share future concepts, mockups, and clickable prototypes
- **Role-based Access Control**: 
  - **Viewer**: Read-only access to roadmaps
  - **Admin**: Full CRUD access + user management
- **User Management**: Create and manage user accounts (admin only)

## Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (email/password)
- **UI Framework**: Tailwind CSS + shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/thrive_roadmap?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Optional: Feedback source sync
FEEDBACK_SYNC_TOKEN="your-sync-token"
NOTION_API_KEY=""
NOTION_FEEDBACK_DATABASE_ID=""
SLACK_BOT_TOKEN=""
SLACK_FEEDBACK_CHANNEL_IDS=""
```

Generate a secret key:
```bash
openssl rand -base64 32
```

3. Set up the database:

```bash
npx prisma migrate dev --name init
```

4. Create your first admin user:

Run the create-admin script:

```bash
npm run create-admin your-email@example.com your-password
```

Or create manually via Prisma Studio:

```bash
npx prisma studio
```

Then create a user with:
- Email: your email
- Password: (hashed with bcrypt - use an online bcrypt generator or the script above)
- Role: ADMIN

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Your First Roadmap

1. Log in with your admin account
2. Navigate to the roadmap page
3. Click "Add Section" to create a new section (e.g., "True - Recruiter Productivity")
4. Click "Add Item" within a section to add roadmap items
5. Click the edit icon on any item to:
   - Edit name and description
   - Set status
   - Assign quarters (Q1-Q4)
   - Link JIRA tickets

### Managing Users (Admin Only)

1. Click "Users" in the header
2. Click "Add User" to create new users
3. Set their role (VIEWER or ADMIN)
4. Users can be deleted (except your own account)

### Public Communication Views

- `/roadmap` - roadmap view (public), edit controls when logged in
- `/feedback` - feedback digest (public), curation + publish controls when logged in
- `/concepts` - concept gallery (public), concept editing + publish controls when logged in

### Weekly Feedback Sync

- Feedback from Notion and Slack can be synced through `POST /api/feedback/sync`.
- Configure environment variables listed above and set up the scheduled workflow.
- Detailed setup: `docs/FEEDBACK_SYNC_SETUP.md`.

### Edit Views (Login Required)

- Editing is embedded directly on `/roadmap`, `/feedback`, and `/concepts` for authenticated users.

## Project Structure

```
├── app/
│   ├── (auth)/          # Authentication routes
│   ├── (protected)/     # Protected routes (require auth)
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   └── roadmap/         # Roadmap-specific components
├── lib/                 # Utility functions
├── prisma/              # Database schema
└── types/               # TypeScript type definitions
```

## Database Schema

- **User**: User accounts with email, password (hashed), and role
- **Roadmap**: Roadmap instances for a given year
- **Section**: Grouping mechanism for initiatives
- **Item**: Individual roadmap items
- **Quarter**: Quarter assignments for items
- **JiraLink**: JIRA ticket/epic links

## Development

```bash
# Run development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## License

Private project
