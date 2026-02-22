# Product Communication Architecture

## Objective
Increase organization trust in Product by making three things explicit:
1. What we are doing now (Roadmap)
2. Why we are doing it (Feedback evidence)
3. What we are exploring next (Concepts)

## Information Architecture

### Public navigation
- `/roadmap`: published roadmap by year
- `/feedback`: published recent feedback (last 60 days by default)
- `/concepts`: published concepts and prototype links

### Internal authoring and review flow
1. Product/admin curates `FeedbackEntry` records from Slack/interviews.
2. Product/admin links each feedback record to one or more roadmap `Item`s.
3. Product/admin creates `Concept` records with artifact links and stage.
4. Product/admin links concepts to roadmap `Item`s.
5. Product/admin toggles `published` on entries/concepts to push externally visible updates.

## Data model additions

### Feedback layer
- `FeedbackTheme`: stable thematic grouping (`name`, `description`, `order`)
- `FeedbackEntry`: normalized evidence record
  - fields: `title`, `summary`, `source`, `sourceRef`, `customerSegment`, `urgency (1-5)`, `receivedAt`, `published`
- `FeedbackRoadmapItem`: many-to-many join between feedback and roadmap items

### Concepts layer
- `Concept`: future-facing concept/prototype record
  - fields: `title`, `problem`, `hypothesis`, `stage`, `artifactType`, `artifactUrl`, `owner`, `decisionDate`, `published`
- `ConceptRoadmapItem`: many-to-many join between concept and roadmap items

### Existing model linkage
- `Item` now includes:
  - `feedbackLinks FeedbackRoadmapItem[]`
  - `conceptLinks ConceptRoadmapItem[]`

## API contracts

### Public
- `GET /api/feedback/public?days=60`
  - returns published feedback within date window, includes theme + roadmap links
- `GET /api/concepts/public`
  - returns published concepts with roadmap links

### Internal
- `GET /api/feedback`
  - authenticated; admins see all, viewers see published
- `POST /api/feedback`
  - admin only; create feedback and roadmap links
- `GET /api/concepts`
  - authenticated; admins see all, viewers see published
- `POST /api/concepts`
  - admin only; create concept and roadmap links

## Communication rules
- Every roadmap initiative should map to at least one evidence item.
- Every concept should state the problem and expected decision date.
- Public pages should update weekly (SLA), with clear recency windows.

## Rollout plan
1. Run `migration_feedback_concepts.sql`.
2. Seed initial themes (for example: Onboarding, Reporting, Performance, Workflow automation).
3. Import first 30-50 feedback records from recent Slack/interviews.
4. Publish top 5-10 active concepts with prototype links.
5. Socialize one canonical public link set:
   - `/roadmap`, `/feedback`, `/concepts`
