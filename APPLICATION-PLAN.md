# TaskFlow — Application Plan

> The complete blueprint for building TaskFlow, derived from the [Product Definition](./PRODUCT-DEFINITION.md).

---

## 1. Pages

### 1.1 Public Pages (Unauthenticated)

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Landing page | `/` | Marketing page with value proposition, feature highlights, pricing, and CTA | Sign up, log in, view pricing | None (static content) |
| Sign up | `/signup` | Registration form | Create account (name, email, password) | Validation errors |
| Log in | `/login` | Email + password form | Log in, "forgot password" link | Validation errors |
| Forgot password | `/forgot-password` | Email input form | Request password reset email | Confirmation message |
| Reset password | `/reset-password/:token` | New password form | Set new password | Token validity status |
| Client portal | `/portal/:token` | Read-only project status page (shared link) | View project progress, upload files (if enabled) | Project name, task statuses, milestones, progress bar |

### 1.2 Authenticated Pages — Core Navigation

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Dashboard | `/dashboard` | Overview cards and widgets | Navigate to any section; start timer from recent tasks | Active projects count, upcoming deadlines (next 7 days), hours tracked this week, outstanding invoice total, recent activity |
| Today view | `/today` | Focused list of tasks due today or flagged for today across all projects | Check off tasks, start timer, reschedule to tomorrow | Tasks grouped by client/project, overdue tasks highlighted, active timer (if running) |

### 1.3 Authenticated Pages — Clients

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Client list | `/clients` | Card or table list of all clients | Add new client, search/filter, archive client | Client name, active project count, total outstanding invoices, status (active/archived) |
| Client detail | `/clients/:id` | Full client profile with tabs | Edit client info, add project, view invoices, archive | Contact info, notes, default hourly rate, default payment terms, list of projects, list of invoices, total hours tracked, total revenue |

### 1.4 Authenticated Pages — Projects

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Project list | `/projects` | All projects across all clients, filterable | Filter by client/status, create project, search | Project name, client name, status badge, deadline, budget progress bar |
| Project detail — Board | `/projects/:id/board` | Kanban board with columns | Drag tasks between columns, add task, edit task, start timer | Columns: To Do, In Progress, Waiting on Client, Review, Done; task cards with title, due date, priority, subtask count |
| Project detail — List | `/projects/:id/list` | Task list view (sortable table) | Sort by due date/priority/status, bulk actions | Task title, status, due date, priority, assignee (self), time logged |
| Project detail — Overview | `/projects/:id` | Project summary and settings | Edit project details, set budget, manage files, change status | Description, deadline, billing type, hourly rate or fixed price, budget (estimated vs. actual), attached files, milestone list (for fixed-price) |
| Project templates | `/templates` | List of saved project templates | Create template from project, duplicate template into new project, delete template | Template name, source project, task count, column structure |

### 1.5 Authenticated Pages — Tasks

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Cross-project task list | `/tasks` | All tasks across every project in one filterable/sortable view | Filter by client, project, status, priority, due date; sort; start timer; bulk status change | Task title, project name, client name, status, due date, priority, time logged |
| Task detail (modal/panel) | `/projects/:id/tasks/:taskId` | Full task detail in a slide-over panel or modal | Edit all fields, add subtasks, attach files, log time, add notes, start/stop timer | Title, description, status, priority, due date, subtasks (with completion), file attachments, time entries, notes/comments, blocked-by info |

### 1.6 Authenticated Pages — Time Tracking

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Time entries | `/time` | List of all time entries, filterable by date range, client, project | Add manual entry, edit entry, delete entry, filter, export | Date, task name, project, client, duration, description, billable flag, hourly rate, amount |
| Active timer (persistent bar) | _(global component)_ | Floating bar visible on all pages when a timer is running | Pause, stop, discard, switch task | Current task name, project name, elapsed time |

