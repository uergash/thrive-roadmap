# Feedback Sync Setup

This app can sync feedback from Notion and Slack weekly via `POST /api/feedback/sync`.

## 1) Required environment variables

Set these in your app environment:

- `FEEDBACK_SYNC_TOKEN` - secret token required by sync endpoint.
- `NOTION_API_KEY` - Notion integration token.
- `NOTION_FEEDBACK_DATABASE_ID` - Notion database ID for feedback source records.
- `SLACK_BOT_TOKEN` - Slack bot token with access to source channels.
- `SLACK_FEEDBACK_CHANNEL_IDS` - comma-separated Slack channel IDs.

## 2) Run DB migration

Execute `migration_feedback_comments_ingestion.sql` in Supabase SQL Editor.

This adds:

- feedback comments table,
- ingestion metadata columns on feedback entries,
- dedupe index for external source records.

## 3) Configure weekly scheduler (GitHub Actions)

The workflow is at:

- `.github/workflows/weekly-feedback-sync.yml`

Set GitHub repository secrets:

- `APP_BASE_URL` (for example, `https://your-app.example.com`)
- `FEEDBACK_SYNC_TOKEN` (must match app env var)

By default it runs every Monday at 14:00 UTC and can be manually triggered from Actions.

## 4) Manual verification

1. Trigger the workflow manually (`workflow_dispatch`) or call endpoint directly:
   - `POST /api/feedback/sync`
   - header: `x-feedback-sync-token: <token>`
2. Confirm response includes counts:
   - `created`
   - `updated`
   - `skipped`
   - `errors`
3. Open `/feedback` and verify imported records appear.

## 5) Safety notes

- Sync upserts by `(externalSource, externalId)` to avoid duplicates.
- Manual roadmap links, votes, and comments are preserved when sync updates existing rows.
