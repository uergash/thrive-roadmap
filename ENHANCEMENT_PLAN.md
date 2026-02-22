# Enhancement Plan

## Current Status ✅

**Already Implemented:**
1. ✅ Sign-in page with credentials
2. ✅ User management page (create, add, remove users)
3. ✅ Two user roles: VIEWER (read-only) and ADMIN (full access)
4. ✅ Roadmap timeline view with quarters
5. ✅ Section and item creation/editing

## Enhancements Needed

### 1. Inline Add Buttons (Priority: High)
**Current:** Add buttons are above sections
**Change:** Move add buttons inline within the table

- **Section add button:** Should appear as a row in the table (after the last section or at the bottom)
- **Item add button:** Should appear below each section's items, inline in the table
- Remove the "Add Section" button from the header
- Remove the "Add Item" button from section headers

### 2. Side Panels for Details (Priority: High)
**Current:** Items use a modal dialog for editing
**Change:** Add side panels for viewing/editing details

**Section Side Panel:**
- Trigger: Click on section name
- Content:
  - Section name (editable for admin)
  - Description (new field - need to add to schema)
  - List of items in this section (clickable to open item panel)
  - Edit/Delete actions (admin only)

**Item Side Panel:**
- Trigger: Click on item name/link
- Content:
  - Name (editable)
  - Description
  - Status (editable dropdown)
  - Quarters (editable checkboxes)
  - JIRA links (add/remove)
  - Save/Cancel buttons

**Implementation:**
- Create `SidePanel` component using Radix UI Sheet or similar
- Replace modal dialogs with side panels
- Add click handlers to section/item names

### 3. Status Column in Roadmap View (Priority: High)
**Current:** Status is shown in item row but not as a dedicated column
**Change:** Add status column after "Feature/Initiative" column

**Layout:**
```
| Feature/Initiative | Status | Q1 | Q2 | Q3 | Q4 |
```

**Status Options (Update):**
- Discovery
- Design
- Planning
- Development
- Released

**Implementation:**
- Update `STATUS_OPTIONS` in `ItemEditor.tsx`
- Add status column to `TimelineView.tsx` grid
- Display status badge in `RoadmapItem.tsx`
- Make status editable inline or via side panel

### 4. Section Description Field (Priority: Medium)
**Current:** Sections only have a name
**Change:** Add description field to Section model

**Database Changes:**
- Add `description` field to `Section` model in Prisma schema
- Create migration to add column
- Update API routes to handle description

## Implementation Order

1. **Update Status Options** - Quick win, update constants
2. **Add Status Column** - Update view layout
3. **Create Side Panel Component** - Reusable component
4. **Implement Item Side Panel** - Replace modal with side panel
5. **Add Section Description** - Database + UI changes
6. **Implement Section Side Panel** - Full section details
7. **Move Add Buttons Inline** - Restructure UI layout

## Files to Modify

### Components
- `components/roadmap/TimelineView.tsx` - Add status column, restructure layout
- `components/roadmap/Section.tsx` - Inline add button, clickable name
- `components/roadmap/RoadmapItem.tsx` - Status column, clickable name
- `components/roadmap/ItemEditor.tsx` - Update status options
- `components/roadmap/SidePanel.tsx` - **NEW** - Side panel component
- `components/roadmap/SectionPanel.tsx` - **NEW** - Section details panel
- `components/roadmap/ItemPanel.tsx` - **NEW** - Item details panel (or merge with ItemEditor)

### Database
- `prisma/schema.prisma` - Add description to Section
- Create migration for Section.description

### API
- `app/api/roadmap/sections/route.ts` - Handle description field

### Types
- `types/roadmap.ts` - Add description to Section interface