### 1.7 Authenticated Pages — Invoicing

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Invoice list | `/invoices` | All invoices with status filters | Create new invoice, filter by status/client, search | Invoice number, client name, amount, date issued, due date, status badge (Draft, Sent, Paid, Overdue, Partial) |
| Invoice detail | `/invoices/:id` | Full invoice with line items | Edit (if draft), send by email, export PDF, record payment (full or partial), mark as sent/paid/overdue | Invoice number, from (business profile), to (client), line items (time entries or milestones), subtotal, tax/VAT, total, payments received, balance due, status, payment terms |
| New invoice | `/invoices/new` | Invoice creation wizard | Select client, select project, choose billable time entries or milestones, adjust line items, preview, save as draft | Unbilled time entries for selected project, milestone list, auto-calculated totals, tax rate |
| Business profile | `/settings/business` | Business identity settings | Edit business name, address, logo, default payment instructions, default tax/VAT rate, default currency | Current saved values, logo preview |

### 1.8 Authenticated Pages — Calendar & Scheduling

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Calendar | `/calendar` | Monthly/weekly calendar with deadlines | Navigate months, click deadline to go to task/project, add blocked time | Task due dates (color-coded by client), project deadlines, blocked-out time (vacations, personal days) |

### 1.9 Authenticated Pages — Settings

| Page | URL Path | What Users See | Actions | Data Displayed |
|------|----------|----------------|---------|----------------|
| Account settings | `/settings/account` | Profile and account management | Change name, email, password; delete account | Current name, email |
| Notification settings | `/settings/notifications` | Notification preferences | Toggle notification types, set quiet hours | Deadline reminders (on/off, how far in advance), overdue invoice reminders, channels (email, in-app) |
| Search | `/search?q=` | Full-text search results | Click result to navigate | Matching clients, projects, tasks, notes — grouped by type |

---

## 2. Data Model

### 2.1 Entity Relationship Overview

```
User (1) ──── (N) Client
Client (1) ──── (N) Project
Project (1) ──── (N) Task
Task (1) ──── (N) Subtask
Task (1) ──── (N) TimeEntry
Project (1) ──── (N) Milestone       (for fixed-price projects)
Project (1) ──── (N) Invoice
Invoice (1) ──── (N) InvoiceLineItem
Invoice (1) ──── (N) Payment
Project (1) ──── (N) FileAttachment
Task (1) ──── (N) FileAttachment
User (1) ──── (1) BusinessProfile
Project (1) ──── (0..1) ProjectTemplate
```

### 2.2 Entities

#### User

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| email | string | unique, not null | Used for login |
| password_hash | string | not null | bcrypt hash |
| name | string | not null | Display name |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |
| last_login_at | timestamp | nullable | |
| email_verified | boolean | default false | |
| timezone | string | default 'UTC' | IANA timezone |

#### BusinessProfile

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, unique, not null | One per user |
| business_name | string | nullable | Company or solo name |
| address | text | nullable | Full mailing address |
| logo_url | string | nullable | Path to uploaded logo |
| payment_instructions | text | nullable | Bank details, PayPal, etc. |
| default_tax_rate | decimal(5,2) | default 0.00 | Percentage (e.g., 20.00 = 20%) |
| default_currency | string(3) | default 'USD' | ISO 4217 code |
| invoice_number_prefix | string | default 'INV-' | e.g., "INV-", "TF-" |
| next_invoice_number | integer | default 1 | Auto-incremented |

#### Client

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, not null | Owner |
| name | string | not null | Client or company name |
| contact_name | string | nullable | Primary contact person |
| email | string | nullable | |
| phone | string | nullable | |
| address | text | nullable | |
| notes | text | nullable | Freeform notes |
| default_hourly_rate | decimal(10,2) | nullable | Inherited by new projects |
| default_payment_terms | integer | default 30 | Days (Net 15, Net 30, etc.) |
| is_archived | boolean | default false | |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### Project

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| client_id | UUID | FK → Client, not null | |
| user_id | UUID | FK → User, not null | Denormalized for query perf |
| name | string | not null | |
| description | text | nullable | |
| status | enum | not null, default 'active' | active, on_hold, completed, cancelled |
| billing_type | enum | not null | hourly, fixed_price |
| hourly_rate | decimal(10,2) | nullable | Override client default; required if billing_type = hourly |
| fixed_price | decimal(10,2) | nullable | Required if billing_type = fixed_price |
| budget_hours | decimal(8,2) | nullable | Estimated hours budget |
| budget_amount | decimal(10,2) | nullable | Estimated dollar budget |
| budget_alert_threshold | decimal(3,2) | default 0.80 | Percentage to trigger alert (0.80 = 80%) |
| deadline | date | nullable | |
| portal_token | string | unique, nullable | For client portal sharing |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### Task

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| project_id | UUID | FK → Project, not null | |
| user_id | UUID | FK → User, not null | Denormalized |
| title | string | not null | |
| description | text | nullable | |
| status | enum | not null, default 'todo' | todo, in_progress, waiting_on_client, review, done |
| priority | enum | not null, default 'medium' | low, medium, high, urgent |
| due_date | date | nullable | |
| position | integer | not null | Sort order within column |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### Subtask

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK → Task, not null | |
| title | string | not null | |
| is_completed | boolean | default false | |
| position | integer | not null | Sort order |
| created_at | timestamp | not null | |

