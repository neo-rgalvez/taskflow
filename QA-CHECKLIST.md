# TaskFlow — QA Test Plan & Checklist

> Comprehensive test plan covering every page, flow, and edge case defined in [APPLICATION-PLAN.md](./APPLICATION-PLAN.md).
> Each checkbox is a discrete test case. A passing build means every box is checked.

---

## Table of Contents

1. [Public Pages](#1-public-pages)
2. [Authenticated Pages — Core Navigation](#2-authenticated-pages--core-navigation)
3. [Authenticated Pages — Clients](#3-authenticated-pages--clients)
4. [Authenticated Pages — Projects](#4-authenticated-pages--projects)
5. [Authenticated Pages — Tasks](#5-authenticated-pages--tasks)
6. [Authenticated Pages — Time Tracking](#6-authenticated-pages--time-tracking)
7. [Authenticated Pages — Invoicing](#7-authenticated-pages--invoicing)
8. [Authenticated Pages — Calendar & Scheduling](#8-authenticated-pages--calendar--scheduling)
9. [Authenticated Pages — Settings](#9-authenticated-pages--settings)
10. [Authenticated Pages — Search](#10-authenticated-pages--search)
11. [Global Components](#11-global-components)
12. [Cross-Page Flows](#12-cross-page-flows)
13. [Security Tests](#13-security-tests)
14. [Destructive Actions & Cascade Tests](#14-destructive-actions--cascade-tests)
15. [Performance Tests](#15-performance-tests)
16. [Accessibility Tests](#16-accessibility-tests)
17. [Cross-Browser & Device Tests](#17-cross-browser--device-tests)

---

## 1. Public Pages

### 1.1 Landing Page — `/`

**PREREQUISITES:** Unauthenticated user.

**Happy Path:**
- [ ] Page loads with marketing content: value proposition, feature highlights, pricing, CTA
- [ ] "Sign Up" CTA navigates to `/signup`
- [ ] "Log In" link navigates to `/login`
- [ ] Pricing section renders all plan tiers with correct labels and prices
- [ ] All pricing "Get Started" / CTA buttons navigate to `/signup`

**Security:**
- [ ] Page is accessible without authentication
- [ ] Authenticated user visiting `/` is redirected to `/dashboard` (or sees navigation to dashboard)
- [ ] No sensitive data or API tokens are exposed in page source or network requests

**Mobile:**
- [ ] Layout is responsive — hero, features, and pricing stack vertically on mobile
- [ ] Navigation is usable on 320px viewport width
- [ ] CTA buttons are tap-friendly (min 44×44px touch target)

**Edge Cases:**
- [ ] Page loads correctly with JavaScript disabled (SSR/static HTML is readable)
- [ ] All links use proper `<a>` or `<Link>` tags (no JavaScript-only navigation)

---

### 1.2 Sign Up — `/signup`

**PREREQUISITES:** Unauthenticated user.

**Happy Path:**
- [ ] Form renders with fields: name, email, password
- [ ] Submitting valid data creates an account
- [ ] User is shown a success message / email verification prompt
- [ ] User can navigate to dashboard after successful signup

**Validation:**
- [ ] Empty name → "Name is required" or equivalent inline error
- [ ] Empty email → "Email is required" inline error
- [ ] Invalid email format (e.g., `foo`, `foo@`, `@bar.com`) → "Please enter a valid email address"
- [ ] Empty password → "Password is required" inline error
- [ ] Password < 8 characters → error about minimum length
- [ ] Password without uppercase letter → error about password requirements
- [ ] Password without lowercase letter → error about password requirements
- [ ] Password without number → error about password requirements
- [ ] Duplicate email (already registered) → "An account with this email already exists"
- [ ] Name > 200 characters → appropriate truncation or error
- [ ] Email with leading/trailing spaces → trimmed before validation

**Empty State:**
- [ ] Form loads with empty fields and no pre-filled error messages

**Error State:**
- [ ] Network failure during submission → "Something went wrong. Please try again."
- [ ] Server 500 error → user-friendly error message, not a stack trace

**Loading State:**
- [ ] Submit button shows loading indicator during submission
- [ ] Form cannot be double-submitted (button disabled or debounced)

**Security:**
- [ ] Password field is type="password" (masked input)
- [ ] Form submission is CSRF-protected
- [ ] Rate limit: max 3 signups per hour per IP (429 response after exceeded)
- [ ] Password is never logged or echoed back in API responses
- [ ] SQL injection attempt in email field (e.g., `'; DROP TABLE users;--`) → rejected cleanly

**Mobile:**
- [ ] Form is usable on 320px viewport
- [ ] Virtual keyboard does not obscure submit button
- [ ] Appropriate input types used (type="email", type="password")

**Edge Cases:**
- [ ] Unicode characters in name field (e.g., "José", "田中太郎", "🙂") → accepted and stored correctly
- [ ] Email with valid but unusual format (e.g., `user+tag@example.com`) → accepted
- [ ] Back button after successful signup → does not re-submit form
- [ ] Pasting content into fields → validation runs correctly

---

### 1.3 Log In — `/login`

**PREREQUISITES:** User with an existing account.

**Happy Path:**
- [ ] Form renders with fields: email, password
- [ ] Submitting valid credentials logs the user in
- [ ] User is redirected to `/dashboard` (or the return URL if preserved)
- [ ] Session cookie is set (secure, HTTP-only, SameSite=Strict)
- [ ] "Forgot password" link navigates to `/forgot-password`

**Validation:**
- [ ] Empty email → inline error
- [ ] Empty password → inline error
- [ ] Invalid email format → inline error
- [ ] Incorrect email or password → "Invalid email or password" (generic, no user enumeration)

**Empty State:**
- [ ] Form loads with empty fields

**Error State:**
- [ ] Network failure → user-friendly error message
- [ ] Server error → user-friendly error message

**Loading State:**
- [ ] Submit button shows loading indicator
- [ ] Form cannot be double-submitted

**Security:**
- [ ] Rate limit: max 5 login attempts per 15 minutes per IP (429 after exceeded)
- [ ] Error messages do not reveal whether email exists ("Invalid email or password" for both)
- [ ] Session is correctly established with server-side storage
- [ ] Old sessions are invalidated after password change (tested in settings)
- [ ] CSRF protection on form submission

**Mobile:**
- [ ] Form is usable on 320px viewport
- [ ] Input types correct (type="email", type="password")

**Edge Cases:**
- [ ] Login with email in different case (e.g., `USER@Example.COM`) → case-insensitive match
- [ ] Extremely long email (>320 chars) → rejected gracefully
- [ ] Authenticated user visiting `/login` → redirected to `/dashboard`
- [ ] Login preserves return URL (e.g., user was at `/projects/123`, session expired, after re-login → back to `/projects/123`)

---

### 1.4 Forgot Password — `/forgot-password`

**PREREQUISITES:** Unauthenticated user.

**Happy Path:**
- [ ] Form renders with email input
- [ ] Submitting a registered email → success message "Check your inbox"
- [ ] Reset email is sent with a valid, time-limited token link

**Validation:**
- [ ] Empty email → inline error
- [ ] Invalid email format → inline error

**Security:**
- [ ] Submitting an unregistered email → same success message (no user enumeration)
- [ ] Rate limit: max 3 attempts per hour per email
- [ ] Reset token is single-use
- [ ] Reset token expires after 1 hour
- [ ] Token is cryptographically random (not sequential or guessable)

**Mobile:**
- [ ] Form is usable on mobile

**Edge Cases:**
- [ ] Requesting multiple resets → only the latest token is valid
- [ ] Email with leading/trailing spaces → trimmed

---

### 1.5 Reset Password — `/reset-password/:token`

**PREREQUISITES:** Valid password reset token from email.

**Happy Path:**
- [ ] Page loads with new password form
- [ ] Submitting a valid new password → password updated, user redirected to login
- [ ] Old password no longer works after reset
- [ ] All other sessions are invalidated after password change

**Validation:**
- [ ] Password < 8 characters → error
- [ ] Password missing uppercase/lowercase/number → error
- [ ] Confirm password mismatch → error

**Error State:**
- [ ] Expired token → "This reset link has expired. Please request a new one." with link to `/forgot-password`
- [ ] Already-used token → "This reset link has already been used."
- [ ] Malformed/invalid token → "Invalid reset link."

**Security:**
- [ ] Token in URL cannot be reused after successful reset
- [ ] Brute-forcing tokens is impractical (cryptographic randomness)
- [ ] Page does not reveal whether the token was ever valid vs. never existed

**Mobile:**
- [ ] Form is usable on mobile

---

### 1.6 Client Portal — `/portal/:token`

**PREREQUISITES:** Valid portal token generated from a project.

**Happy Path:**
- [ ] Page loads without login — token-based access
- [ ] Shows project name and description
- [ ] Shows task status summary (progress bar: X of Y complete)
- [ ] Shows milestone status for fixed-price projects
- [ ] File upload area appears if enabled by freelancer

**Empty State:**
- [ ] Project with no tasks → "No tasks yet" message
- [ ] Project with no milestones → milestone section hidden

**Error State:**
- [ ] Invalid/revoked token → "This link is no longer valid" error page
- [ ] Expired or deleted project → appropriate error message

**Security:**
- [ ] Portal is strictly read-only — no ability to edit tasks, change statuses, or view financials
- [ ] File upload (if enabled) goes to a sandboxed area, not the main project storage
- [ ] Token cannot be used to access other projects or user data
- [ ] No authentication cookies are set or required
- [ ] API calls from portal do not expose internal IDs or sensitive data

**Mobile:**
- [ ] Portal page is responsive and readable on mobile

**Edge Cases:**
- [ ] Token with special characters in URL → handled correctly
- [ ] Concurrent access by multiple people using same token → no issues

---

## 2. Authenticated Pages — Core Navigation

### 2.1 Dashboard — `/dashboard`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Dashboard loads with overview widgets: active projects count, upcoming deadlines (7 days), hours this week, outstanding invoice total
- [ ] Recent activity feed shows latest actions
- [ ] Clicking "Active Projects" card navigates to `/projects`
- [ ] Clicking "Hours This Week" card navigates to `/time`
- [ ] Clicking "Outstanding Invoices" card navigates to `/invoices`
- [ ] Clicking "Upcoming Deadlines" card navigates to `/calendar`
- [ ] Start timer from recent task → timer begins

**Empty State (new user):**
- [ ] Shows welcome/onboarding prompt: "Add your first client →" linking to `/clients` or client creation
- [ ] Shows prompt: "Set up your business profile →" linking to `/settings/business`
- [ ] Stats cards show zero values (not broken UI)

**Error State:**
- [ ] API failure loading dashboard data → error message with retry option
- [ ] Partial failure (e.g., time data loads but invoices fail) → failed section shows error, rest loads normally

**Loading State:**
- [ ] Skeleton loaders appear for each card/widget while data loads

**Security:**
- [ ] Unauthenticated request → redirected to `/login`
- [ ] Dashboard only shows the authenticated user's data
- [ ] No other user's data visible via any widget

**Mobile:**
- [ ] Cards stack vertically on mobile
- [ ] All interactive elements are tap-friendly

**Edge Cases:**
- [ ] User with 100+ projects → active projects count is correct
- [ ] User with no time entries this week → "0h" or appropriate label
- [ ] User with overdue invoices → outstanding total is correct and highlighted

---

### 2.2 Today View — `/today`

**PREREQUISITES:** Authenticated user, ideally with tasks due today and overdue tasks.

**Happy Path:**
- [ ] Shows tasks due today across all projects, grouped by client/project
- [ ] Overdue tasks are highlighted (visually distinct)
- [ ] Check off a task → task marked as done, removed from today view (or shown as completed)
- [ ] Start timer on a task → active timer begins, timer bar appears
- [ ] Reschedule a task to tomorrow → task moves to tomorrow's date
- [ ] Active timer (if running) is visible

**Empty State:**
- [ ] No tasks due today → "Nothing scheduled for today" with CTA to view all tasks or projects

**Loading State:**
- [ ] Skeleton loaders for task list

**Security:**
- [ ] Only the authenticated user's tasks appear

**Mobile:**
- [ ] Task list is scrollable and usable on mobile
- [ ] Check-off and timer buttons are tap-friendly

**Edge Cases:**
- [ ] Task due today in a different timezone than user's timezone → correct based on user's timezone setting
- [ ] 50+ tasks due today → all render, list is scrollable
- [ ] Task with very long title → truncated with ellipsis, full title visible on expand/hover

---

## 3. Authenticated Pages — Clients

### 3.1 Client List — `/clients`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows all clients in card or table layout
- [ ] Each client shows: name, active project count, total outstanding invoices, status (active/archived)
- [ ] "Add Client" button opens client creation form/modal
- [ ] Search by client name → filters list in real-time
- [ ] Filter by status (active/archived) → correct filtering
- [ ] Clicking a client row/card navigates to `/clients/:id`

**Empty State:**
- [ ] No clients → "No clients yet. Add your first client." with CTA button

**Loading State:**
- [ ] Skeleton loaders for client list while loading

**Security:**
- [ ] Only the authenticated user's clients appear
- [ ] Cannot access by manipulating user_id in requests

**Mobile:**
- [ ] Client list switches to card layout or stacked rows on mobile
- [ ] Search and filter controls are usable on mobile

**Edge Cases:**
- [ ] 100+ clients → pagination or virtual scrolling works
- [ ] Client with very long name → truncated appropriately
- [ ] Special characters in client name (e.g., `O'Brien & Co.`, `Müller GmbH`) → displayed correctly
- [ ] Search with no results → "No clients match your search"
- [ ] Archived clients are hidden by default, shown with filter toggle

---

### 3.2 Client Detail — `/clients/:id`

**PREREQUISITES:** Authenticated user, existing client.

**Happy Path:**
- [ ] Shows full client profile: contact info (name, email, phone, address), notes, default hourly rate, default payment terms
- [ ] Tabs: Projects, Invoices, Activity (or equivalent sections)
- [ ] Projects tab shows all projects for this client with status badges
- [ ] Invoices tab shows all invoices for this client
- [ ] Activity tab shows recent activity for this client
- [ ] "Edit Client" button opens edit form with pre-filled values
- [ ] Editing and saving → values update immediately
- [ ] "Add Project" button → creates project pre-linked to this client
- [ ] "Archive Client" button → client status changes, moved to archived

**Validation (Edit):**
- [ ] Client name cleared → "Client name is required"
- [ ] Email changed to invalid format → "Please enter a valid email address"
- [ ] Hourly rate set to negative → "Hourly rate must be a positive number"
- [ ] Payment terms set to 0 or negative → "Payment terms must be a positive number of days"

**Empty State:**
- [ ] Client with no projects → "No projects" with CTA to create one
- [ ] Client with no invoices → "No invoices" message
- [ ] Client with no activity → "No recent activity"

**Error State:**
- [ ] Client ID doesn't exist → 404 page with link to dashboard
- [ ] Client belongs to another user → 403 redirect to dashboard

**Loading State:**
- [ ] Skeleton loaders for client header and tab content

**Security:**
- [ ] Cannot access another user's client by changing the `:id` in the URL
- [ ] Edit/delete operations validate ownership server-side

**Mobile:**
- [ ] Tabs may convert to a dropdown or accordion on mobile
- [ ] Contact info is readable on small screens

**Edge Cases:**
- [ ] Client with 50+ projects → all render in projects tab
- [ ] Client with unicode characters in all fields → renders correctly
- [ ] Back navigation from client detail → returns to client list
- [ ] Editing client while another tab is open on same client → no data corruption

---

### 3.3 Client Creation (Modal/Form)

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Form shows fields: name (required), contact name, email, phone, address, notes, default hourly rate, default payment terms
- [ ] Submitting with valid data → client created, redirected to client detail or client list
- [ ] New client appears in client list immediately

**Validation:**
- [ ] Name empty → "Client name is required"
- [ ] Name > 200 characters → "Client name is too long"
- [ ] Email invalid format → "Please enter a valid email address"
- [ ] Hourly rate negative → "Hourly rate must be a positive number"
- [ ] Payment terms non-positive → "Payment terms must be a positive number of days"

**Edge Cases:**
- [ ] Creating two clients with the same name → allowed (names are not unique)
- [ ] Closing form mid-edit without saving → data is discarded (or confirmation prompt)
- [ ] Very long notes field (10,000+ chars) → saved correctly

---

## 4. Authenticated Pages — Projects

### 4.1 Project List — `/projects`

**PREREQUISITES:** Authenticated user, at least one client.

**Happy Path:**
- [ ] Shows all projects across all clients
- [ ] Each project shows: name, client name, status badge, deadline, budget progress bar
- [ ] Filter by client → shows only that client's projects
- [ ] Filter by status (active/on hold/completed/cancelled) → correct filtering
- [ ] Search by project name → filters list
- [ ] "Create Project" button → opens project creation flow
- [ ] Clicking a project → navigates to `/projects/:id`

**Empty State:**
- [ ] No projects → "No projects yet" with CTA to create first project

**Loading State:**
- [ ] Skeleton loaders for project cards

**Security:**
- [ ] Only the authenticated user's projects appear

**Mobile:**
- [ ] Projects display in stacked cards on mobile
- [ ] Filters accessible via dropdown or collapsible panel

**Edge Cases:**
- [ ] 100+ projects → pagination or virtual scroll
- [ ] Project with deadline today → highlighted appropriately
- [ ] Project at 100% budget → progress bar red, alert visible
- [ ] Multiple filters applied simultaneously → combined correctly (AND logic)

---

### 4.2 Project Detail — Overview — `/projects/:id`

**PREREQUISITES:** Authenticated user, existing project.

**Happy Path:**
- [ ] Shows project summary: description, deadline, billing type, hourly rate or fixed price, budget (estimated vs actual), attached files, milestone list (for fixed-price)
- [ ] "Edit Project" button → opens edit form
- [ ] Can change project status (Active → On Hold, Active → Completed, etc.)
- [ ] Budget progress bar shows hours tracked / budget hours
- [ ] Milestone list (fixed-price projects) shows name, amount, due date, status
- [ ] File attachments section shows uploaded files with download links

**Validation (Edit):**
- [ ] Project name cleared → "Project name is required"
- [ ] Billing type changed from hourly to fixed-price → prompts for fixed price, hides hourly rate
- [ ] Hourly rate cleared for hourly project → "Hourly rate is required for hourly projects"
- [ ] Fixed price cleared for fixed-price project → "Total price is required for fixed-price projects"
- [ ] Deadline set to past date (on new project) → "Deadline must be a future date"
- [ ] Budget hours set to negative → "Budget hours must be a positive number"

**Error State:**
- [ ] Project ID doesn't exist → 404
- [ ] Project belongs to another user → 403

**Security:**
- [ ] Cannot access another user's project via URL manipulation
- [ ] Portal token is visible here but only to the project owner

**Edge Cases:**
- [ ] Project at exactly 80% budget → budget alert threshold triggered
- [ ] Project over budget → progress bar overflows or shows >100%
- [ ] Changing status to Completed with non-done tasks → warning displayed
- [ ] Changing status to On Hold → running timers stopped

---

### 4.3 Project Detail — Board View — `/projects/:id/board`

**PREREQUISITES:** Authenticated user, project with tasks.

**Happy Path:**
- [ ] Kanban board renders with columns: To Do, In Progress, Waiting on Client, Review, Done
- [ ] Each column shows task count
- [ ] Task cards display: title, due date, priority badge, subtask progress
- [ ] Drag task between columns → status updates, card moves to target column
- [ ] Click "Add Task" → new task form
- [ ] Click a task card → task detail panel/modal opens

**Empty State:**
- [ ] Project with no tasks → "No tasks yet. Add your first task →" with CTA
- [ ] Individual column empty → column still renders with 0 count

**Loading State:**
- [ ] Skeleton loaders for kanban columns while loading

**Mobile:**
- [ ] Columns scroll horizontally on mobile
- [ ] Drag-and-drop may be replaced with a dropdown status changer on mobile
- [ ] Task cards are tap-friendly

**Edge Cases:**
- [ ] Column with 50+ tasks → scrollable within column
- [ ] Task with very long title → truncated on card, full title in detail
- [ ] Rapid drag-and-drop (moving multiple tasks quickly) → all updates save correctly
- [ ] Dragging task to same column → no change, no error
- [ ] Moving task to Done → running timer on that task is stopped

---

### 4.4 Project Detail — List View — `/projects/:id/list`

**PREREQUISITES:** Authenticated user, project with tasks.

**Happy Path:**
- [ ] Tasks displayed in a sortable table
- [ ] Columns: task title, status, due date, priority, assignee (self), time logged
- [ ] Sort by due date → ascending/descending
- [ ] Sort by priority → urgent first or low first
- [ ] Sort by status → groups tasks by column
- [ ] Bulk select tasks → bulk status change action
- [ ] Clicking a task → opens task detail

**Empty State:**
- [ ] No tasks → empty state message

**Mobile:**
- [ ] Table scrolls horizontally or switches to card layout on mobile

**Edge Cases:**
- [ ] Sorting by due date with some tasks having no due date → null dates sort last
- [ ] Bulk-selecting all tasks and changing status → all update correctly
- [ ] 100+ tasks → pagination or virtual scrolling

---

### 4.5 Project Templates — `/templates`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows list of saved project templates
- [ ] Each template shows: name, source project, task count, column structure
- [ ] "Create Template from Project" → selects a project, saves its task structure
- [ ] "Duplicate Template into New Project" → creates a new project pre-populated with template tasks
- [ ] "Delete Template" → removes template after confirmation

**Empty State:**
- [ ] No templates → "No templates yet" with CTA to create one

**Security:**
- [ ] Only the authenticated user's templates appear

**Edge Cases:**
- [ ] Template from deleted project → template still works (template_data is self-contained JSON)
- [ ] Template with 100+ tasks → all tasks are duplicated correctly
- [ ] Deleting a template does not affect projects created from it

---

## 5. Authenticated Pages — Tasks

### 5.1 Cross-Project Task List — `/tasks`

**PREREQUISITES:** Authenticated user with tasks across multiple projects.

**Happy Path:**
- [ ] Shows all tasks from every project in one list
- [ ] Each task shows: title, project name, client name, status, due date, priority, time logged
- [ ] Filter by client → shows only tasks from that client's projects
- [ ] Filter by project → shows only tasks from selected project
- [ ] Filter by status → shows only matching tasks
- [ ] Filter by priority → shows only matching priority
- [ ] Filter by due date range → shows only tasks in range
- [ ] Sort by any column → ascending/descending toggle
- [ ] Start timer from task row → timer begins
- [ ] Bulk select → bulk status change
- [ ] Clicking a task → navigates to task detail or opens slide-over

**Empty State:**
- [ ] No tasks across any project → "No tasks yet" with CTA

**Loading State:**
- [ ] Skeleton loaders while tasks load

**Security:**
- [ ] Only the authenticated user's tasks appear

**Mobile:**
- [ ] Filters in a collapsible panel or bottom sheet
- [ ] Task list in card layout on mobile

**Edge Cases:**
- [ ] 500+ tasks across many projects → paginated or virtualized
- [ ] Applying all filters simultaneously and clearing all → resets to full list
- [ ] Tasks from archived clients → hidden by default or grayed out

---

### 5.2 Task Detail — `/projects/:id/tasks/:taskId` (Slide-Over/Modal)

**PREREQUISITES:** Authenticated user, existing task.

**Happy Path:**
- [ ] Slide-over/modal opens with full task detail
- [ ] Shows: title, description, status, priority, due date, subtasks with checkboxes, file attachments, time entries, notes/comments, blocked-by info
- [ ] Edit title → saves on blur or explicit save
- [ ] Edit description → saves correctly
- [ ] Change status via dropdown → status updates, board reflects change
- [ ] Change priority via dropdown → priority updates
- [ ] Change due date → date updates
- [ ] Add subtask → subtask appears in list
- [ ] Toggle subtask checkbox → completion state updates, count updates
- [ ] Attach file → file appears in attachments list
- [ ] Log time → time entry created for this task
- [ ] Add note/comment → note appears in list with timestamp
- [ ] Start/stop timer → timer controls work, time entry created on stop
- [ ] View blocked-by info → shows blocking tasks

**Validation:**
- [ ] Title cleared → "Task title is required"
- [ ] Title > 500 characters → "Task title is too long"
- [ ] Invalid due date → "Please enter a valid date"
- [ ] Self-dependency (task blocks itself) → "A task cannot block itself"
- [ ] Cross-project dependency → "Dependencies must be within the same project"

**Empty State:**
- [ ] No subtasks → subtask section hidden or shows "Add subtask" prompt
- [ ] No attachments → attachments section hidden or shows upload prompt
- [ ] No time entries → time section shows "No time logged"
- [ ] No notes → notes section shows "Add a note" prompt

**Error State:**
- [ ] Task ID doesn't exist → 404 or panel doesn't open with error message
- [ ] File upload fails → error message next to upload area
- [ ] File exceeds 25 MB → "Maximum file size is 25 MB"

**Security:**
- [ ] Cannot access another user's task
- [ ] File download URLs are authenticated (signed, time-limited)

**Mobile:**
- [ ] Slide-over takes full screen on mobile
- [ ] All form controls are usable on mobile
- [ ] Close button is easily accessible

**Edge Cases:**
- [ ] Task with 20+ subtasks → scrollable list
- [ ] Task with 10+ attachments → all displayed
- [ ] Rapidly toggling subtask checkboxes → all changes saved correctly
- [ ] Adding a subtask with empty title → rejected
- [ ] Very long description (10,000+ chars) → saved and displayed correctly
- [ ] File with unusual filename (spaces, unicode, very long) → handled correctly

---

## 6. Authenticated Pages — Time Tracking

### 6.1 Time Entries — `/time`

**PREREQUISITES:** Authenticated user with time entries.

**Happy Path:**
- [ ] Shows all time entries in a list, most recent first
- [ ] Each entry shows: date, task name, project, client, duration, description, billable flag, hourly rate, amount
- [ ] Filter by date range → shows entries in range
- [ ] Filter by client → shows entries from that client's projects
- [ ] Filter by project → shows entries from selected project
- [ ] "Add Manual Entry" button → opens form for manual time entry
- [ ] Edit an entry → values update
- [ ] Delete an entry → entry removed after confirmation
- [ ] Export entries → downloads CSV/report

**Validation (Manual Entry):**
- [ ] Project not selected → "Please select a project"
- [ ] Duration = 0 or empty → "Duration must be between 1 minute and 24 hours"
- [ ] Duration > 1440 minutes → "Duration must be between 1 minute and 24 hours"
- [ ] Start time in the future → "Start time cannot be in the future"
- [ ] End time before start time → "End time must be after start time"

**Empty State:**
- [ ] No time entries → "No time tracked yet" with CTA to start timer or log time

**Loading State:**
- [ ] Skeleton loaders for time entry list

**Security:**
- [ ] Only the authenticated user's time entries appear
- [ ] Cannot edit/delete another user's time entries

**Mobile:**
- [ ] Time entries display in card layout on mobile
- [ ] Date range picker is usable on mobile

**Edge Cases:**
- [ ] 1000+ time entries → paginated or virtualized
- [ ] Entry with no task (project-level time) → "No task" or similar indicator
- [ ] Invoiced time entry → edit/delete buttons disabled with explanation "This time entry has been invoiced and cannot be modified"
- [ ] Time entry spanning midnight (11pm to 1am) → correct duration calculation
- [ ] Multiple entries on same task, same day → all shown separately
- [ ] Billable toggle → correctly affects amount calculation
- [ ] Summary row/section shows totals: total hours, total billable amount

---

### 6.2 Active Timer (Global Component)

**PREREQUISITES:** Authenticated user, timer started on a task.

**Happy Path:**
- [ ] Timer bar appears at the top/bottom of every page when a timer is running
- [ ] Shows: current task name, project name, elapsed time (updating every second)
- [ ] "Pause" button → timer pauses, elapsed time freezes
- [ ] "Stop" button → timer stops, time entry created with correct duration
- [ ] "Discard" button → timer stops, no time entry saved, confirmation prompt first

**Edge Cases:**
- [ ] Starting a new timer while one is running → old timer auto-pauses, saves partial entry
- [ ] User closes browser while timer is running → timer continues server-side
- [ ] User reopens browser → timer bar shows with correct elapsed time (synced from server)
- [ ] Timer running for 8+ hours → display handles large durations (e.g., "8h 23m")
- [ ] Timer running on a task in a completed project → warning shown
- [ ] Navigating between pages → timer bar persists and keeps counting
- [ ] Network disconnect while timer running → timer continues locally, syncs on reconnect

---

## 7. Authenticated Pages — Invoicing

### 7.1 Invoice List — `/invoices`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows all invoices with columns: invoice number, client name, amount, date issued, due date, status badge
- [ ] Status filter tabs: All, Draft, Sent, Paid, Overdue, Partial
- [ ] Filter by client → shows only that client's invoices
- [ ] Search by invoice number → filters results
- [ ] "Create Invoice" button → navigates to `/invoices/new`
- [ ] Clicking an invoice → navigates to `/invoices/:id`
- [ ] Summary section: total outstanding, total paid this month

**Empty State:**
- [ ] No invoices → "No invoices yet" with CTA to create first invoice

**Loading State:**
- [ ] Skeleton loaders for invoice table

**Security:**
- [ ] Only the authenticated user's invoices appear

**Mobile:**
- [ ] Invoice table scrolls horizontally or switches to cards on mobile
- [ ] Status filter tabs scroll horizontally on mobile

**Edge Cases:**
- [ ] 200+ invoices → paginated
- [ ] Invoice amounts in different currencies → displayed with correct currency symbol
- [ ] Overdue invoices → visually highlighted (red badge, bold)
- [ ] Filtering by "Overdue" → correctly identifies invoices past due date with balance remaining

---

### 7.2 Invoice Detail — `/invoices/:id`

**PREREQUISITES:** Authenticated user, existing invoice.

**Happy Path:**
- [ ] Shows full invoice: invoice number, from (business profile), to (client), line items, subtotal, tax/VAT, total, payments received, balance due, status, payment terms
- [ ] Draft invoice: "Edit" button works → can modify line items
- [ ] "Send by Email" button → sends to client email, status → Sent, `sent_at` recorded
- [ ] Time entries on sent invoice → marked `is_invoiced = true` (locked)
- [ ] Milestones on sent invoice → marked as invoiced
- [ ] "Export PDF" → downloads invoice as PDF
- [ ] "Record Payment" → form for amount, date, method, notes
- [ ] Full payment → status → Paid
- [ ] Partial payment → status → Partial, balance_due updated

**Validation:**
- [ ] Payment amount = 0 or negative → error
- [ ] Payment amount exceeds balance_due → "Payment cannot exceed the remaining balance"
- [ ] Sending invoice without business profile → "Please complete your business profile before sending invoices"

**Error State:**
- [ ] Invoice ID doesn't exist → 404
- [ ] Invoice belongs to another user → 403

**Security:**
- [ ] Cannot access another user's invoice
- [ ] Sent invoice cannot be edited (only draft)
- [ ] Paid invoice status cannot be changed

**Edge Cases:**
- [ ] Invoice with 50+ line items → all render, scrollable
- [ ] Invoice in Partial status → shows payment history
- [ ] Sending invoice twice → "This invoice has already been sent"
- [ ] Recording multiple partial payments → each recorded, balance decreases correctly
- [ ] Invoice total with tax calculation → math is correct to the penny
- [ ] Invoice with 0% tax → tax line hidden or shows $0.00

---

### 7.3 New Invoice — `/invoices/new`

**PREREQUISITES:** Authenticated user with at least one client and project.

**Happy Path:**
- [ ] Step 1: Select client → dropdown/search
- [ ] Step 2: Select project → shows only selected client's projects
- [ ] Step 3: Choose billing source:
  - Hourly project → shows unbilled time entries → select all or individual
  - Fixed-price project → shows uninvoiced milestones → select milestones
- [ ] Each selected item becomes a line item (description, hours/units, rate, amount)
- [ ] Can add/edit/remove custom line items
- [ ] Tax rate pre-filled from business profile (editable)
- [ ] Payment terms pre-filled from client default (editable)
- [ ] Notes field for footer notes
- [ ] Preview shows calculated total
- [ ] "Save as Draft" → creates draft invoice, redirects to `/invoices/:id`

**Validation:**
- [ ] No line items → "An invoice must have at least one line item"
- [ ] Line item with zero quantity or price → validation error
- [ ] Total = 0 → "Invoice total must be greater than zero"
- [ ] No client selected → cannot proceed to next step
- [ ] No project selected → cannot proceed

**Empty State:**
- [ ] Project has no unbilled time entries and no uninvoiced milestones → "There's nothing to invoice. Track time or complete milestones first."

**Security:**
- [ ] Can only select own clients and projects

**Edge Cases:**
- [ ] Client with 20+ projects → all appear in dropdown
- [ ] Project with 100+ unbilled time entries → all shown, selectable
- [ ] Custom line item with very long description → saved correctly
- [ ] Tax rate edge cases: 0%, 100%, 99.99% → calculations correct
- [ ] Navigating away mid-creation → data lost (or draft auto-saved with confirmation)

---

### 7.4 Business Profile — `/settings/business`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows current business identity: business name, address, logo preview, payment instructions, default tax/VAT rate, default currency, invoice number prefix, next invoice number
- [ ] Edit any field → saves on submit
- [ ] Upload logo → preview updates
- [ ] Logo appears on invoices after upload

**Validation:**
- [ ] Tax rate negative → error
- [ ] Tax rate > 100 → error (or warning)
- [ ] Currency must be valid ISO 4217 code (USD, EUR, GBP, etc.)
- [ ] Invoice number prefix too long → appropriate limit

**Empty State:**
- [ ] New user with no business profile → all fields empty with prompts

**Edge Cases:**
- [ ] Logo upload: large image (>25 MB) → rejected with error
- [ ] Logo upload: non-image file → rejected
- [ ] Currency change with existing invoices → existing invoices retain their original currency
- [ ] Invoice number prefix with special characters → handled correctly

---

## 8. Authenticated Pages — Calendar & Scheduling

### 8.1 Calendar — `/calendar`

**PREREQUISITES:** Authenticated user with tasks and projects that have deadlines.

**Happy Path:**
- [ ] Monthly calendar renders with current month
- [ ] Task due dates shown as dots/events, color-coded by client
- [ ] Project deadlines shown on correct dates
- [ ] Navigate to previous/next month → calendar updates
- [ ] Click a deadline → navigates to associated task or project
- [ ] Add blocked time (vacation, personal day) → blocked time appears on calendar
- [ ] Weekly view toggle (if available) → shows weekly breakdown

**Empty State:**
- [ ] No deadlines or events → empty calendar grid with "No upcoming deadlines"

**Loading State:**
- [ ] Skeleton loader for calendar grid

**Security:**
- [ ] Only the authenticated user's deadlines and events appear

**Mobile:**
- [ ] Calendar is usable on mobile (may switch to list/agenda view)
- [ ] Navigation between months is touch-friendly

**Edge Cases:**
- [ ] Month with 30+ events → all rendered without overlap (or with "+N more" indicator)
- [ ] Event on Feb 29 in leap year → rendered correctly
- [ ] Timezone changes → deadlines display in user's timezone
- [ ] Task with no due date → does not appear on calendar
- [ ] Same date has task deadline and project deadline → both shown

---

## 9. Authenticated Pages — Settings

### 9.1 Account Settings — `/settings/account`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows current name and email
- [ ] Change name → saves successfully
- [ ] Change email → sends verification to new email, keeps old until verified
- [ ] Change password → requires current password, sets new password
- [ ] All other sessions invalidated after password change
- [ ] "Delete Account" button → shows confirmation with cascade warning

**Validation:**
- [ ] Name empty → "Name is required"
- [ ] Email invalid → "Please enter a valid email address"
- [ ] Email already in use by another account → "This email is already registered"
- [ ] Current password wrong (on change) → "Current password is incorrect"
- [ ] New password doesn't meet requirements → appropriate error messages

**Security:**
- [ ] Password change requires current password
- [ ] Email change requires verification of new email
- [ ] Account deletion requires confirmation (ideally re-entering password)

**Edge Cases:**
- [ ] Changing email to same email → no-op or gentle message
- [ ] Very long name → appropriate max length

---

### 9.2 Notification Settings — `/settings/notifications`

**PREREQUISITES:** Authenticated user.

**Happy Path:**
- [ ] Shows toggle for each notification type: deadline reminders, overdue invoice reminders, budget alerts, time tracking reminders
- [ ] Deadline reminders: configurable "how far in advance" (1 day, 3 days, 7 days)
- [ ] Channel toggles: email on/off, in-app on/off
- [ ] Set quiet hours → notifications suppressed during those hours
- [ ] Saving preferences → persists across sessions

**Edge Cases:**
- [ ] Turning off all notifications → allowed, maybe with a soft warning
- [ ] Quiet hours spanning midnight (e.g., 10pm–7am) → handled correctly

---

### 9.3 Search — `/search?q=`

**PREREQUISITES:** Authenticated user with data.

**Happy Path:**
- [ ] Search input submits query
- [ ] Results grouped by type: Clients, Projects, Tasks, Notes
- [ ] Click a result → navigates to the corresponding page
- [ ] Results are relevant (full-text search across name, description, notes)

**Empty State:**
- [ ] No query → search page with prompt
- [ ] Query with no results → "No results found for '{query}'"

**Security:**
- [ ] Only the authenticated user's data appears in results
- [ ] Cannot find other users' data via search

**Edge Cases:**
- [ ] Query with special characters (`<script>`, `'; DROP TABLE`, `%`, `*`) → sanitized, no errors
- [ ] Very long query → truncated or handled gracefully
- [ ] Single character query → may show "Please enter at least 2 characters"
- [ ] Search results show correct context snippets with highlighted matching terms

---

## 10. Global Components

### 10.1 Navigation — Sidebar & Mobile Bottom Nav

- [ ] All nav items are present: Dashboard, Today, Clients, Projects, Tasks, Time, Invoices, Calendar, Settings
- [ ] Active page is highlighted in nav
- [ ] Clicking any nav item navigates to the correct page
- [ ] Mobile: bottom nav shows primary items, "More" button opens remaining items
- [ ] Mobile: "More" overlay lists all pages, dismissible
- [ ] Navigation state persists correctly across page changes (active highlight updates)

### 10.2 Notifications Bell/Dropdown

- [ ] Bell icon shows unread count badge
- [ ] Click bell → dropdown with notification list
- [ ] Each notification shows: title, message, timestamp
- [ ] Unread notifications visually distinct
- [ ] Click notification → navigates to referenced entity (task, project, invoice)
- [ ] "Mark all as read" → clears unread count
- [ ] Notification types work: deadline_reminder, budget_alert, overdue_invoice, time_tracking_reminder

### 10.3 404 Page

- [ ] Visiting a non-existent URL → shows 404 page
- [ ] 404 page has a "Return to Dashboard" link
- [ ] 404 page is styled consistently with the rest of the app

### 10.4 Error Boundary

- [ ] JavaScript error in a component → error boundary catches it, shows fallback UI
- [ ] Fallback UI has a "Return to Dashboard" or "Reload" button
- [ ] Error is logged (sent to error tracking service)

---

## 11. Cross-Page Flows

### 11.1 New User Onboarding Flow

- [ ] Sign up → email verification → dashboard (empty state)
- [ ] Dashboard shows "Add your first client →"
- [ ] Click → create client form → fill in → client created
- [ ] Client page shows "Create your first project →"
- [ ] Click → create project → fill in billing type, deadline → project created
- [ ] Project board shows "Add your first task →"
- [ ] Click → add task → task appears in To Do column
- [ ] Dashboard also shows "Set up your business profile →"
- [ ] Click → business profile → fill in → saved

### 11.2 Full Work Session Flow

- [ ] Open Today view → see tasks for today
- [ ] Click timer on a task → timer starts, timer bar visible
- [ ] Navigate to project board → timer bar still showing
- [ ] Work on task, stop timer → time entry created
- [ ] Drag task to "Done" → task moves, any running timer stops
- [ ] Navigate to `/time` → new time entry appears in list
- [ ] Navigate to dashboard → "Hours This Week" card shows updated total

### 11.3 Invoice Creation Flow (Hourly Project)

- [ ] Track time on multiple tasks in a project (several entries)
- [ ] Go to `/invoices/new` → select client → select project
- [ ] Unbilled time entries appear → select all
- [ ] Review line items → adjust if needed → preview total
- [ ] Save as Draft → invoice created with correct totals
- [ ] Edit draft → change a line item → total recalculates
- [ ] Send invoice → status changes to Sent, time entries locked
- [ ] Go to `/time` → those time entries now show "invoiced" badge
- [ ] Record full payment → invoice status changes to Paid

### 11.4 Invoice Creation Flow (Fixed-Price Project)

- [ ] Create fixed-price project with milestones
- [ ] Mark milestone as completed
- [ ] Go to `/invoices/new` → select client → select project
- [ ] Completed milestones appear → select one
- [ ] Save and send → milestone marked as invoiced
- [ ] Go to project overview → milestone shows "Invoiced" status

### 11.5 Client Portal Sharing Flow

- [ ] Create project with tasks
- [ ] Go to project settings → find portal token/link
- [ ] Copy link → open in incognito browser (not logged in)
- [ ] Portal loads: project name, task progress, milestones
- [ ] Original user marks more tasks as Done → portal updates on refresh
- [ ] Revoke portal token → link stops working

### 11.6 Project Lifecycle Flow

- [ ] Create project (Active) → add tasks → track time → create invoices
- [ ] Put project On Hold → running timers stopped
- [ ] Resume project (back to Active)
- [ ] Complete all tasks → mark project Completed
- [ ] Verify warning if not all tasks are Done
- [ ] Reopen project → status back to Active
- [ ] Cancel a project → confirm dialog → project marked Cancelled
- [ ] Cannot change Cancelled project to any status

### 11.7 Budget Alert Flow

- [ ] Create project with budget_hours = 10
- [ ] Track 7.5 hours (75%) → no alert
- [ ] Track 0.5 more hours (80%) → budget_alert_threshold hit → notification created
- [ ] Track 2 more hours (100%) → budget exceeded → stronger alert
- [ ] Dashboard and project page reflect over-budget status

### 11.8 Session Expiry Flow

- [ ] Log in → start working
- [ ] Wait for session idle timeout (7 days) or manually expire session
- [ ] Next action → redirect to login with "Session expired" message
- [ ] Return URL preserved → after re-login, return to original page
- [ ] Form data preserved in localStorage → restored after re-login

---

## 12. Security Tests

### 12.1 Authentication Bypass

- [ ] Access any `/dashboard`, `/clients`, `/projects`, `/tasks`, `/time`, `/invoices`, `/calendar`, `/settings` endpoint without authentication → redirected to `/login`
- [ ] Access API endpoints without auth cookie → 401 response
- [ ] Expired session cookie → 401 with redirect to login
- [ ] Tampered session cookie → 401 (session invalid)
- [ ] Using a different user's session ID → does not grant access to their data

### 12.2 Authorization / Data Isolation (IDOR Tests)

- [ ] User A creates a client → User B cannot access `/clients/{user_a_client_id}` → 403 or 404
- [ ] User A creates a project → User B cannot access `/projects/{user_a_project_id}` → 403 or 404
- [ ] User A creates a task → User B cannot access task detail → 403 or 404
- [ ] User A creates a time entry → User B cannot view/edit/delete it via API
- [ ] User A creates an invoice → User B cannot view/edit/send/record payment
- [ ] User A uploads a file → User B cannot access the file URL
- [ ] Changing `:id` in URL to another user's entity ID → access denied
- [ ] API calls with manipulated `user_id` parameter → ignored (server uses session user)
- [ ] Bulk operations only affect the authenticated user's data

### 12.3 Rate Limiting

- [ ] Login: 6th attempt within 15 minutes → 429 response with retry-after
- [ ] Signup: 4th attempt within 1 hour → 429 response
- [ ] Forgot password: 4th attempt for same email within 1 hour → 429 response
- [ ] General API: 101st request within 1 minute → 429 response
- [ ] File upload: 11th upload within 1 hour → 429 response
- [ ] Invoice email: 6th send within 1 hour → 429 response
- [ ] Rate limit responses include `Retry-After` header or countdown

### 12.4 Input Injection Tests

- [ ] SQL injection in search field: `' OR '1'='1` → no data leak, sanitized
- [ ] SQL injection in form fields: `'; DROP TABLE users;--` → rejected
- [ ] XSS in client name: `<script>alert('xss')</script>` → rendered as plain text, not executed
- [ ] XSS in task description: `<img onerror="alert(1)" src=x>` → rendered as plain text
- [ ] XSS in notes/comments → HTML-escaped
- [ ] HTML injection in invoice notes → escaped on render
- [ ] Command injection in file name → sanitized
- [ ] CSRF: state-changing POST/PUT/DELETE without valid CSRF token → 403

### 12.5 File Upload Security

- [ ] Upload file with valid type (image, PDF, doc) → accepted
- [ ] Upload file with invalid type (`.exe`, `.sh`, `.php`) → rejected
- [ ] Upload file > 25 MB → rejected with "Maximum file size is 25 MB"
- [ ] Upload file with mismatched MIME type and extension → rejected
- [ ] Upload file with malicious content (polyglot) → scanned and rejected
- [ ] File URLs are signed and time-limited → expired URL returns 403
- [ ] Direct access to file storage path without signed URL → denied

### 12.6 Session Security

- [ ] Session cookie has `Secure` flag → only sent over HTTPS
- [ ] Session cookie has `HttpOnly` flag → not accessible via JavaScript
- [ ] Session cookie has `SameSite=Strict` → prevents CSRF
- [ ] Session idle timeout: 7 days of inactivity → session expired
- [ ] Session absolute timeout: 30 days regardless of activity → session expired
- [ ] Password change → all other sessions invalidated immediately
- [ ] Logout → session fully invalidated server-side (not just cookie deleted)

### 12.7 Data Protection

- [ ] All traffic over HTTPS → HTTP requests redirect to HTTPS
- [ ] HSTS header present with appropriate max-age
- [ ] Passwords never returned in API responses
- [ ] Password hashes use bcrypt with cost factor 12
- [ ] Error pages do not expose stack traces, database schemas, or internal paths
- [ ] API error responses do not leak data about other users' existence

---

## 13. Destructive Actions & Cascade Tests

### 13.1 Delete Client

- [ ] Delete client with no projects → client removed
- [ ] Delete client with active projects → warning: "This client has X active projects. Archiving is recommended. Delete anyway?" → requires double confirmation
- [ ] Cascade: deleting client → all projects, tasks, subtasks, time entries, milestones, file attachments deleted
- [ ] Draft invoices deleted; sent/paid invoices retained (orphaned with client info snapshot)
- [ ] Archive client (soft delete) → client hidden from default list, accessible via filter
- [ ] Archive client with unpaid invoices → warning: "This client has $X in outstanding invoices. Archive anyway?"

### 13.2 Delete Project

- [ ] Delete active project → confirmation dialog with cascade warning
- [ ] Cascade: deleting project → all tasks, subtasks, time entries, milestones, file attachments deleted
- [ ] Draft invoices on project deleted; sent/paid invoices retained
- [ ] Project deletion stops all running timers on that project
- [ ] Deleted project disappears from client's project list

### 13.3 Delete Task

- [ ] Delete task with no time entries → task removed
- [ ] Delete task with time entries → warning: "This task has X hours of tracked time. Time entries will be preserved but unlinked. Delete anyway?"
- [ ] Cascade: deleting task → subtasks, task dependencies, task-level file attachments deleted
- [ ] Time entries are NOT deleted — they become orphaned (task_id = null)
- [ ] Deleting task removes it from all dependency chains (blocked/blocking)

### 13.4 Delete Invoice

- [ ] Delete draft invoice → invoice removed, time entries unmarked (is_invoiced = false), milestones set back to "completed"
- [ ] Attempt to delete sent invoice → blocked: "Sent invoices cannot be deleted. They are permanent records."
- [ ] Attempt to delete paid invoice → blocked

### 13.5 Delete Time Entry

- [ ] Delete non-invoiced time entry → confirmation → entry removed
- [ ] Attempt to delete invoiced time entry → blocked: "This time entry is linked to Invoice #X and cannot be modified."

### 13.6 Delete Account

- [ ] Delete account → cascade warning showing total data counts (N clients, N projects, N invoices, etc.)
- [ ] Requires confirmation (password re-entry or typed confirmation)
- [ ] Cascade: everything owned by user is deleted within 30 days
- [ ] User is logged out immediately
- [ ] User cannot log back in with same credentials
- [ ] Data export option available before deletion (GDPR)

---

## 14. Performance Tests

### 14.1 Page Load Times

- [ ] Landing page → renders in < 2 seconds
- [ ] Dashboard → fully interactive in < 3 seconds
- [ ] Project board with 50 tasks → loads in < 3 seconds
- [ ] Client list with 100 clients → loads in < 3 seconds
- [ ] Time entries page with 500 entries → paginated, first page in < 3 seconds
- [ ] Invoice list with 200 invoices → paginated, first page in < 3 seconds
- [ ] Calendar with 30+ events in a month → renders in < 3 seconds

### 14.2 Data Volume Stress Tests

- [ ] User with 50 clients → client list renders correctly
- [ ] User with 100 projects → project list renders correctly
- [ ] Project with 200 tasks → board view renders, columns scrollable
- [ ] Project with 1000 time entries → time page handles pagination
- [ ] Invoice with 100 line items → renders and calculates correctly
- [ ] Task with 50 subtasks → all render in detail panel
- [ ] Search with 500+ results → paginated, responsive

### 14.3 Concurrent Operations

- [ ] Two browser tabs editing same client → no data corruption (last write wins or conflict detection)
- [ ] Two browser tabs with timers → only one active timer at a time
- [ ] Rapid form submissions → debounced, no duplicate records
- [ ] Multiple invoices created simultaneously → unique invoice numbers guaranteed

### 14.4 Network Resilience

- [ ] Slow 3G connection → pages load (slower), no timeouts for basic reads
- [ ] Network drops during form submission → retry or error message, no data loss
- [ ] Network drops during file upload → upload fails gracefully, can retry
- [ ] Offline banner appears when connection lost → actions disabled
- [ ] Connection restored → banner removed, pending actions sync

---

## 15. Accessibility Tests

### 15.1 Keyboard Navigation

- [ ] All interactive elements reachable via Tab key
- [ ] Focus order follows visual order (top-to-bottom, left-to-right)
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals, slide-overs, and dropdowns
- [ ] Skip-to-content link present on every page
- [ ] Kanban board drag-and-drop has keyboard alternative (arrow keys or dropdown)
- [ ] Calendar navigable via keyboard (arrow keys for dates)

### 15.2 Screen Reader Support

- [ ] All images have alt text
- [ ] Form fields have associated `<label>` elements
- [ ] Error messages associated with fields via `aria-describedby`
- [ ] Modal/slide-over traps focus and announces via `aria-modal`
- [ ] Status badges have descriptive text (not just color)
- [ ] Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Dynamic content updates announced via `aria-live` regions

### 15.3 Visual Accessibility

- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- [ ] Information not conveyed by color alone (status uses text + color, not just color)
- [ ] Focus indicators visible on all interactive elements
- [ ] Text resizable to 200% without content being cut off
- [ ] No content relies on hover-only interactions (touch devices can access it)
- [ ] Animations can be reduced via `prefers-reduced-motion`

---

## 16. Cross-Browser & Device Tests

### 16.1 Desktop Browsers

- [ ] Chrome (latest) — all features work
- [ ] Firefox (latest) — all features work
- [ ] Safari (latest) — all features work
- [ ] Edge (latest) — all features work

### 16.2 Mobile Browsers

- [ ] Safari on iOS (iPhone) — layout, navigation, forms all work
- [ ] Chrome on Android — layout, navigation, forms all work
- [ ] Samsung Internet — no major issues

### 16.3 Responsive Breakpoints

- [ ] 320px (small phone) — all content accessible, no horizontal overflow
- [ ] 375px (standard phone) — clean layout
- [ ] 768px (tablet portrait) — appropriate layout shifts
- [ ] 1024px (tablet landscape / small desktop) — sidebar visible
- [ ] 1280px+ (desktop) — full layout with sidebar

---

*This checklist should be used as a living document. As features are built, each section should be tested and checked off. Failed tests should be logged as bugs with reproduction steps.*
