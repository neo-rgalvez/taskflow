# TaskFlow — QA Checklist

> Comprehensive test plan derived from [APPLICATION-PLAN.md](./APPLICATION-PLAN.md).
> Every feature, page, and flow has test cases organized by category.

---

## Table of Contents

1. [Public Pages](#1-public-pages)
2. [Authenticated Pages — Core](#2-authenticated-pages--core)
3. [Authenticated Pages — Clients](#3-authenticated-pages--clients)
4. [Authenticated Pages — Projects](#4-authenticated-pages--projects)
5. [Authenticated Pages — Tasks](#5-authenticated-pages--tasks)
6. [Authenticated Pages — Time Tracking](#6-authenticated-pages--time-tracking)
7. [Authenticated Pages — Invoicing](#7-authenticated-pages--invoicing)
8. [Authenticated Pages — Calendar](#8-authenticated-pages--calendar)
9. [Authenticated Pages — Settings](#9-authenticated-pages--settings)
10. [Cross-Page Flows](#10-cross-page-flows)
11. [Security Tests](#11-security-tests)
12. [Destructive Actions](#12-destructive-actions)
13. [Performance Tests](#13-performance-tests)
14. [Real User Behavior Tests](#14-real-user-behavior-tests)

---

## 1. Public Pages

### 1.1 Landing Page `/`

**PAGE:** Landing Page — `/`
**PREREQUISITES:** None (unauthenticated access)

**HAPPY PATH:**
- [ ] Page loads with marketing content, value proposition, feature highlights, and pricing
- [ ] "Sign Up" CTA button navigates to `/signup`
- [ ] "Log In" link navigates to `/login`
- [ ] Pricing section displays correctly

**VALIDATION:**
- [ ] N/A — no user input on this page

**EMPTY STATE:**
- [ ] N/A — static content page

**ERROR STATE:**
- [ ] Page gracefully handles failed asset loading (images, CSS)
- [ ] 500 error shows a friendly error page

**LOADING STATE:**
- [ ] Page renders meaningful content before all assets fully load (no blank screen)

**SECURITY:**
- [ ] Page is accessible without authentication
- [ ] Authenticated users who visit `/` are redirected to `/dashboard` (or see the landing page — verify expected behavior)
- [ ] No sensitive data exposed in page source

**MOBILE:**
- [ ] Layout adapts to mobile screen widths (320px, 375px, 414px)
- [ ] CTA buttons are tap-friendly (minimum 44x44px touch targets)
- [ ] Navigation is usable on mobile (hamburger menu or equivalent)

**EDGE CASES:**
- [ ] Page works with JavaScript disabled (progressive enhancement)
- [ ] All external links open in new tabs and have `rel="noopener noreferrer"`

---

### 1.2 Sign Up `/signup`

**PAGE:** Sign Up — `/signup`
**PREREQUISITES:** None (unauthenticated)

**HAPPY PATH:**
- [ ] Form displays fields for name, email, and password
- [ ] Entering valid data and submitting creates an account
- [ ] User receives a verification email after sign-up
- [ ] User is redirected to dashboard (or verification-pending page) after sign-up
- [ ] "Check your inbox" confirmation message appears

**VALIDATION:**
- [ ] Empty name field shows "required" error
- [ ] Empty email field shows "required" error
- [ ] Invalid email format (e.g., `foo`, `foo@`, `@bar.com`) shows validation error
- [ ] Empty password field shows "required" error
- [ ] Password shorter than 8 characters is rejected
- [ ] Password without uppercase letter is rejected
- [ ] Password without lowercase letter is rejected
- [ ] Password without number is rejected
- [ ] Name exceeding maximum length is rejected
- [ ] Email exceeding maximum length is rejected
- [ ] Duplicate email shows "email already registered" error
- [ ] Server-side validation catches bypassed client-side validation (submit via API)
- [ ] Error messages appear inline next to the relevant field
- [ ] SQL injection in email field is safely handled (e.g., `' OR 1=1 --`)
- [ ] XSS payload in name field is sanitized (e.g., `<script>alert('xss')</script>`)

**EMPTY STATE:**
- [ ] Form loads with empty fields and no pre-filled errors

**ERROR STATE:**
- [ ] Network error during submission shows user-friendly message
- [ ] Server error (500) during submission shows retry guidance
- [ ] Rate limit (429) shows "too many attempts" message with retry countdown

**LOADING STATE:**
- [ ] Submit button shows loading indicator while request is in progress
- [ ] Form fields are disabled during submission to prevent double-submit
- [ ] Double-clicking submit does not create duplicate accounts

**SECURITY:**
- [ ] Page is accessible without authentication
- [ ] Already-authenticated users visiting `/signup` are redirected to `/dashboard`
- [ ] Password is not visible in the input field (type="password")
- [ ] Password is sent over HTTPS only
- [ ] Rate limit: 3 sign-up attempts per hour per IP
- [ ] CSRF token is included in the form
- [ ] Form data is not logged in server logs

**MOBILE:**
- [ ] Form is usable on mobile screens
- [ ] Input fields trigger appropriate mobile keyboards (email keyboard for email field)
- [ ] Error messages are visible without scrolling past the field

**EDGE CASES:**
- [ ] Unicode characters in name field (e.g., `日本語`, `José`, `Müller`)
- [ ] Email with plus addressing (e.g., `user+test@example.com`)
- [ ] Leading/trailing whitespace in email is trimmed
- [ ] Browser autofill works correctly
- [ ] Back button after sign-up does not re-submit the form
- [ ] Password manager integration (form semantics for autocomplete)

---

### 1.3 Log In `/login`

**PAGE:** Log In — `/login`
**PREREQUISITES:** Existing account

**HAPPY PATH:**
- [ ] Form displays email and password fields
- [ ] Valid credentials log the user in and redirect to `/dashboard`
- [ ] "Forgot password" link navigates to `/forgot-password`
- [ ] Session cookie is set (HTTP-only, Secure, SameSite=Strict)
- [ ] `last_login_at` is updated on the User record

**VALIDATION:**
- [ ] Empty email shows validation error
- [ ] Empty password shows validation error
- [ ] Invalid email format shows validation error
- [ ] Wrong email shows generic "Invalid email or password" (no user enumeration)
- [ ] Wrong password shows generic "Invalid email or password" (no user enumeration)

**EMPTY STATE:**
- [ ] Form loads with empty fields

**ERROR STATE:**
- [ ] Network error shows retry message
- [ ] Server error (500) shows friendly error page
- [ ] Rate limit (5 attempts / 15 min per IP) shows "too many attempts" with countdown

**LOADING STATE:**
- [ ] Submit button shows loading state
- [ ] Form fields disabled during submission
- [ ] Double-clicking submit does not trigger two login requests

**SECURITY:**
- [ ] Accessible without authentication
- [ ] Already-authenticated users are redirected to `/dashboard`
- [ ] Rate limit: 5 login attempts per 15 minutes per IP
- [ ] No user enumeration through error messages or response timing
- [ ] CSRF token is present
- [ ] Session fixation: new session ID is issued after successful login
- [ ] Password field uses `type="password"`
- [ ] Login with unverified email succeeds but shows verification banner

**MOBILE:**
- [ ] Form is usable on mobile
- [ ] Appropriate keyboard types for each field

**EDGE CASES:**
- [ ] Login preserves return URL (e.g., redirected from a protected page)
- [ ] Concurrent sessions from multiple devices
- [ ] Login after account was deactivated/deleted
- [ ] Browser back button after login doesn't show the login form again
- [ ] Case sensitivity of email (should be case-insensitive)

---

### 1.4 Forgot Password `/forgot-password`

**PAGE:** Forgot Password — `/forgot-password`
**PREREQUISITES:** None

**HAPPY PATH:**
- [ ] Form displays email input field
- [ ] Submitting a valid registered email sends a password reset email
- [ ] Confirmation message appears: "If an account exists with this email, we've sent a reset link"
- [ ] Reset email contains a link to `/reset-password/:token`

**VALIDATION:**
- [ ] Empty email shows validation error
- [ ] Invalid email format shows validation error

**EMPTY STATE:**
- [ ] Form loads with empty email field

**ERROR STATE:**
- [ ] Network error shows retry message
- [ ] Server error shows friendly error

**LOADING STATE:**
- [ ] Submit button shows loading indicator
- [ ] Form disabled during submission
- [ ] Double-clicking submit does not send multiple reset emails

**SECURITY:**
- [ ] Same confirmation message whether email exists or not (no user enumeration)
- [ ] Rate limit: 3 attempts per hour per email
- [ ] CSRF token present
- [ ] Reset token is cryptographically random
- [ ] Reset token is single-use
- [ ] Reset token expires after 1 hour

**MOBILE:**
- [ ] Form is usable on mobile

**EDGE CASES:**
- [ ] Submitting multiple reset requests — only the latest token should be valid
- [ ] Requesting reset for a deleted account
- [ ] Email deliverability (check spam folder guidance)

---

### 1.5 Reset Password `/reset-password/:token`

**PAGE:** Reset Password — `/reset-password/:token`
**PREREQUISITES:** Valid password reset token from email

**HAPPY PATH:**
- [ ] Page loads with new password form when token is valid
- [ ] Entering a valid new password resets the password
- [ ] User is redirected to login (or auto-logged in) after successful reset
- [ ] All other sessions are invalidated after password reset
- [ ] Success confirmation message is shown

**VALIDATION:**
- [ ] Password shorter than 8 characters is rejected
- [ ] Password without uppercase letter is rejected
- [ ] Password without lowercase letter is rejected
- [ ] Password without number is rejected
- [ ] Password confirmation field must match (if present)

**EMPTY STATE:**
- [ ] Form loads with empty password field

**ERROR STATE:**
- [ ] Expired token (>1 hour old) shows "link has expired" message with option to request new one
- [ ] Already-used token shows "link has already been used" message
- [ ] Invalid/malformed token shows "invalid link" message
- [ ] Server error shows friendly message

**LOADING STATE:**
- [ ] Submit button shows loading indicator
- [ ] Double-clicking submit does not reset the password twice or error

**SECURITY:**
- [ ] Token is validated server-side before showing the form
- [ ] Token is invalidated after use (single-use)
- [ ] Token expiry is enforced (1 hour)
- [ ] Old password is not required (user forgot it)
- [ ] All other sessions invalidated on password change

**MOBILE:**
- [ ] Form is usable on mobile

**EDGE CASES:**
- [ ] Visiting the reset URL after the password was already changed via another method
- [ ] Token with URL-unsafe characters (encoding)
- [ ] Browser back button after successful reset

---

### 1.6 Client Portal `/portal/:token`

**PAGE:** Client Portal — `/portal/:token`
**PREREQUISITES:** Valid portal token generated by a project owner

**HAPPY PATH:**
- [ ] Page loads with read-only project status for a valid token
- [ ] Project name and description are visible
- [ ] Task statuses are visible with progress bar (X of Y complete)
- [ ] Milestones are visible (for fixed-price projects)
- [ ] File upload works (if enabled by the freelancer)

**VALIDATION:**
- [ ] File upload rejects files exceeding 25 MB
- [ ] File upload rejects disallowed MIME types

**EMPTY STATE:**
- [ ] Project with no tasks shows appropriate empty message
- [ ] Project with no milestones (hourly project) does not show milestone section

**ERROR STATE:**
- [ ] Invalid token shows "not found" or "access denied" message
- [ ] Revoked token shows appropriate error
- [ ] Server error shows friendly message

**LOADING STATE:**
- [ ] Page shows loading skeleton while fetching project data

**SECURITY:**
- [ ] No login required — token-based access only
- [ ] Portal is strictly read-only (no edit/delete actions)
- [ ] Token cannot be used to access other projects or user data
- [ ] File uploads go to a sandboxed area
- [ ] Direct URL manipulation of the token doesn't grant broader access
- [ ] Portal does not expose sensitive data (hourly rates, invoice amounts, internal notes)

**MOBILE:**
- [ ] Portal layout is responsive and usable on mobile
- [ ] Progress bars and status indicators scale correctly

**EDGE CASES:**
- [ ] Portal for a completed project — shows final state
- [ ] Portal for a cancelled project — shows appropriate status
- [ ] Very long project names or descriptions
- [ ] Project with 100+ tasks — performance and pagination
- [ ] Multiple clients viewing the same portal simultaneously

---

## 2. Authenticated Pages — Core

### 2.1 Dashboard `/dashboard`

**PAGE:** Dashboard — `/dashboard`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Active projects count card shows correct number
- [ ] Upcoming deadlines card shows tasks/projects due in the next 7 days
- [ ] Hours tracked this week card shows correct total
- [ ] Outstanding invoice total card shows correct amount
- [ ] Recent activity section shows latest actions
- [ ] Clicking any card navigates to the appropriate detailed view
- [ ] Starting a timer from recent tasks works correctly

**VALIDATION:**
- [ ] N/A — no direct user input on this page

**EMPTY STATE:**
- [ ] New user with no data sees onboarding prompts:
  - "Add your first client" CTA
  - "Set up your business profile" CTA
- [ ] Zero active projects shows "0" (not blank or broken layout)
- [ ] No upcoming deadlines shows "No upcoming deadlines" message
- [ ] Zero hours tracked shows "0h 0m" or equivalent
- [ ] No outstanding invoices shows "$0.00"

**ERROR STATE:**
- [ ] Individual widget failure doesn't crash the entire dashboard
- [ ] API failure shows "unable to load" per widget with retry option

**LOADING STATE:**
- [ ] Dashboard shows skeleton loaders for each card while data loads
- [ ] Cards populate independently (progressive loading)

**SECURITY:**
- [ ] Requires authentication — unauthenticated users redirected to `/login`
- [ ] Dashboard only shows current user's data
- [ ] Unverified email shows verification banner but dashboard is accessible

**MOBILE:**
- [ ] Cards stack vertically on mobile
- [ ] All cards are readable without horizontal scrolling
- [ ] Timer interaction is usable on touch devices

**EDGE CASES:**
- [ ] User with 100+ active projects — card displays truncated list or count
- [ ] Overdue deadlines highlighted differently from upcoming ones
- [ ] Hours card handles running timer (shows real-time updating value)
- [ ] Timezone handling: deadlines calculated in user's configured timezone

---

### 2.2 Today View `/today`

**PAGE:** Today View — `/today`
**PREREQUISITES:** Authenticated user, tasks with due dates

**HAPPY PATH:**
- [ ] Shows tasks due today across all projects
- [ ] Tasks are grouped by client/project
- [ ] Overdue tasks are highlighted
- [ ] Checking off a task marks it as "Done"
- [ ] Starting a timer from a task works and shows active timer bar
- [ ] Rescheduling a task to tomorrow updates the due date

**VALIDATION:**
- [ ] N/A — actions are toggle/click based

**EMPTY STATE:**
- [ ] No tasks due today shows "Nothing due today" with encouraging message
- [ ] All tasks completed today shows congratulatory state

**ERROR STATE:**
- [ ] Failed task status update reverts the checkbox and shows error toast
- [ ] Failed timer start shows error message

**LOADING STATE:**
- [ ] Task list shows skeleton while loading
- [ ] Individual task updates show optimistic UI

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's tasks
- [ ] Cannot manipulate task IDs in requests to access other users' tasks

**MOBILE:**
- [ ] Task list is scrollable on mobile
- [ ] Checkboxes and timer buttons are tap-friendly
- [ ] Swipe gestures work (if implemented)

**EDGE CASES:**
- [ ] Tasks due today in a different timezone than the user's setting
- [ ] Task with active timer already running
- [ ] Completing the last task of the day — state update
- [ ] 100+ tasks due today — performance and scrolling
- [ ] Task that belongs to a completed/cancelled project

---

## 3. Authenticated Pages — Clients

### 3.1 Client List `/clients`

**PAGE:** Client List — `/clients`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] All active clients are displayed (card or table view)
- [ ] Each client shows: name, active project count, outstanding invoices, status
- [ ] "Add New Client" button opens the creation form/modal
- [ ] Search filters clients by name
- [ ] Filter by active/archived status works
- [ ] Archive client action moves it to archived state
- [ ] Clicking a client navigates to `/clients/:id`

**VALIDATION:**
- [ ] Search input handles special characters without errors
- [ ] Search with SQL injection attempts is safely handled

**EMPTY STATE:**
- [ ] New user with no clients sees "No clients yet" with "Add your first client" CTA
- [ ] Search with no matches shows "No clients match your search"
- [ ] Archived filter with no archived clients shows "No archived clients"

**ERROR STATE:**
- [ ] Failed client list load shows error with retry option
- [ ] Failed archive action shows error toast

**LOADING STATE:**
- [ ] Client list shows skeleton/loading indicator
- [ ] Archive action shows loading state on the button

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's clients
- [ ] Cannot enumerate other users' clients via API

**MOBILE:**
- [ ] Client cards/table adapts to mobile layout
- [ ] Search is accessible on mobile
- [ ] Actions (archive, edit) are accessible on mobile

**EDGE CASES:**
- [ ] Client with very long name — text truncation
- [ ] 500+ clients — pagination and performance
- [ ] Client with $0 outstanding and 0 projects — displays cleanly
- [ ] Archiving a client with active projects shows warning
- [ ] Archiving a client with unpaid invoices shows warning about outstanding $X

---

### 3.2 Client Detail `/clients/:id`

**PAGE:** Client Detail — `/clients/:id`
**PREREQUISITES:** Authenticated user, existing client owned by user

**HAPPY PATH:**
- [ ] Client profile loads with all tabs (info, projects, invoices)
- [ ] Contact info displays: name, contact name, email, phone, address, notes
- [ ] Default hourly rate and payment terms are displayed
- [ ] List of projects under this client is shown
- [ ] List of invoices for this client is shown
- [ ] Total hours tracked and total revenue are calculated correctly
- [ ] Edit client info saves changes
- [ ] "Add Project" button creates a new project for this client

**VALIDATION:**
- [ ] Client name is required (cannot save empty)
- [ ] Client name max 200 characters
- [ ] Email format validation (if provided)
- [ ] Hourly rate must be non-negative (if provided)
- [ ] Payment terms must be a positive integer

**EMPTY STATE:**
- [ ] Client with no projects shows "No projects yet" with CTA
- [ ] Client with no invoices shows "No invoices yet"
- [ ] Client with no notes shows empty notes section (not broken layout)

**ERROR STATE:**
- [ ] Client not found (deleted or wrong ID) shows 404 page
- [ ] Accessing another user's client shows 403 and redirects to dashboard
- [ ] Failed save shows error toast with the specific validation errors

**LOADING STATE:**
- [ ] Page shows skeleton while client data loads
- [ ] Save button shows loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] User can only view their own clients (ownership check)
- [ ] Direct URL manipulation to another user's client ID returns 403
- [ ] API requests with another user's client_id are rejected

**MOBILE:**
- [ ] Tabs are scrollable/accessible on mobile
- [ ] Edit form is usable on mobile

**EDGE CASES:**
- [ ] Editing client while another tab has the same client open — last write wins or conflict warning
- [ ] Archived client — edit and archive/unarchive toggle
- [ ] Client with 50+ projects — list performance
- [ ] Updating default hourly rate — does not retroactively change existing projects
- [ ] Deleting a client — cascade warning and confirmation
- [ ] Double-clicking save does not create duplicate requests or corrupt data
- [ ] Browser back button after saving — goes to client list, not re-saves
- [ ] Browser refresh mid-edit — unsaved changes prompt or data preserved
- [ ] Session expires while editing client — save attempt redirects to login, return URL preserved
- [ ] Pasting 50,000+ characters into notes field — truncated or rejected gracefully
- [ ] Pasting rich text (HTML from Word/Google Docs) into notes — stripped to plain text or handled safely
- [ ] Deleting a client in one tab while viewing it in another — second tab shows 404 on next action

---

## 4. Authenticated Pages — Projects

### 4.1 Project List `/projects`

**PAGE:** Project List — `/projects`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] All projects across all clients are displayed
- [ ] Each project shows: name, client name, status badge, deadline, budget progress bar
- [ ] Filter by client works
- [ ] Filter by status (active, on_hold, completed, cancelled) works
- [ ] Search by project name works
- [ ] "Create Project" button opens creation flow
- [ ] Clicking a project navigates to `/projects/:id`

**VALIDATION:**
- [ ] Search and filter inputs handle special characters safely

**EMPTY STATE:**
- [ ] No projects at all shows "No projects yet" with CTA
- [ ] Filters applied but no matches shows "No projects match your filters"

**ERROR STATE:**
- [ ] Failed load shows error with retry
- [ ] Failed filter/search shows error message

**LOADING STATE:**
- [ ] Project list shows skeleton loaders
- [ ] Filters update results with loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's projects

**MOBILE:**
- [ ] Project list adapts to mobile (card layout or responsive table)
- [ ] Filters are accessible (filter drawer/dropdown on mobile)
- [ ] Budget progress bars are readable on small screens

**EDGE CASES:**
- [ ] Project with no deadline — deadline column shows dash or "No deadline"
- [ ] Project at 100%+ budget — progress bar shows overrun visually
- [ ] 200+ projects — pagination and performance
- [ ] Project name or client name extremely long — truncation

---

### 4.2 Project Detail — Board View `/projects/:id/board`

**PAGE:** Project Board — `/projects/:id/board`
**PREREQUISITES:** Authenticated user, existing project owned by user

**HAPPY PATH:**
- [ ] Kanban board loads with columns: To Do, In Progress, Waiting on Client, Review, Done
- [ ] Tasks appear as cards with: title, due date, priority, subtask count
- [ ] Dragging a task between columns updates its status
- [ ] "Add Task" button in each column creates a task in that status
- [ ] Clicking a task card opens the task detail panel/modal
- [ ] Starting a timer from a task card works

**VALIDATION:**
- [ ] New task requires a title
- [ ] Task title max 500 characters

**EMPTY STATE:**
- [ ] New project with no tasks shows "Add your first task" prompt in each column
- [ ] Empty columns (no tasks in that status) show drop zone

**ERROR STATE:**
- [ ] Failed drag-and-drop reverts the card to its original position
- [ ] Failed task creation shows error with form preserved
- [ ] Offline during drag shows "changes will sync when reconnected"

**LOADING STATE:**
- [ ] Board shows skeleton columns and card placeholders while loading
- [ ] Drag-and-drop shows optimistic update then confirms

**SECURITY:**
- [ ] Requires authentication
- [ ] Cannot view another user's project board
- [ ] Cannot drag tasks via API manipulation to another user's project

**MOBILE:**
- [ ] Columns are horizontally scrollable on mobile
- [ ] Touch-based drag and drop works (or alternative mobile interaction)
- [ ] Task cards are readable on small screens
- [ ] Add task interaction works on mobile

**EDGE CASES:**
- [ ] Column with 50+ tasks — scrolling within column
- [ ] Dragging a task to "Done" with a running timer — timer should auto-stop
- [ ] Board for a completed/cancelled project — is it read-only or editable?
- [ ] Two tabs open on the same board — concurrent drag operations
- [ ] Task with very long title — card truncation
- [ ] Rapid successive drag operations
- [ ] Browser refresh mid-drag — board reloads to pre-drag state
- [ ] Dropping a card outside any column — card snaps back to original position
- [ ] Browser back button from board — navigates to project list, not undo last drag
- [ ] Session expires while dragging — drop is rejected, user redirected to login
- [ ] Double-clicking "Add Task" button — does not open two create forms or create duplicates

---

### 4.3 Project Detail — List View `/projects/:id/list`

**PAGE:** Project List View — `/projects/:id/list`
**PREREQUISITES:** Authenticated user, existing project owned by user

**HAPPY PATH:**
- [ ] Tasks displayed in a sortable table
- [ ] Columns: title, status, due date, priority, time logged
- [ ] Sort by due date works (ascending/descending)
- [ ] Sort by priority works
- [ ] Sort by status works
- [ ] Bulk status change (select multiple tasks, change status) works
- [ ] Clicking a task opens the task detail

**VALIDATION:**
- [ ] Bulk action requires at least one task selected

**EMPTY STATE:**
- [ ] No tasks shows "No tasks in this project" with CTA

**ERROR STATE:**
- [ ] Failed sort/filter shows error
- [ ] Failed bulk action shows error with details on which tasks failed

**LOADING STATE:**
- [ ] Table shows loading skeleton
- [ ] Sort changes show brief loading indicator

**SECURITY:**
- [ ] Requires authentication and project ownership
- [ ] Bulk actions validate ownership of every task

**MOBILE:**
- [ ] Table is horizontally scrollable or adapts to card layout on mobile
- [ ] Bulk select checkboxes are tap-friendly

**EDGE CASES:**
- [ ] Project with 500+ tasks — pagination and performance
- [ ] All tasks in "Done" status
- [ ] Mixed sort (e.g., sort by priority then by due date)
- [ ] Tasks with no due date in a date-sorted list — appear at end or beginning?

---

### 4.4 Project Detail — Overview `/projects/:id`

**PAGE:** Project Overview — `/projects/:id`
**PREREQUISITES:** Authenticated user, existing project owned by user

**HAPPY PATH:**
- [ ] Project summary displays: description, deadline, billing type, rate/price
- [ ] Budget section shows estimated vs. actual (hours or dollars)
- [ ] Attached files section lists project-level files
- [ ] Milestone list displays (for fixed-price projects)
- [ ] Edit project details saves changes
- [ ] Change project status works (active → on_hold, active → completed, etc.)
- [ ] File upload works (within 25 MB limit)

**VALIDATION:**
- [ ] Project name required, max 200 chars
- [ ] Billing type required (hourly or fixed_price)
- [ ] Hourly rate required if billing_type = hourly, must be positive
- [ ] Fixed price required if billing_type = fixed_price, must be positive
- [ ] Deadline must be a valid date
- [ ] Budget hours must be non-negative
- [ ] File upload: max 25 MB, allowed MIME types only

**EMPTY STATE:**
- [ ] No description shows empty/placeholder text
- [ ] No files shows "No files attached" with upload CTA
- [ ] No milestones (hourly project) — milestone section hidden or shows N/A
- [ ] Budget not set — shows "No budget set" or dash

**ERROR STATE:**
- [ ] Failed save shows validation errors inline
- [ ] Failed file upload shows error message
- [ ] Failed status change shows error and reverts
- [ ] File too large (413) shows clear size limit message

**LOADING STATE:**
- [ ] Page shows skeleton while loading
- [ ] File upload shows progress indicator
- [ ] Status change shows loading on the button

**SECURITY:**
- [ ] Requires authentication and project ownership
- [ ] Files served through authenticated endpoints (not direct storage URLs)
- [ ] Cannot upload malicious files (server validates MIME type)

**MOBILE:**
- [ ] Project overview is readable on mobile
- [ ] File upload works on mobile (camera/gallery picker)
- [ ] Status change is accessible on mobile

**EDGE CASES:**
- [ ] Changing billing type from hourly to fixed_price on a project with existing time entries
- [ ] Setting deadline in the past (on edit — allowed? warning?)
- [ ] Budget at 80%+ threshold triggers alert
- [ ] Completing a project with tasks still in "To Do" — shows warning
- [ ] Cancelling a project — confirmation required, stops all timers
- [ ] Uploading file with duplicate filename
- [ ] Portal token generation and sharing

---

### 4.5 Project Templates `/templates`

**PAGE:** Project Templates — `/templates`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] List of saved templates displayed
- [ ] Each template shows: name, source project, task count, column structure
- [ ] "Create Template from Project" creates a new template
- [ ] "Duplicate into New Project" creates a project from template
- [ ] Delete template removes it
- [ ] Duplicated project has all tasks and column structure from template

**VALIDATION:**
- [ ] Template name required

**EMPTY STATE:**
- [ ] No templates shows "No templates yet" with CTA to create one

**ERROR STATE:**
- [ ] Failed template creation shows error
- [ ] Failed duplication shows error

**LOADING STATE:**
- [ ] Template list shows loading skeleton
- [ ] Duplication action shows progress indicator (may take time for large templates)

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's templates
- [ ] Cannot duplicate another user's template

**MOBILE:**
- [ ] Template list is usable on mobile
- [ ] Create/duplicate actions accessible on mobile

**EDGE CASES:**
- [ ] Template from a project with 100+ tasks — large template_data JSON
- [ ] Deleting a template while someone is duplicating it
- [ ] Template from a deleted source project — source project reference shows "deleted"
- [ ] Editing a template name after creation

---

## 5. Authenticated Pages — Tasks

### 5.1 Cross-Project Task List `/tasks`

**PAGE:** Cross-Project Task List — `/tasks`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] All tasks across all projects shown in a filterable/sortable view
- [ ] Each task shows: title, project name, client name, status, due date, priority, time logged
- [ ] Filter by client works
- [ ] Filter by project works
- [ ] Filter by status works
- [ ] Filter by priority works
- [ ] Filter by due date range works
- [ ] Sort by any column works
- [ ] Starting a timer from a task works
- [ ] Bulk status change works
- [ ] Clicking a task navigates to its detail view

**VALIDATION:**
- [ ] Filter combinations return correct results
- [ ] Date range filter: start date cannot be after end date

**EMPTY STATE:**
- [ ] No tasks at all shows "No tasks yet" with CTA
- [ ] Filters applied with no matches shows "No tasks match your filters"

**ERROR STATE:**
- [ ] Failed load shows error with retry
- [ ] Failed bulk action shows error

**LOADING STATE:**
- [ ] Task list shows skeleton
- [ ] Filter changes show loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's tasks
- [ ] Filter parameters cannot be manipulated to access other users' data

**MOBILE:**
- [ ] Task list adapts to mobile layout
- [ ] Filters are accessible via dropdown/drawer on mobile
- [ ] Bulk actions accessible on mobile

**EDGE CASES:**
- [ ] 1000+ tasks across projects — pagination and performance
- [ ] Tasks from archived clients — included or excluded?
- [ ] Tasks from cancelled projects — included or excluded?
- [ ] Multiple filters combined (e.g., client + status + priority + date range)

---

### 5.2 Task Detail `/projects/:id/tasks/:taskId`

**PAGE:** Task Detail — `/projects/:id/tasks/:taskId` (modal/slide-over panel)
**PREREQUISITES:** Authenticated user, existing task in user's project

**HAPPY PATH:**
- [ ] Task detail panel opens with all fields visible
- [ ] Title is editable
- [ ] Description is editable (rich text or markdown)
- [ ] Status dropdown changes status
- [ ] Priority dropdown changes priority
- [ ] Due date picker works
- [ ] Subtask list displays with completion checkboxes
- [ ] Adding a new subtask works
- [ ] File attachments section shows attached files
- [ ] File upload to task works
- [ ] Time entries section shows logged time
- [ ] "Log Time" adds a manual time entry
- [ ] Start/stop timer works
- [ ] Notes/comments section works
- [ ] "Blocked by" info shows task dependencies

**VALIDATION:**
- [ ] Task title required, max 500 chars
- [ ] Due date must be a valid date
- [ ] Priority must be one of: low, medium, high, urgent
- [ ] Subtask title required
- [ ] Self-dependency blocked ("A task cannot block itself")
- [ ] Cross-project dependency blocked ("Dependencies must be within the same project")
- [ ] File upload max 25 MB, allowed MIME types only
- [ ] Time entry: duration 1–1440 minutes, start time not in future, end after start

**EMPTY STATE:**
- [ ] No subtasks shows "No subtasks" with "Add subtask" CTA
- [ ] No files shows "No files" with upload CTA
- [ ] No time entries shows "No time logged" with "Log time" CTA
- [ ] No notes shows empty notes area
- [ ] No dependencies shows "No dependencies"

**ERROR STATE:**
- [ ] Task not found shows 404
- [ ] Unauthorized access shows 403
- [ ] Failed save shows error and preserves unsaved changes
- [ ] Failed file upload shows error

**LOADING STATE:**
- [ ] Panel shows loading skeleton
- [ ] Individual sections load independently
- [ ] Save actions show loading state

**SECURITY:**
- [ ] Requires authentication and task ownership (via project ownership)
- [ ] Cannot edit tasks in another user's project
- [ ] Cannot add dependencies to tasks in other users' projects
- [ ] File access requires authentication

**MOBILE:**
- [ ] Panel adapts to full-screen on mobile
- [ ] All interactive elements are tap-friendly
- [ ] File upload works on mobile

**EDGE CASES:**
- [ ] Task with 50+ subtasks — scrolling/performance
- [ ] Task with 20+ time entries — scrolling/performance
- [ ] Editing a task while another user has it open (single-user app, but multiple tabs)
- [ ] Moving task to "Done" while timer is running — timer auto-stops
- [ ] Editing an invoiced time entry — should be blocked with clear message
- [ ] Task in a completed project — is editing allowed?
- [ ] Very long description — scrolling behavior
- [ ] Circular dependency prevention (A blocks B, B blocks A)
- [ ] Double-clicking save/status-change does not fire duplicate API requests
- [ ] Browser refresh while editing title — unsaved change prompt, or auto-save
- [ ] Browser back button from task modal — closes modal (not navigates away from project)
- [ ] Escape key closes the task modal/panel
- [ ] Session expires while editing task description — save attempt redirects to login
- [ ] Pasting 100,000+ characters into description field — rejected or truncated gracefully, no browser freeze
- [ ] Pasting rich text (HTML) into description — stripped to safe content or rendered correctly
- [ ] Pasting an image directly into description (Ctrl+V screenshot) — handled or gracefully ignored
- [ ] Deleting a task in one tab while editing it in another — second tab shows error on save
- [ ] Opening the same task modal from Today view AND from project board simultaneously
- [ ] Rapid checkbox toggling on subtasks — each toggle is debounced and persisted correctly
- [ ] Uploading a file while another upload is in progress — queued or parallel with correct state
- [ ] Cancelling a file upload mid-progress — upload stops, no partial file saved

---

## 6. Authenticated Pages — Time Tracking

### 6.1 Time Entries `/time`

**PAGE:** Time Entries — `/time`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] All time entries displayed in a list
- [ ] Each entry shows: date, task name, project, client, duration, description, billable flag, hourly rate, amount
- [ ] Filter by date range works
- [ ] Filter by client works
- [ ] Filter by project works
- [ ] "Add Manual Entry" form works (project, task, date, start/end or duration, description, billable toggle)
- [ ] Edit an existing entry works
- [ ] Delete an entry works (with confirmation)
- [ ] Export function works

**VALIDATION:**
- [ ] Manual entry: project_id required
- [ ] Duration must be 1–1440 minutes
- [ ] Start time cannot be in the future
- [ ] End time must be after start time
- [ ] Cannot edit an invoiced entry ("This time entry has been invoiced and cannot be modified")
- [ ] Cannot delete an invoiced entry

**EMPTY STATE:**
- [ ] No time entries shows "No time tracked yet" with CTA
- [ ] Filters with no matches shows "No entries match your filters"

**ERROR STATE:**
- [ ] Failed entry creation shows validation errors
- [ ] Failed deletion shows error toast
- [ ] Failed export shows error

**LOADING STATE:**
- [ ] Entry list shows skeleton
- [ ] Manual entry form shows loading on save
- [ ] Export shows progress indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's time entries
- [ ] Cannot manipulate entry IDs to view/edit other users' entries

**MOBILE:**
- [ ] Time entry list is scrollable on mobile
- [ ] Manual entry form is usable on mobile
- [ ] Date/time pickers are mobile-friendly

**EDGE CASES:**
- [ ] Time entry spanning midnight (start 23:00, end 01:00 next day)
- [ ] Manual entry for a date in the past (last week, last month)
- [ ] 1000+ time entries — pagination and performance
- [ ] Entry with duration of exactly 1440 minutes (24 hours)
- [ ] Decimal hour display accuracy (rounding to nearest minute)
- [ ] Billable amount calculation: duration × hourly rate accuracy
- [ ] Time entries for projects with different hourly rates
- [ ] Entries where the task was subsequently deleted (orphaned entries)
- [ ] Double-clicking save on manual entry does not create duplicate entries
- [ ] Browser back button after saving a manual entry — goes to entry list, not re-creates
- [ ] Session expires while filling out manual entry form — save fails, redirected to login with form data preserved
- [ ] Pasting extremely long text (50K+ chars) into description field — truncated or rejected
- [ ] Editing an entry in one tab while deleting it in another — edit fails with clear error

---

### 6.2 Active Timer (Global Component)

**PAGE:** Active Timer Bar — _(global persistent component)_
**PREREQUISITES:** Authenticated user, a timer has been started on a task

**HAPPY PATH:**
- [ ] Timer bar is visible on all pages when a timer is running
- [ ] Timer shows: current task name, project name, elapsed time (updating in real-time)
- [ ] "Stop" button stops the timer and creates a time entry
- [ ] "Discard" button stops without saving an entry
- [ ] Timer persists across page navigation
- [ ] Timer persists if browser is closed and reopened (server-side timer)

**VALIDATION:**
- [ ] N/A — button-based interactions

**EMPTY STATE:**
- [ ] No active timer — timer bar is hidden

**ERROR STATE:**
- [ ] Failed stop shows error and keeps timer running (no data loss)
- [ ] Network error during timer operation shows offline banner

**LOADING STATE:**
- [ ] Stop action shows brief loading before confirming
- [ ] Timer continues counting during network requests

**SECURITY:**
- [ ] Timer state is per-user (server-side)
- [ ] Cannot start a timer on another user's task

**MOBILE:**
- [ ] Timer bar is visible and usable on mobile
- [ ] Timer bar doesn't overlap critical content
- [ ] Stop/discard buttons are tap-friendly

**EDGE CASES:**
- [ ] Starting a new timer while another is running — old timer auto-pauses and saves partial entry
- [ ] Timer running for 24+ hours — display format handles large durations
- [ ] Timer on a task that gets deleted while timer is running
- [ ] Timer on a project that gets completed/cancelled while timer is running
- [ ] Browser tab inactive for hours — timer still accurate on return
- [ ] Starting a timer on a task in a completed project — should be blocked
- [ ] Multiple browser tabs — timer state consistent across tabs

---

## 7. Authenticated Pages — Invoicing

### 7.1 Invoice List `/invoices`

**PAGE:** Invoice List — `/invoices`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] All invoices displayed with status filters
- [ ] Each invoice shows: number, client name, amount, date issued, due date, status badge
- [ ] Status badges: Draft, Sent, Paid, Overdue, Partial
- [ ] Filter by status works
- [ ] Filter by client works
- [ ] Search by invoice number works
- [ ] "Create New Invoice" navigates to `/invoices/new`
- [ ] Clicking an invoice navigates to `/invoices/:id`

**VALIDATION:**
- [ ] Filter and search inputs handle special characters safely

**EMPTY STATE:**
- [ ] No invoices shows "No invoices yet" with CTA
- [ ] Filter with no results shows "No invoices match your filters"

**ERROR STATE:**
- [ ] Failed load shows error with retry

**LOADING STATE:**
- [ ] Invoice list shows skeleton
- [ ] Filter changes show loading

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's invoices

**MOBILE:**
- [ ] Invoice list adapts to mobile layout
- [ ] Status badges are readable on small screens
- [ ] Filters accessible on mobile

**EDGE CASES:**
- [ ] Invoice overdue status auto-updates when due_date passes
- [ ] 500+ invoices — pagination and performance
- [ ] Invoice amounts in different display formats (commas, decimals)
- [ ] Very long client names — truncation

---

### 7.2 Invoice Detail `/invoices/:id`

**PAGE:** Invoice Detail — `/invoices/:id`
**PREREQUISITES:** Authenticated user, existing invoice owned by user

**HAPPY PATH:**
- [ ] Invoice displays: number, from (business profile), to (client), line items, subtotal, tax, total, payments, balance due, status
- [ ] Edit button works (only for Draft invoices)
- [ ] "Send by Email" sends the invoice to client's email and sets status to Sent
- [ ] "Export PDF" downloads a PDF of the invoice
- [ ] "Record Payment" opens payment form (amount, date, method, notes)
- [ ] Full payment sets status to "Paid"
- [ ] Partial payment sets status to "Partial"
- [ ] Payment instructions and notes display correctly

**VALIDATION:**
- [ ] Cannot edit a Sent/Paid/Overdue invoice ("Sent invoices cannot be edited")
- [ ] Cannot send an already-sent invoice ("This invoice has already been sent")
- [ ] Payment amount must be positive
- [ ] Payment amount cannot exceed balance_due
- [ ] Cannot send without business profile completed (name + payment instructions)

**EMPTY STATE:**
- [ ] Invoice with no payments — payments section shows "No payments recorded"

**ERROR STATE:**
- [ ] Invoice not found shows 404
- [ ] Unauthorized access shows 403
- [ ] Failed send shows error (email delivery issue)
- [ ] Failed PDF export shows error
- [ ] Failed payment recording shows error

**LOADING STATE:**
- [ ] Invoice page shows skeleton while loading
- [ ] Send action shows loading state
- [ ] PDF export shows loading/generating indicator
- [ ] Payment recording shows loading on save

**SECURITY:**
- [ ] Requires authentication and invoice ownership
- [ ] Cannot view another user's invoices
- [ ] PDF export is authenticated
- [ ] Email send uses server-side (not client-side) email dispatch
- [ ] Rate limit: 5 invoice email sends per hour

**MOBILE:**
- [ ] Invoice detail is readable on mobile
- [ ] Line items table scrolls horizontally or adapts layout
- [ ] PDF export works on mobile (download or share)

**EDGE CASES:**
- [ ] Invoice with 50+ line items — display and PDF layout
- [ ] Recording multiple partial payments until fully paid
- [ ] Overpayment attempt (amount > balance_due) — blocked
- [ ] Invoice with 0% tax rate — tax line hidden or shows $0
- [ ] Currency formatting (USD, EUR, GBP, etc.)
- [ ] Sending invoice when client has no email — error or prompt
- [ ] Deleting a draft invoice — unlinks time entries (is_invoiced = false), unlinks milestones
- [ ] Viewing a Sent invoice for a now-deleted project — retained for accounting
- [ ] Double-clicking "Send by Email" does not send the invoice twice
- [ ] Double-clicking "Record Payment" does not record payment twice
- [ ] Double-clicking "Export PDF" does not trigger two downloads
- [ ] Recording a payment in one tab while viewing the same invoice in another — second tab shows stale balance until refresh
- [ ] Session expires while recording a payment — payment fails, redirected to login

---

### 7.3 New Invoice `/invoices/new`

**PAGE:** New Invoice — `/invoices/new`
**PREREQUISITES:** Authenticated user, at least one client with a project, business profile set up

**HAPPY PATH:**
- [ ] Invoice wizard: Step 1 — select client
- [ ] Step 2 — select project
- [ ] Step 3 — choose billing source:
  - Hourly project: shows unbilled time entries, select all or pick individual
  - Fixed-price project: shows uninvoiced milestones, select milestones
- [ ] Each selected item becomes a line item (description, quantity, unit price, amount)
- [ ] Add/edit/remove custom line items
- [ ] Tax rate pre-filled from business profile, editable
- [ ] Payment terms pre-filled from client defaults
- [ ] Notes field available
- [ ] Preview shows calculated total
- [ ] "Save as Draft" creates the invoice
- [ ] Invoice number auto-generated from business profile settings

**VALIDATION:**
- [ ] Must select a client
- [ ] Must select a project
- [ ] At least one line item required
- [ ] Invoice total must be positive
- [ ] Custom line item: description required, quantity and unit_price must be positive
- [ ] Tax rate must be non-negative

**EMPTY STATE:**
- [ ] No clients — shows "Create a client first" message
- [ ] No projects for selected client — shows "Create a project first"
- [ ] Hourly project with no unbilled entries — shows "No unbilled time entries" with option to add custom lines
- [ ] Fixed-price project with no uninvoiced milestones — shows "No milestones to invoice"
- [ ] Project with nothing to invoice — blocked with message "Track time or complete milestones first"

**ERROR STATE:**
- [ ] Failed save shows error and preserves form data
- [ ] Validation errors shown inline

**LOADING STATE:**
- [ ] Client/project selection shows loading while fetching data
- [ ] Time entries/milestones load after project selection
- [ ] Save as Draft shows loading on button

**SECURITY:**
- [ ] Requires authentication
- [ ] Can only select own clients and projects
- [ ] Cannot include another user's time entries or milestones
- [ ] Business profile must be complete before sending (not creating as draft)

**MOBILE:**
- [ ] Wizard steps work on mobile
- [ ] Line item editing is usable on mobile
- [ ] Total preview is visible on mobile

**EDGE CASES:**
- [ ] Creating invoice for project with mixed billable/non-billable time — only billable entries shown
- [ ] Time entries from different hourly rates (rate changed mid-project)
- [ ] Rounding in line item calculations (quantity × unit_price = amount)
- [ ] Auto-generated invoice number collision (concurrent creation)
- [ ] Navigating away mid-wizard — data loss warning ("You have unsaved changes. Leave page?")
- [ ] Fixed-price project with some milestones already invoiced — only shows uninvoiced
- [ ] Very large invoice (100+ time entries as line items) — performance
- [ ] Double-clicking "Save as Draft" does not create two draft invoices
- [ ] Browser back button mid-wizard — goes to previous wizard step (not loses all data)
- [ ] Browser refresh mid-wizard — data loss warning, wizard resets to step 1
- [ ] Session expires mid-wizard at step 3 — save fails, redirected to login, wizard data lost (acceptable with clear messaging)
- [ ] Opening `/invoices/new` in two tabs and saving both — second save creates a different invoice number (no collision)
- [ ] Pasting 10,000+ characters into invoice notes field — truncated or rejected
- [ ] Selecting time entries in wizard, then another user (other tab) deletes one — save handles missing entry gracefully
- [ ] Browser forward button after completing wizard — does not re-create the invoice

---

### 7.4 Business Profile `/settings/business`

**PAGE:** Business Profile — `/settings/business`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Form displays: business name, address, logo, payment instructions, default tax rate, default currency, invoice number prefix, next invoice number
- [ ] Editing and saving each field works
- [ ] Logo upload displays preview
- [ ] Currency selection dropdown works
- [ ] Invoice number prefix + next number preview shows what the next invoice number will look like

**VALIDATION:**
- [ ] Tax rate must be non-negative
- [ ] Currency must be valid ISO 4217 code
- [ ] Logo upload: image files only, reasonable size limit
- [ ] Invoice number prefix max length

**EMPTY STATE:**
- [ ] New user with no business profile — all fields empty with placeholder guidance
- [ ] Incomplete profile shows warning about needing name + payment instructions before sending invoices

**ERROR STATE:**
- [ ] Failed save shows error
- [ ] Failed logo upload shows error

**LOADING STATE:**
- [ ] Form shows loading while fetching current profile
- [ ] Save shows loading indicator
- [ ] Logo upload shows progress

**SECURITY:**
- [ ] Requires authentication
- [ ] Each user has exactly one business profile
- [ ] Cannot access another user's business profile

**MOBILE:**
- [ ] Form is usable on mobile
- [ ] Logo upload works on mobile (camera/gallery)

**EDGE CASES:**
- [ ] Uploading a very large logo image — file size validation
- [ ] Changing currency after invoices exist — affects only new invoices
- [ ] Changing invoice number prefix — next invoice uses new prefix
- [ ] Setting next_invoice_number to a lower value — potential duplicate numbers
- [ ] Double-clicking save does not submit the form twice
- [ ] Pasting 50,000+ characters into payment instructions — truncated or rejected
- [ ] Pasting rich text (HTML) into address or payment instructions — stripped safely
- [ ] Browser refresh mid-edit — unsaved changes lost (acceptable) or preserved
- [ ] Editing business profile in two tabs — last save wins, no corruption

---

## 8. Authenticated Pages — Calendar

### 8.1 Calendar `/calendar`

**PAGE:** Calendar — `/calendar`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Monthly calendar view displays by default
- [ ] Weekly calendar view available
- [ ] Task due dates shown on correct dates, color-coded by client
- [ ] Project deadlines shown
- [ ] Blocked-out time (vacations, personal days) visible
- [ ] Navigating between months/weeks works
- [ ] Clicking a deadline navigates to the task or project
- [ ] Adding blocked time works

**VALIDATION:**
- [ ] Blocked time: start date required, end date >= start date

**EMPTY STATE:**
- [ ] Month with no deadlines or events shows empty calendar grid
- [ ] No blocked time — calendar shows only task/project deadlines

**ERROR STATE:**
- [ ] Failed calendar load shows error with retry
- [ ] Failed blocked time save shows error

**LOADING STATE:**
- [ ] Calendar shows skeleton while loading events
- [ ] Month/week navigation shows loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Only shows current user's data

**MOBILE:**
- [ ] Calendar adapts to mobile (possibly list view instead of grid)
- [ ] Touch-based navigation between months/weeks
- [ ] Events are tappable on mobile

**EDGE CASES:**
- [ ] Day with 10+ events — overflow handling ("+5 more" expansion)
- [ ] Tasks spanning across months
- [ ] Timezone changes — deadlines render in user's timezone
- [ ] Leap year dates
- [ ] Blocked time overlapping with deadlines — both visible

---

## 9. Authenticated Pages — Settings

### 9.1 Account Settings `/settings/account`

**PAGE:** Account Settings — `/settings/account`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Current name and email displayed
- [ ] Change name saves successfully
- [ ] Change email sends verification to new email, updates after verification
- [ ] Change password (requires current password + new password) works
- [ ] All other sessions are invalidated after password change
- [ ] "Delete Account" button initiates account deletion flow

**VALIDATION:**
- [ ] Name required
- [ ] New email must be valid format
- [ ] New email must not already be registered
- [ ] Current password required for password change
- [ ] New password meets complexity requirements (8+ chars, uppercase, lowercase, number)
- [ ] New password cannot be same as current password (optional but good practice)

**EMPTY STATE:**
- [ ] N/A — profile always has data

**ERROR STATE:**
- [ ] Wrong current password shows error
- [ ] Duplicate email shows error
- [ ] Failed save shows error

**LOADING STATE:**
- [ ] Save buttons show loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Password change requires current password
- [ ] Email change requires verification
- [ ] Session invalidation on password change
- [ ] Account deletion requires confirmation (double confirmation)

**MOBILE:**
- [ ] Form is usable on mobile

**EDGE CASES:**
- [ ] Changing email to one that has a pending sign-up
- [ ] Deleting account with active projects and unpaid invoices — cascade warning
- [ ] Account deletion within 30-day grace period — all data hard-deleted
- [ ] Double-clicking "Change Password" does not fire two password change requests
- [ ] Double-clicking "Delete Account" does not bypass confirmation dialogs
- [ ] Session expires while changing password — change fails, redirected to login
- [ ] Password change in one tab invalidates session in another tab immediately
- [ ] Browser back button after successful email change — does not undo the change

---

### 9.2 Notification Settings `/settings/notifications`

**PAGE:** Notification Settings — `/settings/notifications`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Notification types displayed with toggles
- [ ] Deadline reminders: on/off toggle + advance time setting
- [ ] Overdue invoice reminders: on/off toggle
- [ ] Channel selection: email, in-app
- [ ] Quiet hours setting works
- [ ] Saving preferences persists across sessions

**VALIDATION:**
- [ ] Quiet hours: start time must be before end time (or handle overnight ranges)
- [ ] Advance reminder must be positive number

**EMPTY STATE:**
- [ ] Default settings shown for new users

**ERROR STATE:**
- [ ] Failed save shows error

**LOADING STATE:**
- [ ] Settings show loading while fetching current preferences
- [ ] Save shows loading indicator

**SECURITY:**
- [ ] Requires authentication
- [ ] Can only modify own notification preferences

**MOBILE:**
- [ ] Toggle switches are usable on mobile
- [ ] Form is scrollable on mobile

**EDGE CASES:**
- [ ] Disabling all notifications — confirm with user
- [ ] Changing timezone after notifications are scheduled — recalculation

---

### 9.3 Search `/search?q=`

**PAGE:** Search — `/search?q=`
**PREREQUISITES:** Authenticated user

**HAPPY PATH:**
- [ ] Full-text search returns results grouped by type (clients, projects, tasks, notes)
- [ ] Clicking a result navigates to the appropriate page
- [ ] Search query is reflected in the URL parameter
- [ ] Results are relevant and ranked meaningfully

**VALIDATION:**
- [ ] Empty search query shows prompt to enter search term
- [ ] Very long search query is truncated or handled gracefully

**EMPTY STATE:**
- [ ] No results shows "No results found for [query]" with suggestions

**ERROR STATE:**
- [ ] Failed search shows error with retry

**LOADING STATE:**
- [ ] Results area shows loading indicator while searching
- [ ] Debounced search (if live search) — doesn't fire on every keystroke

**SECURITY:**
- [ ] Requires authentication
- [ ] Only returns current user's data
- [ ] Search query is sanitized (no SQL injection via search)
- [ ] XSS prevention in search results display

**MOBILE:**
- [ ] Search is accessible and usable on mobile
- [ ] Results are readable on mobile

**EDGE CASES:**
- [ ] Search with special characters (`%`, `_`, `"`, `'`, `\`)
- [ ] Search in different languages / Unicode characters
- [ ] Search returns 1000+ results — pagination
- [ ] Searching for deleted/archived items — included or excluded?
- [ ] Search while data is being created/modified (eventual consistency)

---

## 10. Cross-Page Flows

These test end-to-end journeys that span multiple pages.

### 10.1 New User Onboarding Flow

- [ ] Sign up → email verification → dashboard (empty state) → create first client → create first project → add first task → start first timer
- [ ] Verify all onboarding prompts appear at the right time and disappear after completion
- [ ] Verify business profile setup prompt appears and links correctly

### 10.2 Complete Project Lifecycle

- [ ] Create client → create project (hourly) → add tasks → track time → complete tasks → create invoice → send invoice → record payment → mark project completed
- [ ] Verify all status transitions and side effects at each step

### 10.3 Fixed-Price Project Lifecycle

- [ ] Create client → create fixed-price project → add milestones → complete milestones → invoice milestones → record payment → complete project
- [ ] Verify milestones transition: pending → completed → invoiced

### 10.4 Daily Workflow

- [ ] Login → today view → start timer on task → work → stop timer → drag task to new status → check off subtasks → log additional manual time → review hours in /time
- [ ] Verify timer bar persists across all pages visited

### 10.5 Invoice Lifecycle

- [ ] Track time on hourly project → go to /invoices/new → select client/project → select time entries → review line items → save as draft → preview → edit draft → send → record partial payment → wait for overdue trigger → record remaining payment → status becomes Paid
- [ ] Verify time entries are locked after invoice is sent
- [ ] Verify invoice cannot be edited after sending

### 10.6 Client Portal Sharing

- [ ] Create project → generate portal token → copy portal URL → open in incognito/different browser → verify read-only view → upload file from portal → verify file appears in project's file list
- [ ] Verify portal reflects live project status changes

### 10.7 Password Reset Flow

- [ ] Forgot password → enter email → receive email → click link → set new password → login with new password → verify old password no longer works → verify all other sessions invalidated

### 10.8 Session Expiration During Work

- [ ] Start working on a form → session expires → submit form → redirected to login with return URL preserved → login → form data restored from localStorage → resubmit successfully

### 10.9 Multi-Client, Multi-Project Navigation

- [ ] Create 3 clients with 2 projects each → verify dashboard shows correct counts → filter project list by client → verify cross-project task list filters correctly → verify calendar shows deadlines from all projects color-coded by client

### 10.10 Template Workflow

- [ ] Create project with tasks → create template from project → create new project from template → verify all tasks and structure are duplicated → modify new project without affecting template

---

## 11. Security Tests

### 11.1 Authentication

- [ ] Unauthenticated access to any `/dashboard`, `/clients`, `/projects`, `/tasks`, `/time`, `/invoices`, `/calendar`, `/settings/*` redirects to `/login`
- [ ] Session cookie is HTTP-only, Secure, and SameSite=Strict
- [ ] Session expires after 7 days of idle time
- [ ] Session has 30-day absolute maximum lifetime
- [ ] Password change invalidates all other sessions
- [ ] Login issues a new session ID (no session fixation)
- [ ] Expired session mid-action redirects to login with return URL preserved

### 11.2 Authorization (IDOR / Data Isolation)

- [ ] User A cannot view User B's clients by guessing client ID in URL
- [ ] User A cannot view User B's projects by guessing project ID in URL
- [ ] User A cannot view User B's tasks by guessing task ID in URL
- [ ] User A cannot view User B's time entries by guessing entry ID in URL
- [ ] User A cannot view User B's invoices by guessing invoice ID in URL
- [ ] User A cannot view User B's business profile
- [ ] User A cannot view User B's templates
- [ ] User A cannot edit/delete User B's data via direct API calls
- [ ] User A cannot start a timer on User B's task via API
- [ ] User A cannot record a payment on User B's invoice via API
- [ ] All API endpoints validate `user_id` ownership before returning or modifying data

### 11.3 Rate Limiting

- [ ] `POST /login` — 5 attempts per 15 minutes per IP, then 429 response
- [ ] `POST /signup` — 3 attempts per hour per IP, then 429 response
- [ ] `POST /forgot-password` — 3 attempts per hour per email, then 429 response
- [ ] General API — 100 requests per minute per user, then 429 response
- [ ] File upload — 10 uploads per hour per user, then 429 response
- [ ] Invoice email sending — 5 sends per hour per user, then 429 response
- [ ] Rate limit response includes retry-after information

### 11.4 Input Validation & Injection

- [ ] SQL injection attempts in all text inputs (name, search, description, notes) are safely handled
- [ ] XSS payloads in all text fields are sanitized on render (`<script>`, `onerror`, `javascript:`)
- [ ] XSS via file names (uploaded file named `<script>alert(1)</script>.pdf`)
- [ ] CSRF tokens present on all state-changing forms and API requests
- [ ] Content-Security-Policy headers are set
- [ ] File upload only allows whitelisted MIME types (images, PDFs, docs)
- [ ] File upload rejects files > 25 MB with clear error
- [ ] JSON request bodies with unexpected fields are ignored or rejected
- [ ] Path traversal in file names is prevented (e.g., `../../etc/passwd`)

### 11.5 Token Security

- [ ] Password reset tokens are cryptographically random
- [ ] Password reset tokens are single-use
- [ ] Password reset tokens expire after 1 hour
- [ ] Client portal tokens are revocable
- [ ] Client portal tokens cannot be used to escalate to authenticated access
- [ ] Used/expired tokens return appropriate error messages (not stack traces)

### 11.6 Data Protection

- [ ] All traffic is over HTTPS
- [ ] HSTS header is enabled
- [ ] Passwords are never returned in any API response
- [ ] Passwords are never logged
- [ ] Files are served through authenticated endpoints (not direct storage URLs)
- [ ] File URLs are signed and time-limited
- [ ] Sensitive data (tokens, passwords) not exposed in browser URL bar or history
- [ ] API error responses don't leak internal implementation details (stack traces, DB structure)

---

## 12. Destructive Actions

### 12.1 Client Deletion

- [ ] Archiving a client sets `is_archived = true` (soft delete)
- [ ] Hard delete requires confirmation dialog
- [ ] Deleting a client with active projects shows warning ("X active projects. Archiving recommended.")
- [ ] Deleting a client with unpaid invoices shows warning ("$X in outstanding invoices")
- [ ] Hard delete cascades: all projects → tasks → subtasks → time entries → milestones → file attachments → draft invoices
- [ ] Sent/Paid invoices are retained (orphaned with client info snapshot) after client deletion
- [ ] Confirmation requires double-confirmation for destructive cascade

### 12.2 Project Deletion

- [ ] Projects can be soft-deleted (status → Cancelled or Completed)
- [ ] Hard delete available from archived/cancelled state
- [ ] Hard delete cascades: tasks → subtasks → time entries → milestones → project-level files → task dependencies
- [ ] Draft invoices on the project are deleted
- [ ] Sent/Paid invoices are retained for accounting
- [ ] Running timers on the project are stopped before deletion

### 12.3 Task Deletion

- [ ] Task deletion is hard delete with cascade warning
- [ ] If task has time entries: warning "X hours of tracked time will be unlinked"
- [ ] Cascades: subtasks, task dependencies (both directions), task-level files
- [ ] Time entries are retained but unlinked (orphaned)
- [ ] Running timer on the task is stopped

### 12.4 Invoice Deletion

- [ ] Only Draft invoices can be deleted
- [ ] Sent/Paid/Overdue invoices cannot be deleted — action blocked with explanation
- [ ] Deleting a draft invoice: unlinks time entries (`is_invoiced = false`), unlinks milestones (status back to `completed`)
- [ ] Confirmation required before draft deletion

### 12.5 Time Entry Deletion

- [ ] Requires confirmation
- [ ] Cannot delete if `is_invoiced = true` — action blocked with message mentioning invoice number
- [ ] Deletion is permanent (hard delete)

### 12.6 Account Deletion

- [ ] Requires confirmation (double confirmation)
- [ ] Cascades to ALL user data: clients → projects → tasks → subtasks → time entries → milestones → invoices → payments → files → notifications → business profile → templates
- [ ] Hard-deleted within 30 days
- [ ] User cannot log in after deletion request
- [ ] Deletion is GDPR-compliant (all personal data removed)

### 12.7 Template Deletion

- [ ] Requires confirmation
- [ ] Does not affect projects that were created from the template

---

## 13. Performance Tests

### 13.1 Page Load Performance

- [ ] Dashboard loads within 2 seconds with 50+ active projects
- [ ] Client list loads within 2 seconds with 200+ clients
- [ ] Project board loads within 2 seconds with 100+ tasks
- [ ] Task list loads within 2 seconds with 500+ tasks across projects
- [ ] Time entries page loads within 2 seconds with 1000+ entries
- [ ] Invoice list loads within 2 seconds with 200+ invoices
- [ ] Calendar loads within 2 seconds with 100+ events in a month
- [ ] Search results return within 1 second

### 13.2 API Response Times

- [ ] All CRUD API endpoints respond within 500ms under normal load
- [ ] List endpoints with pagination respond within 500ms
- [ ] Full-text search responds within 1 second
- [ ] Invoice PDF generation completes within 5 seconds
- [ ] File upload completes within 10 seconds for 25 MB file

### 13.3 Large Data Sets

- [ ] User with 100 clients, 500 projects, 5000 tasks — app remains responsive
- [ ] Project board with 200 tasks in one column — scrolling is smooth
- [ ] Invoice with 100+ line items — renders and exports to PDF without issues
- [ ] Calendar month with 50+ events — renders without overlap issues
- [ ] Time entries export for a full year — export completes successfully

### 13.4 Concurrent Operations

- [ ] Two tabs open on the same project board — changes in one reflect in the other (or don't cause conflicts)
- [ ] Starting a timer in one tab — timer bar appears in other tabs
- [ ] Editing the same task in two tabs — last write wins or conflict detection

### 13.5 Slow/Unreliable Connections

- [ ] Pages load progressively on slow 3G connection
- [ ] Offline banner appears when connection is lost
- [ ] Actions queued during offline period sync when reconnected (or show clear errors)
- [ ] Request timeout after 3 seconds → auto-retry once → show timeout error

### 13.6 Database Performance

- [ ] Queries use indexes as designed (no full table scans on common operations)
- [ ] Dashboard aggregate queries (count projects, sum invoices) are optimized
- [ ] Today view query (tasks due today across all projects) uses proper indexes
- [ ] Time entries query with date range filter uses proper indexes

---

## 14. Real User Behavior Tests

These tests cover cross-cutting "what a real person would actually do" patterns
that apply across the entire application. They exist because real users don't
follow scripts — they double-click, hit back, paste from Word, lose Wi-Fi,
and open 12 tabs.

---

### 14.1 Double-Click & Rapid Re-Submit

Every form submission and destructive action must be idempotent or guarded.

**Forms (every form in the app):**
- [ ] Double-clicking any submit/save button does not create duplicate records or fire duplicate API calls
- [ ] Verify on: Sign Up, Log In, Forgot Password, Reset Password, Create Client, Edit Client, Create Project, Edit Project, Create Task, Edit Task, Log Time (manual entry), Create Invoice (Save as Draft), Record Payment, Business Profile save, Account Settings save, Notification Settings save, Add Subtask, Add Blocked Time
- [ ] Submit button is disabled or shows spinner after first click, re-enabled on response
- [ ] Keyboard Enter key in a form behaves the same as clicking submit (not double-fire)

**Destructive actions:**
- [ ] Double-clicking "Delete" on a confirmation dialog does not delete twice or throw an error
- [ ] Double-clicking "Archive" does not toggle archive on/off
- [ ] Double-clicking "Send Invoice" does not send the email twice
- [ ] Double-clicking "Stop Timer" does not create two time entries
- [ ] Rapid-clicking task checkboxes (Today view, subtasks) — each click is debounced, final state is correct

**Links and navigation:**
- [ ] Double-clicking a navigation link does not push the same route twice onto history
- [ ] Rapid-clicking project cards / client cards does not open multiple detail pages

---

### 14.2 Browser Back Button

**After successful form submission:**
- [ ] Back button after Sign Up → does not show the sign-up form pre-filled (or re-submit)
- [ ] Back button after Log In → does not show the login form (redirects to dashboard)
- [ ] Back button after Create Client → goes to client list, not re-creates the client
- [ ] Back button after Create Project → goes to project list, not re-creates
- [ ] Back button after Save as Draft (invoice) → goes to invoice list, not re-creates
- [ ] Back button after Record Payment → goes to invoice detail, not re-records payment
- [ ] Back button after Password Reset → goes to login, not re-submits reset

**Mid-form / mid-wizard:**
- [ ] Back button while editing a client (unsaved changes) → "Unsaved changes" warning dialog
- [ ] Back button while editing a task (unsaved changes) → warning or auto-save
- [ ] Back button mid-invoice-wizard (Step 2 of 3) → goes to Step 1, preserving selections
- [ ] Back button at Step 1 of invoice wizard → exits wizard with "discard changes?" warning
- [ ] Back button while editing project details → warning if unsaved changes

**After destructive actions:**
- [ ] Back button after deleting a client → client list (not a 404 for the deleted client)
- [ ] Back button after archiving a client → client list (archived client not in active view)
- [ ] Back button after deleting a task → project board/list (not a 404)
- [ ] Back button after deleting a time entry → time entries list

**Modal/panel behavior:**
- [ ] Back button while task detail modal is open → closes modal (not navigates away from project)
- [ ] Back button while confirmation dialog is open → closes dialog (not navigates)
- [ ] Forward button after closing a modal via back → re-opens modal (or is a no-op)

---

### 14.3 Browser Refresh (F5 / Ctrl+R)

- [ ] Refresh on dashboard → reloads data, no errors
- [ ] Refresh on project board → reloads board state from server (not stale client-side cache)
- [ ] Refresh while editing a client form → unsaved changes lost, form reloads from server data (acceptable)
- [ ] Refresh while typing in task description → unsaved text lost, no error
- [ ] Refresh mid-invoice-wizard → wizard resets to step 1 (data lost is acceptable, no error state)
- [ ] Refresh while timer is running → timer bar reappears with correct elapsed time (server-side)
- [ ] Refresh while a file upload is in progress → upload cancelled, no partial file, no error on reload
- [ ] Refresh on search results page → search query preserved in URL, results reload
- [ ] Refresh on filtered views (client list, project list, task list) → filters preserved in URL params

---

### 14.4 Multi-Tab Usage

**Simultaneous editing:**
- [ ] Edit the same client in Tab A and Tab B → save in Tab A → Tab B still shows stale data → save in Tab B → overwrites Tab A's changes (last-write-wins is acceptable, no crash)
- [ ] Edit the same task in Tab A and Tab B → same behavior, no data corruption
- [ ] Edit business profile in two tabs → no corruption
- [ ] Change account settings (name) in one tab, refresh the other → other tab shows updated name

**Create in one tab, view in another:**
- [ ] Create a client in Tab A → refresh client list in Tab B → new client appears
- [ ] Start a timer in Tab A → Tab B shows timer bar on next navigation (or live via polling/websocket)
- [ ] Stop a timer in Tab A → Tab B timer bar disappears on next interaction

**Delete in one tab, view in another:**
- [ ] Delete a client in Tab A → Tab B still shows client detail → click "Edit" in Tab B → 404 error
- [ ] Delete a task in Tab A → Tab B still shows task in board → drag it → error toast, card removed
- [ ] Archive a project in Tab A → Tab B still shows project list → refresh → project moved to archived
- [ ] Delete a time entry in Tab A → Tab B still shows it in list → click edit → error

**Session-affecting actions across tabs:**
- [ ] Change password in Tab A → Tab B's next API call returns 401 → Tab B redirects to login
- [ ] Log out in Tab A → Tab B's next API call returns 401 → Tab B redirects to login
- [ ] Delete account in Tab A → Tab B's next API call returns 401

**Invoice concurrency:**
- [ ] Create invoice in Tab A and Tab B simultaneously → each gets a unique invoice number
- [ ] Record payment in Tab A → Tab B shows stale balance → record overlapping payment in Tab B → error "payment exceeds balance" or last-write-wins safely

---

### 14.5 Session Expiration Mid-Action

- [ ] Session expires while typing in a client edit form → click save → 401 → redirect to login with return URL → log in → return to client edit (form data gone, acceptable)
- [ ] Session expires while filling out invoice wizard at step 3 → click save → 401 → redirect to login → log in → wizard must restart (data lost, acceptable with clear messaging)
- [ ] Session expires while a file upload is in progress → upload fails → error message → redirect to login
- [ ] Session expires while dragging a task on board → drop fires API call → 401 → card reverts → redirect to login
- [ ] Session expires while timer is running → timer is server-side so it continues → on re-login timer is still active
- [ ] Session expires while recording a payment → payment fails → redirect to login → payment not recorded (no partial state)
- [ ] Session expires while changing password → password change fails → redirect to login → old password still works
- [ ] Idle timeout warning: show "Session expiring in 5 minutes" banner (if implemented)
- [ ] After session expiry redirect to login, the return URL correctly deep-links back to the exact page the user was on

---

### 14.6 Paste Extremely Long Text

Test every text input with 50,000+ characters pasted from clipboard.

**Short text fields (names, emails, titles):**
- [ ] Client name field (max 200 chars): paste 50K chars → truncated or rejected with clear message, browser doesn't freeze
- [ ] Project name field (max 200 chars): same behavior
- [ ] Task title field (max 500 chars): same behavior
- [ ] Email field: paste very long string → validation catches it
- [ ] Search field: paste 10K chars → search truncated or rejected, no server error

**Long text fields (descriptions, notes):**
- [ ] Task description: paste 100K chars → either accepted (with reasonable DB limit) or rejected with max-length error, no browser freeze
- [ ] Client notes: paste 50K chars → same behavior
- [ ] Invoice notes: paste 50K chars → same behavior
- [ ] Business profile payment instructions: paste 50K chars → same behavior
- [ ] Time entry description: paste 50K chars → same behavior

**Rich text and special content:**
- [ ] Paste text from Microsoft Word (contains hidden HTML/XML formatting) → stripped to plain text or safely rendered
- [ ] Paste text from Google Docs → same behavior
- [ ] Paste text containing HTML tags (`<b>bold</b>`, `<script>alert(1)</script>`) → sanitized, XSS prevented
- [ ] Paste text containing markdown → rendered as markdown (if field supports it) or shown literally
- [ ] Paste containing only whitespace/newlines → treated as empty or minimal content
- [ ] Paste containing null bytes (`\0`) → stripped, no server error
- [ ] Paste containing emoji (🎉🚀💰) → accepted and displayed correctly
- [ ] Paste containing RTL text (Arabic: مرحبا, Hebrew: שלום) → displayed correctly, layout doesn't break
- [ ] Paste containing zalgo text (ẗ̶̢̧̛̫̣̥̹̝̮̳̙̙̮̭̤̰̰̮̻̣̲̙̯̘̟̻̹͉̫́h̵̡̛̟̣̲̘̃̇̃̈̋̔̐̽̈́i̶s̶) → accepted, displayed correctly, doesn't break layout

---

### 14.7 Keyboard Navigation & Shortcuts

- [ ] Tab key cycles through all form fields in logical order on every form
- [ ] Shift+Tab moves backwards through fields
- [ ] Enter key submits the currently focused form (where appropriate)
- [ ] Escape key closes open modals (task detail, confirmation dialogs, dropdown menus)
- [ ] Escape key cancels in-progress edits (inline editing) without saving
- [ ] Focus is trapped inside open modals (Tab does not cycle to background elements)
- [ ] Focus returns to the trigger element after a modal is closed
- [ ] Dropdown menus are navigable with arrow keys
- [ ] Date pickers are keyboard-accessible
- [ ] Confirmation dialogs are focusable and dismissable with keyboard (Enter to confirm, Escape to cancel)
- [ ] Skip-to-content link exists for keyboard/screen reader users
- [ ] No keyboard traps anywhere in the app (user can always Tab away)

---

### 14.8 File Upload Edge Cases

- [ ] Drag-and-drop file upload works (not just click-to-browse)
- [ ] Drag a file over the drop zone → visual highlight/indicator
- [ ] Drop a file outside the drop zone → nothing happens (no navigation, no error)
- [ ] Upload a 0-byte (empty) file → rejected with clear error
- [ ] Upload a file with a very long filename (255+ characters) → truncated or rejected
- [ ] Upload a file with Unicode characters in filename (日本語.pdf) → handled correctly
- [ ] Upload a file with special characters in filename (`file (1).pdf`, `file&name.doc`) → handled correctly
- [ ] Upload multiple files simultaneously (if supported) → all upload with correct progress
- [ ] Cancel an upload mid-progress → upload stops, no partial file saved, UI resets
- [ ] Upload with slow connection → progress bar updates accurately, no timeout before 25 MB is done
- [ ] Upload a file that passes client-side checks but fails server-side validation → clear error, UI resets
- [ ] Upload the same file twice → second upload succeeds with a unique name or replaces with confirmation
- [ ] Drag-and-drop a folder → rejected gracefully (not silent failure or crash)
- [ ] Paste a screenshot from clipboard into a file upload area (if supported)

---

### 14.9 URL Manipulation & Deep Links

- [ ] Manually type a non-existent route (e.g., `/nonexistent`) → 404 page
- [ ] Manually type a valid resource with a non-existent ID (e.g., `/clients/999999`) → 404
- [ ] Manually type a string where a numeric ID is expected (e.g., `/clients/abc`) → 404 or redirect
- [ ] Manually type a negative ID (e.g., `/clients/-1`) → 404
- [ ] Manually type a float ID (e.g., `/clients/1.5`) → 404
- [ ] Manually type a SQL injection in the URL (e.g., `/clients/1;DROP TABLE users`) → safe 404
- [ ] Bookmark a project board URL → revisiting later loads correctly (if still authenticated and authorized)
- [ ] Share a deep link via email/chat → recipient can access if authenticated, redirected to login if not
- [ ] Bookmark a task modal URL → revisiting opens the correct task in the correct project
- [ ] Access a URL for a resource the user previously had access to but was deleted → 404

---

### 14.10 Print & Export

- [ ] Print (Ctrl+P) on invoice detail → print layout is readable (no navigation, no timer bar, just invoice content)
- [ ] Print on any other page → reasonable print output (no broken layouts)
- [ ] PDF export of invoice → matches on-screen invoice, correct totals, readable formatting
- [ ] Time entry export → CSV/Excel contains all visible columns, correct data, proper encoding for Unicode
- [ ] Export with filters applied → only exports filtered results (not all data)

---

### 14.11 Browser & Device Edge Cases

- [ ] 200% browser zoom → layout remains usable, no overlapping elements, no horizontal scroll on main content
- [ ] 400% browser zoom → critical content still accessible (WCAG 1.4.10)
- [ ] Screen rotation on mobile (portrait → landscape → portrait) → layout adapts, no data loss, no scroll position reset
- [ ] Split-screen / multitasking on iPad → app is usable at half-width
- [ ] System dark mode preference → app respects or has its own toggle (no invisible text on dark background)
- [ ] System "reduce motion" preference → animations are reduced or disabled
- [ ] High contrast mode → text remains readable, focus indicators visible
- [ ] Very narrow viewport (320px, iPhone SE) → all critical functionality accessible
- [ ] Very wide viewport (2560px, ultrawide monitor) → layout doesn't stretch absurdly, content is readable
- [ ] Incognito/private browsing mode → app works (no reliance on localStorage for critical function)

---

### 14.12 Network Interruption Mid-Action

- [ ] Wi-Fi drops while saving a client edit → error toast "Network error, please try again", form data preserved
- [ ] Wi-Fi drops while uploading a file → upload fails, progress resets, user can retry
- [ ] Wi-Fi drops while timer is running → timer continues server-side, timer bar shows "reconnecting..." or stale time
- [ ] Wi-Fi drops while loading dashboard → partial load shows what arrived, error for failed widgets
- [ ] Wi-Fi returns after outage → pending actions auto-retry (if implemented) or user retries manually
- [ ] Airplane mode toggle during any action → no crash, no silent data loss
- [ ] Server returns 502/503 (deploy/restart) → user sees "service temporarily unavailable" not a white screen

---

### 14.13 Undo & Regret Actions

- [ ] After archiving a client → "Undo" option available (toast with undo link, or unarchive action)
- [ ] After completing a task → can revert status back to previous state
- [ ] After deleting a subtask → deletion is immediate but confirmed first (no undo for hard deletes)
- [ ] After sending an invoice → cannot unsend (status change is permanent) — this is clearly communicated before sending
- [ ] After recording a payment → payment can be deleted (if invoice is not fully paid? or always?)
- [ ] After stopping a timer → can edit the resulting time entry immediately
- [ ] After discarding a timer → time is gone (clearly warned before discard with "Are you sure?")
- [ ] Ctrl+Z in text fields → browser native undo works (not broken by custom input handlers)

---

### 14.14 Accessibility (WCAG 2.1 AA)

- [ ] All images have alt text (logos, client avatars, file thumbnails)
- [ ] All form inputs have associated labels (visible or `aria-label`)
- [ ] Error messages are announced by screen readers (`role="alert"` or `aria-live`)
- [ ] Loading states are announced by screen readers (`aria-busy`, `aria-live`)
- [ ] Color is not the only indicator of status (e.g., invoice badges have text, not just color)
- [ ] Contrast ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Focus indicators are visible on all interactive elements
- [ ] Drag-and-drop has an alternative interaction (keyboard move, dropdown status change)
- [ ] Timer display is not the only way to know a timer is running (screen reader announcement)
- [ ] Calendar has keyboard navigation and screen reader support
- [ ] Data tables have proper header associations (`scope`, `aria-labelledby`)
- [ ] Page titles are descriptive and unique per page
- [ ] Landmark regions are defined (`nav`, `main`, `aside`, `header`, `footer`)

---

*This checklist should be updated as the application evolves. Each section maps directly to the [APPLICATION-PLAN.md](./APPLICATION-PLAN.md) specification. Mark items with `[x]` as they pass testing.*