#### TaskDependency

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK → Task, not null | The blocked task |
| blocked_by_task_id | UUID | FK → Task, not null | The blocking task |
| created_at | timestamp | not null | |
| | | unique(task_id, blocked_by_task_id) | No duplicate deps |

#### TimeEntry

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK → Task, nullable | Can log time without a task |
| project_id | UUID | FK → Project, not null | |
| user_id | UUID | FK → User, not null | |
| description | string | nullable | What was done (appears on invoices) |
| start_time | timestamp | not null | |
| end_time | timestamp | nullable | Null while timer is running |
| duration_minutes | integer | nullable | Calculated on stop; editable for manual entries |
| is_billable | boolean | default true | |
| is_invoiced | boolean | default false | Locked once on an invoice |
| invoice_line_item_id | UUID | FK → InvoiceLineItem, nullable | Link to invoice |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### Milestone

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| project_id | UUID | FK → Project, not null | Only for fixed_price projects |
| name | string | not null | e.g., "50% deposit", "Final delivery" |
| amount | decimal(10,2) | not null | Dollar amount for this milestone |
| due_date | date | nullable | |
| status | enum | not null, default 'pending' | pending, completed, invoiced |
| position | integer | not null | Sort order |
| created_at | timestamp | not null | |

#### Invoice

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, not null | |
| project_id | UUID | FK → Project, not null | |
| client_id | UUID | FK → Client, not null | Denormalized |
| invoice_number | string | unique per user, not null | Auto-generated from BusinessProfile |
| status | enum | not null, default 'draft' | draft, sent, paid, overdue, partial |
| issued_date | date | not null | |
| due_date | date | not null | Calculated from payment terms |
| subtotal | decimal(10,2) | not null | Sum of line items |
| tax_rate | decimal(5,2) | default 0.00 | Percentage |
| tax_amount | decimal(10,2) | not null | Calculated |
| total | decimal(10,2) | not null | subtotal + tax_amount |
| amount_paid | decimal(10,2) | default 0.00 | Sum of payments |
| balance_due | decimal(10,2) | not null | total - amount_paid |
| currency | string(3) | not null | From BusinessProfile |
| notes | text | nullable | Footer notes for the client |
| payment_instructions | text | nullable | Copied from BusinessProfile, editable |
| sent_at | timestamp | nullable | When emailed |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### InvoiceLineItem

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| invoice_id | UUID | FK → Invoice, not null | |
| description | string | not null | |
| quantity | decimal(8,2) | not null | Hours or units |
| unit_price | decimal(10,2) | not null | Hourly rate or milestone price |
| amount | decimal(10,2) | not null | quantity × unit_price |
| type | enum | not null | time_entry, milestone, custom |
| time_entry_id | UUID | FK → TimeEntry, nullable | For time-based lines |
| milestone_id | UUID | FK → Milestone, nullable | For milestone-based lines |
| position | integer | not null | Sort order |

#### Payment

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| invoice_id | UUID | FK → Invoice, not null | |
| amount | decimal(10,2) | not null | |
| payment_date | date | not null | |
| method | string | nullable | e.g., "Bank transfer", "PayPal" |
| notes | string | nullable | Reference number, etc. |
| created_at | timestamp | not null | |

#### FileAttachment

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, not null | Uploader |
| project_id | UUID | FK → Project, nullable | Project-level attachment |
| task_id | UUID | FK → Task, nullable | Task-level attachment |
| file_name | string | not null | Original filename |
| file_url | string | not null | Storage path/URL |
| file_size | integer | not null | Bytes |
| mime_type | string | not null | |
| uploaded_at | timestamp | not null | |

