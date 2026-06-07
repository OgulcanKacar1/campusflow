# Phase 4 Execution Plan — Sprint & Kanban Management

> **Goal:** Deliver a production-ready sprint planning and kanban workflow for CampusFlow teams, with clear permissions, typed APIs, and regression coverage.

---

## 1. Objectives & Success Metrics

- [ ] Instructor can create/manage sprints (manual + template) and view a kanban board for any team.
- [ ] Students can manage their own team’s kanban when `sprint_mode = 'team'`; otherwise read-only.
- [ ] Drag-and-drop task movement updates status, sprint, and ordering without page reload.
- [ ] RLS policies guarantee that users only access data belonging to their organization/team.
- [ ] `npm run lint` & migration rollback/forward pass without errors; manual QA checklist is green.

### Dependencies
- [ ] Phase 3 RLS hardening completed (`teams`, `team_members`, `sprints`, `tasks`).
- [ ] Feature flag infrastructure ready (optional but recommended).

---

## 2. Timeline & Workstream Owners

| Week | Focus | Key Deliverables |
| --- | --- | --- |
| 1 | Database & RLS foundation | Migrations for `sprints`, `task_members`, new columns; base server actions |
| 2 | Sprint creation UX | Instructor sprint list, manual form, template generator |
| 3 | Kanban core | Drag-drop infrastructure, task CRUD, member management |
| 4 | Student board & QA | Student UI, permissions polish, regression suite, release prep |

> Use this table as the baseline; if scope shifts, note changes in this file.

---

## 3. Database & RLS Checklist

### 3.1 Schema
- [ ] `courses` table: add `sprint_mode`, `sprint_start`, `sprint_end` columns.
- [ ] `tasks` table: add `position` (INT) and `priority` (enum TEXT) columns.
- [ ] Create `sprints` table (id/team_id/name/start_at/end_at/status/position timestamps).
- [ ] Create `task_members` table for many-to-many assignments.

### 3.2 RLS Policies
- [ ] `sprints` SELECT/INSERT/UPDATE/DELETE → allow instructors + team members only.
- [ ] `task_members` SELECT → team members & instructors/admin; INSERT/DELETE → team leader, instructors/admin.
- [ ] Update `tasks` policies to respect new `position`/`priority` columns.
- [ ] Add helper RPCs (if needed) under SECURITY DEFINER for aggregated views (`get_team_kanban`).

### 3.3 Migration Hygiene
- [ ] Write forward migration (`0040_phase4_sprints.sql`).
- [ ] Write down migration rollback script (drop new tables/columns) for safety.
- [ ] Apply migrations on staging; verify with sample data.
- [ ] Document schema changes in PLAN.md and README (DB section).

---

## 4. Backend / Server Actions

### 4.1 Sprint Actions (`src/app/dashboard/shared/teamActions.ts`)
- [ ] `getTeamSprints(teamId)` (with aggregated task counts).
- [ ] `createSprint(teamId, payload)` (manual form).
- [ ] `createSprintsFromTemplate(teamId, template, { startAt, endAt })`.
- [ ] `updateSprint(sprintId, payload)` (name, dates, status).
- [ ] `reorderSprints(teamId, orderedIds[])`.
- [ ] `deleteSprint(sprintId)`.

### 4.2 Task Actions (`teamTasks.ts` or shared module)
- [ ] `getTeamTasks(teamId, filters)` (optional `sprintId`, `status`).
- [ ] `createTask(teamId, payload)`.
- [ ] `updateTask(taskId, payload)`.
- [ ] `moveTask(taskId, { targetStatus, targetSprintId, position })`.
- [ ] `setTaskMembers(taskId, memberIds[])`.
- [ ] `deleteTask(taskId)`.
- [ ] Ensure responses are typed with shared DTOs.

### 4.3 Error & Optimistic Handling
- [ ] Define reusable error formatter for kanban actions.
- [ ] Decide where optimistic updates are acceptable; add rollback logic if API fails.
- [ ] Surface success/error toasts (shared util) for each mutation.

---

## 5. Frontend Deliverables

### 5.1 Instructor Sprint Console (`/dashboard/instructor/courses/[courseId]/teams/[teamId]`)
- [ ] Sprint list component (accordion) with status badges & counts.
- [ ] Sprint creation dialog (manual form).
- [ ] Template modal (dropdown + timeline preview).
- [ ] Sprint reorder (drag handle or buttons).
- [ ] Kanban board skeleton (columns, cards, placeholders).
- [ ] Task detail drawer/modal (markdown editor, assignee, multi-select members).
- [ ] Global toasts for actions.

### 5.2 Student Kanban (`/dashboard/student/courses/[courseId]/team`)
- [ ] Reuse instructor kanban component with restricted perms.
- [ ] Handling for `sprint_mode = 'instructor'` (read-only banner).
- [ ] Sprint creation only if `sprint_mode = 'team'` and user is team member.
- [ ] Access guard (non-team members redirected/blocked).

### 5.3 UI/UX Notes
- [ ] Confirm drag-drop library (dnd-kit recommended for Next.js 16).
- [ ] Ensure columns and cards are keyboard accessible.
- [ ] Provide skeleton/loading states for board and forms.
- [ ] Dark theme alignment with existing palette (#060b18 background).

---

## 6. Testing & QA

### 6.1 Automated
- [ ] Unit tests for server actions (happy path + permission denied).
- [ ] Migration smoke tests (if using script in CI).
- [ ] Optional: component tests for kanban board interactions (Playwright/Cypress).

### 6.2 Manual Regression Checklist
- [ ] Instructor creates sprint (manual + template) → appears in list with correct dates.
- [ ] Task drag-drop updates status/sprint/position; board refresh reflects order.
- [ ] Student in same team sees updates in real time (after refresh) and can edit when allowed.
- [ ] Student from different organization cannot access kanban URLs (403/redirect).
- [ ] RLS: direct Supabase query attempts from other org fail.
- [ ] Delete sprint → associated tasks become backlog or handled gracefully.
- [ ] Feature flag off → UI elements hidden, server actions blocked with proper error.

### 6.3 Release Checklist
- [ ] Toggle feature flag ON in staging, run manual checklist.
- [ ] Update PLAN.md + docs with final status.
- [ ] Announce release notes to stakeholders (Slack/email).
- [ ] Monitor Supabase logs for policy violations or slow queries.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| RLS misconfiguration exposes other org sprint/task data | Double-check policies on staging; run manual Supabase queries; keep feature flag off until verified. |
| Drag-drop library issues with Next.js 16 SSR | Test early with sample data; fall back to CSS reorder handles if needed. |
| Scope creep (e.g., realtime updates) | Treat realtime as stretch goal; deliver optimistic UI first. |
| Markdown/XSS vulnerabilities in task descriptions | Use existing sanitized markdown component; encode user input; add tests. |

---

## 8. Documentation & Rollout

- [ ] Update `PLAN.md` (done) and keep this `docs/phase4-plan.md` synced.
- [ ] Create instructor & student user guides (Confluence/Notion or `docs/` folder).
- [ ] Record short Loom walkthrough once MVP is ready.
- [ ] Schedule release window with stakeholders; ensure support team informed.

> Keep this file as the living document for Phase 4. After each week, tick completed items and add notes if scope changes.