#### ProjectTemplate

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, not null | |
| name | string | not null | |
| description | text | nullable | |
| template_data | JSON | not null | Serialized task structure (columns, tasks, subtasks) |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

#### Notification

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User, not null | |
| type | enum | not null | deadline_reminder, budget_alert, overdue_invoice, time_tracking_reminder |
| title | string | not null | |
| message | text | not null | |
| reference_type | string | nullable | 'task', 'project', 'invoice' |
| reference_id | UUID | nullable | ID of referenced entity |
| is_read | boolean | default false | |
| channel | enum | not null | in_app, email |
| created_at | timestamp | not null | |

### 2.3 Indexes

```
-- Performance-critical queries
CREATE INDEX idx_clients_user_id ON clients(user_id) WHERE is_archived = false;
CREATE INDEX idx_projects_user_id_status ON projects(user_id, status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_tasks_project_id_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_user_id_due_date ON tasks(user_id, due_date) WHERE status != 'done';
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_user_id_start ON time_entries(user_id, start_time);
CREATE INDEX idx_time_entries_billable ON time_entries(project_id, is_billable, is_invoiced);
CREATE INDEX idx_invoices_user_id_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Full-text search
CREATE INDEX idx_clients_search ON clients USING gin(to_tsvector('english', name || ' ' || coalesce(notes, '')));
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
```

---

## 3. User Flows

### 3.1 Sign Up & Onboarding

```
[Landing Page]
    │
    ▼
[Sign Up Form] ── email, name, password
    │
    ▼
[Email Verification Sent] ── "Check your inbox"
    │
    ▼
[Email Link Clicked] ── account verified
    │
    ▼
[Dashboard (empty state)]
    │
    ├── Prompt: "Add your first client →"
    │       │
    │       ▼
    │   [Create Client] ── name, email, hourly rate
    │       │
    │       ▼
    │   Prompt: "Create your first project →"
    │       │
    │       ▼
    │   [Create Project] ── name, billing type, deadline
    │       │
    │       ▼
    │   [Project Board (empty)] ── "Add your first task →"
    │
    └── Prompt: "Set up your business profile →"
            │
            ▼
        [Business Profile] ── name, address, logo, payment info, tax rate, currency
```

### 3.2 Project Creation

```
[Any page with "New Project" action]
    │
    ▼
[Select Client] ── choose existing client or create new
    │
    ▼
[Project Details Form]
    ├── Name (required)
    ├── Description
    ├── Billing type: Hourly ──┐ or Fixed-Price ──┐
    │                          │                   │
    │                   Set hourly rate      Set fixed price
    │                   (pre-filled from     + add milestones
    │                    client default)
    │
    ├── Budget (hours or amount)
    ├── Deadline
    └── Create from template? ── [Select Template]
    │
    ▼
[Project Board] ── ready to add tasks
```

### 3.3 Task Management (Daily Work Loop)

```
[Open TaskFlow] ── start of day
    │
    ▼
[Today View] ── tasks due today + overdue, across all clients
    │
    ├── Pick a task to work on
    │       │
    │       ▼
    │   [Click "Start Timer"] ── timer begins, active timer bar appears
    │       │                    (auto-pauses any running timer)
    │       ▼
    │   [Work on task...]
    │       │
    │       ▼
    │   [Stop Timer] ── time entry created with duration
    │       │
    │       ▼
    │   [Drag task to new column] ── e.g., In Progress → Review
    │
    ├── Task is blocked on client
    │       │
    │       ▼
    │   [Drag to "Waiting on Client"]
    │
    └── Need to add a task
            │
            ▼
        [Click "Add Task" on board or use cross-project task list]
            │
            ▼
        [Fill in: title, due date, priority, description]
            │
            ▼
        [Task appears in "To Do" column]
```

### 3.4 Time Tracking

```
┌─────────────────────────────────────────┐
│           LIVE TIMER FLOW               │
├─────────────────────────────────────────┤
│                                         │
│  [Click timer icon on any task]         │
│      │                                  │
│      ├── Is another timer running?      │
│      │     YES → auto-pause it,         │
│      │           save partial entry     │
│      │     NO  → start fresh            │
│      │                                  │
│      ▼                                  │
│  [Timer bar visible globally]           │
│      │                                  │
│      ├── [Stop] → create time entry     │
│      ├── [Discard] → no entry saved     │
│      └── User closes browser →          │
│           timer keeps running           │
│           (saved on server)             │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         MANUAL ENTRY FLOW               │
├─────────────────────────────────────────┤
│                                         │
│  [Go to /time or task detail]           │
│      │                                  │
│      ▼                                  │
│  [Click "Log Time"]                     │
│      │                                  │
│      ▼                                  │
│  [Form: project, task (optional),       │
│   date, start/end or duration,          │
│   description, billable toggle]         │
│      │                                  │
│      ▼                                  │
│  [Save] → entry appears in list         │
│                                         │
└─────────────────────────────────────────┘
```

### 3.5 Invoice Creation & Sending

```
[Go to /invoices/new or "Create Invoice" from project]
    │
    ▼
[Select Client & Project]
    │
    ▼
[Choose Billing Source]
    ├── Hourly Project ──────────────────────────┐
    │   Show unbilled time entries               │
    │   ├── Select all or pick individual        │
    │   └── Each becomes a line item             │
    │        (description, hours, rate, amount)  │
    │                                            │
    └── Fixed-Price Project ─────────────────────┤
        Show milestones not yet invoiced         │
        ├── Select milestones to bill            │
        └── Each becomes a line item             │
                                                 │
    ┌────────────────────────────────────────────┘
    │
    ▼
[Review Line Items]
    ├── Add/edit/remove custom line items
    ├── Tax rate (pre-filled from business profile)
    ├── Payment terms (pre-filled from client default)
    ├── Notes field
    └── Preview total
    │
    ▼
[Save as Draft]
    │
    ▼
[Invoice Detail Page]
    ├── [Edit] ── modify line items (only while draft)
    ├── [Send by Email] ── sends to client email
    │       │
    │       ▼
    │   Status → "Sent", sent_at recorded
    │   Time entries marked as invoiced (locked)
    │   Milestones marked as invoiced
    │
    ├── [Export PDF] ── download
    │
    └── [Record Payment]
            │
            ▼
        [Enter amount, date, method, notes]
            │
            ├── Full payment ── status → "Paid"
            └── Partial payment ── status → "Partial"
```

### 3.6 Viewing Business Progress

```
[Dashboard /dashboard]
    │
    ├── Active Projects Card
    │   └── Count + list with status indicators
    │
    ├── Upcoming Deadlines Card
    │   └── Next 7 days, sorted by date
    │
    ├── Hours This Week Card
    │   └── Total hours, billable vs. non-billable
    │
    ├── Outstanding Invoices Card
    │   └── Total $ outstanding, count of unpaid
    │
    └── Click any card → navigate to detailed view

[Time Entries /time]
    │
    ├── Filter: date range, client, project
    ├── Group by: day, client, project
    └── Summary: total hours, total billable amount

[Invoice List /invoices]
    │
    ├── Filter by status: Draft, Sent, Overdue, Partial, Paid
    ├── Filter by client
    └── Summary: total outstanding, total paid this month
```

### 3.7 Client Portal (Shared View)

```
[Freelancer copies portal link from project settings]
    │
    ▼
[Client opens /portal/:token]
    │
    ▼
[Read-only project status page]
    ├── Project name and description
    ├── Task statuses (progress bar: X of Y complete)
    ├── Milestone status (for fixed-price)
    ├── Upload files (if enabled by freelancer)
    └── No login required — token-based access
```

---

## 4. Security Rules

### 4.1 Authentication

| Rule | Details |
|------|---------|
| Password hashing | bcrypt with cost factor 12 |
| Minimum password length | 8 characters |
| Password requirements | At least one uppercase, one lowercase, one number |
| Email verification | Required before full access; unverified users can log in but see a verification banner |
| Session management | Server-side sessions with secure, HTTP-only, SameSite=Strict cookies |
| Session duration | 7 days idle timeout; 30 days absolute maximum |
| Session invalidation | On password change, all other sessions are revoked |
| Password reset tokens | Single-use, expire after 1 hour, cryptographically random |

### 4.2 Authorization (Access Control)

| Rule | Details |
|------|---------|
| Data isolation | Every query is scoped to `user_id` — users can never access another user's data |
| Client ownership | Only the user who created a client can view, edit, or delete it |
| Project ownership | Inherited from client; `user_id` denormalized on project for direct checks |
| Task ownership | Inherited from project; `user_id` denormalized on task for direct checks |
| Invoice ownership | Only the invoice creator can view, edit, send, or record payments |
| File access | Files served through authenticated endpoints, not directly from storage URLs |
| Client portal | Token-based, read-only; tokens are revocable; no write access except file upload to a sandboxed area |
| API authorization | Every API endpoint validates ownership before returning or modifying data |

### 4.3 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /login` | 5 attempts | Per 15 minutes per IP |
| `POST /signup` | 3 attempts | Per hour per IP |
| `POST /forgot-password` | 3 attempts | Per hour per email |
| General API (authenticated) | 100 requests | Per minute per user |
| File upload | 10 uploads | Per hour per user |
| Invoice email sending | 5 sends | Per hour per user |

### 4.4 Input Validation & Sanitization

| Rule | Details |
|------|---------|
| Input validation | Server-side validation on all inputs; client-side is UX only, never trusted |
| SQL injection | Parameterized queries only; no string concatenation in queries |
| XSS prevention | All user content HTML-escaped on render; Content-Security-Policy headers |
| File uploads | Validate MIME type and extension against allowlist (images, PDFs, docs); max 25 MB per file; scan for malicious content |
| CSRF protection | CSRF tokens on all state-changing requests |

### 4.5 Data Protection

| Rule | Details |
|------|---------|
| HTTPS | All traffic over TLS; HSTS header enabled |
| Sensitive data | Passwords never logged or returned in API responses |
| File storage | Files stored in private cloud storage; accessed via signed, time-limited URLs |
| Data export | Users can export all their data (GDPR compliance) |
| Account deletion | Hard-deletes user record; cascades to all owned data within 30 days |
| Backups | Daily encrypted backups with 90-day retention |

---

## 5. States and Transitions

### 5.1 Project Status

```
                    ┌──────────┐
          ┌────────►│ On Hold  │────────┐
          │         └──────────┘        │
          │              │              │
          │              ▼              ▼
     ┌────────┐    ┌──────────┐   ┌───────────┐
     │ Active │◄───│ On Hold  │   │ Cancelled │
     └────────┘    └──────────┘   └───────────┘
          │
          ▼
    ┌───────────┐
    │ Completed │
    └───────────┘
```

| From | To | Conditions |
|------|----|------------|
| Active | On Hold | Manual action; all running timers on project are stopped |
| Active | Completed | Manual action; all tasks should be Done (warn if not) |
| Active | Cancelled | Manual action; confirmation required; stops all timers |
| On Hold | Active | Manual action |
| On Hold | Cancelled | Manual action; confirmation required |
| Completed | Active | Manual action (reopen) |

**Not allowed:** Cancelled → any state (must create a new project). Completed → Cancelled.

### 5.2 Task Status

```
  ┌────────┐     ┌─────────────┐     ┌────────────────────┐     ┌────────┐     ┌──────┐
  │ To Do  │────►│ In Progress │────►│ Waiting on Client  │────►│ Review │────►│ Done │
  └────────┘     └─────────────┘     └────────────────────┘     └────────┘     └──────┘
       ▲              ▲    │              │                          │              │
       │              │    │              │                          │              │
       │              │    ▼              ▼                          ▼              │
       │              └────┴──────────────┴──────────────────────────┘              │
       │                                                                           │
       └───────────────────────────────────────────────────────────────────────────┘
                                    (reopen)
```

**Allowed transitions:** Any status → any status (Kanban drag-and-drop; no artificial restrictions on freelancers managing their own work).

**Side effects:**
| Transition | Effect |
|------------|--------|
| Any → Done | Running timer on this task is stopped; time entry saved |
| Any → Waiting on Client | No automatic effect (freelancer decides) |
| Done → Any (reopen) | No automatic effect |

### 5.3 Invoice Status

```
  ┌───────┐     ┌──────┐     ┌─────────┐     ┌──────┐
  │ Draft │────►│ Sent │────►│ Overdue  │────►│ Paid │
  └───────┘     └──────┘     └─────────┘     └──────┘
                    │              │
                    ▼              ▼
               ┌─────────┐  ┌─────────┐
               │ Partial │  │ Partial │──────►┌──────┐
               └─────────┘  └─────────┘       │ Paid │
                    │                          └──────┘
                    ▼
               ┌─────────┐
               │ Overdue  │
               └─────────┘
```

| From | To | Trigger |
|------|----|---------|
| Draft | Sent | User clicks "Send" (email) or manually marks as sent |
| Draft | Draft | Editable — can modify line items |
| Sent | Paid | Full payment recorded (amount_paid = total) |
| Sent | Partial | Partial payment recorded (0 < amount_paid < total) |
| Sent | Overdue | Automated: due_date has passed and balance_due > 0 |
| Partial | Paid | Remaining balance paid |
| Partial | Overdue | Automated: due_date has passed and balance_due > 0 |
| Overdue | Paid | Full payment recorded |
| Overdue | Partial | Partial payment recorded |

**Not allowed:** Sent/Paid/Overdue → Draft (cannot un-send). Paid → any other status.

**Side effects:**
| Event | Effect |
|-------|--------|
| Invoice sent | Time entries marked `is_invoiced = true`; milestones marked `invoiced` |
| Invoice deleted (draft only) | Time entries unmarked; milestones unmarked |

### 5.4 Milestone Status

```
  ┌─────────┐     ┌───────────┐     ┌──────────┐
  │ Pending │────►│ Completed │────►│ Invoiced │
  └─────────┘     └───────────┘     └──────────┘
```

| From | To | Trigger |
|------|----|---------|
| Pending | Completed | User marks as completed |
| Completed | Invoiced | Included on a sent invoice |
| Completed | Pending | User reopens (only if not invoiced) |

### 5.5 Deletion Cascades

| When Deleted | Cascade |
|-------------|---------|
| **User** (account deletion) | → All Clients → All Projects → All Tasks → All Subtasks, TimeEntries, Milestones, Invoices, Payments, FileAttachments, Notifications, BusinessProfile, ProjectTemplates |
| **Client** | → All Projects under this client (same cascade as project deletion below) |
| **Project** | → All Tasks, Subtasks, TimeEntries, Milestones, FileAttachments (project-level), TaskDependencies. Invoices in Draft status are deleted. Sent/Paid invoices are **retained** (orphaned with client info snapshot) for accounting records. |
| **Task** | → All Subtasks, TaskDependencies (where task is blocker or blocked), FileAttachments (task-level). TimeEntries are **retained** (orphaned — they represent real work done). |
| **Invoice** (draft only) | → All InvoiceLineItems, unlink TimeEntries (set `is_invoiced = false`), unlink Milestones (set status back to `completed`) |

**Soft delete vs. hard delete:**
- Clients: soft delete (archive). Hard delete available but requires confirmation and cascade warning.
- Projects: soft delete (status → Cancelled or Completed). Hard delete available from archived/cancelled state.
- Tasks: hard delete (with cascade warning if time entries exist).
- Invoices: only drafts can be deleted. Sent invoices are permanent records.
- Time entries: hard delete (with confirmation).

---

## 6. Error Handling

### 6.1 HTTP Error Responses

| Status Code | Scenario | User-Facing Message | Behavior |
|-------------|----------|---------------------|----------|
| 400 | Invalid input, malformed request | "Something wasn't right with that request. Please check your input and try again." | Show inline validation errors on the form |
| 401 | Not authenticated, session expired | "Your session has expired. Please log in again." | Redirect to `/login` with return URL preserved |
| 403 | Authenticated but not authorized (accessing another user's data) | "You don't have permission to access this resource." | Redirect to `/dashboard` |
| 404 | Resource not found (deleted project, bad URL) | "We couldn't find what you're looking for." | Show 404 page with link to dashboard |
| 409 | Conflict (e.g., duplicate invoice number, concurrent edit) | "This action conflicts with a recent change. Please refresh and try again." | Reload current data |
| 413 | File too large | "This file is too large. Maximum file size is 25 MB." | Show error next to upload field |
| 422 | Validation error (server-side) | Specific field-level error messages | Highlight invalid fields with messages |
| 429 | Rate limit exceeded | "You're making requests too quickly. Please wait a moment." | Show retry countdown |
| 500 | Unexpected server error | "Something went wrong on our end. We've been notified and are looking into it." | Show error page with "Return to Dashboard" button; log error with stack trace and request context |

### 6.2 Client-Side Error Handling

| Scenario | Behavior |
|----------|----------|
| Network offline | Show persistent banner: "You're offline. Changes will sync when you reconnect." Disable actions that require server. |
| Network timeout | Retry request once after 3 seconds. If still failing, show: "Request timed out. Please try again." |
| Optimistic update failure | Revert UI to previous state. Show toast: "That action couldn't be completed. Please try again." |
| Session expired mid-action | Save in-progress form data to localStorage. Redirect to login. Restore form data after re-authentication. |

### 6.3 Validation Errors (by Domain)

#### Client

| Field | Validation | Error Message |
|-------|-----------|---------------|
| name | Required, max 200 chars | "Client name is required." / "Client name is too long." |
| email | Valid email format if provided | "Please enter a valid email address." |
| default_hourly_rate | Non-negative number if provided | "Hourly rate must be a positive number." |
| default_payment_terms | Positive integer | "Payment terms must be a positive number of days." |

#### Project

| Field | Validation | Error Message |
|-------|-----------|---------------|
| name | Required, max 200 chars | "Project name is required." |
| billing_type | Required, must be 'hourly' or 'fixed_price' | "Please select a billing type." |
| hourly_rate | Required if hourly, positive number | "Hourly rate is required for hourly projects." |
| fixed_price | Required if fixed_price, positive number | "Total price is required for fixed-price projects." |
| deadline | Must be a valid date, cannot be in the past (on create) | "Deadline must be a future date." |
| budget_hours | Non-negative if provided | "Budget hours must be a positive number." |

#### Task

| Field | Validation | Error Message |
|-------|-----------|---------------|
| title | Required, max 500 chars | "Task title is required." |
| due_date | Valid date if provided | "Please enter a valid date." |
| priority | Must be one of: low, medium, high, urgent | "Invalid priority level." |
| Self-dependency | task_id ≠ blocked_by_task_id | "A task cannot block itself." |
| Cross-project dependency | Both tasks in same project | "Dependencies must be within the same project." |

#### Time Entry

| Field | Validation | Error Message |
|-------|-----------|---------------|
| project_id | Required, must exist and belong to user | "Please select a project." |
| duration_minutes | Positive integer, max 1440 (24 hours) | "Duration must be between 1 minute and 24 hours." |
| start_time | Cannot be in the future | "Start time cannot be in the future." |
| end_time | Must be after start_time | "End time must be after start time." |
| Invoiced entry edit | Cannot edit if is_invoiced = true | "This time entry has been invoiced and cannot be modified." |

#### Invoice

| Field | Validation | Error Message |
|-------|-----------|---------------|
| Line items | At least one required | "An invoice must have at least one line item." |
| total | Must be positive | "Invoice total must be greater than zero." |
| Edit after sent | Cannot edit sent/paid invoices | "Sent invoices cannot be edited." |
| Duplicate send | Cannot send an already-sent invoice | "This invoice has already been sent." |
| Payment amount | Must be positive, cannot exceed balance_due | "Payment cannot exceed the remaining balance." |

### 6.4 Invalid Action Guards

| Action Attempted | Condition | Response |
|------------------|-----------|----------|
| Delete a sent invoice | Invoice status ≠ draft | Block: "Sent invoices cannot be deleted. They are permanent records for accounting purposes." |
| Edit an invoiced time entry | is_invoiced = true | Block: "This time entry is linked to Invoice #X and cannot be modified." |
| Delete a client with active projects | Has projects with status 'active' | Warn: "This client has X active projects. Archiving is recommended. Delete anyway?" (requires double confirmation) |
| Start timer on a completed project | Project status = completed | Block: "This project is marked as completed. Reopen it to track time." |
| Create invoice for project with no billable entries | No unbilled time entries and no uninvoiced milestones | Block: "There's nothing to invoice. Track time or complete milestones first." |
| Archive client with unpaid invoices | Has invoices with balance_due > 0 | Warn: "This client has $X in outstanding invoices. Archive anyway?" |
| Send invoice without business profile | BusinessProfile incomplete (no name or payment instructions) | Block: "Please complete your business profile before sending invoices. Your clients need to know who to pay and how." |
| Delete task with time entries | TimeEntries exist for task | Warn: "This task has X hours of tracked time. The time entries will be preserved but unlinked from this task. Delete anyway?" |

---

*This document is the technical blueprint for TaskFlow. It should be read alongside the [Product Definition](./PRODUCT-DEFINITION.md) and updated as implementation decisions are made.*
