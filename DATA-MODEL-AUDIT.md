# TaskFlow — Data Model Audit

> Systematic review of APPLICATION-PLAN.md §2 (Data Model) cross-referenced against QA-CHECKLIST.md and IMPLEMENTATION-PLAN.md.
> Every relationship, constraint, status value, and cascade has been checked.

---

## Summary

**22 issues found:** 5 Critical, 4 High, 6 Medium, 7 Low

---

## Issues by Severity

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 1 | **Critical** | Missing entity | No `Session` table — cannot implement server-side session revocation, idle/absolute timeouts, or multi-session invalidation on password change (§4.1, §10.6, §12.6) | Add `Session` table: `id, user_id, token_hash (unique), created_at, last_active_at, expires_at, ip_address, user_agent` |
| 2 | **Critical** | Missing entity | No `PasswordResetToken` table — cannot implement single-use, expiring, cryptographically random reset tokens (§4.1, §1.5) | Add `PasswordResetToken` table: `id, user_id, token_hash (unique), expires_at, used_at, created_at` |
| 3 | **Critical** | Missing entity | No `EmailVerificationToken` table — cannot implement verification flow: generate, validate, expire, resend-invalidates-prior (§4.1, §1.2a) | Add `EmailVerificationToken` table: `id, user_id, token_hash (unique), expires_at, used_at, created_at` |
| 4 | **Critical** | Invoice FK constraints | §5.5 says sent/paid invoices are "retained (orphaned)" on client/project deletion, but `client_id` and `project_id` are `NOT NULL` FKs — will throw FK violation or wrongly cascade-delete the invoices | 1. Make `client_id` and `project_id` nullable on Invoice. 2. Add snapshot fields: `client_name`, `client_email`, `client_address`, `project_name` — populated at creation, preserved after parent deletion |
| 5 | **Critical** | Missing entity | No `NotificationPreference` table — notification settings page (§1.9) has toggles, quiet hours, channel prefs with nowhere to persist them (QA §9.2) | Add `NotificationPreference` table: `id, user_id (unique), deadline_reminders_enabled, deadline_reminder_days, budget_alerts_enabled, overdue_invoice_reminders_enabled, email_channel_enabled, in_app_channel_enabled, quiet_hours_start, quiet_hours_end` |
| 6 | **High** | TimeEntry ↔ InvoiceLineItem | Circular FK: `TimeEntry.invoice_line_item_id → InvoiceLineItem` AND `InvoiceLineItem.time_entry_id → TimeEntry`. Same relationship expressed twice. Complicates inserts (which first?), requires keeping both in sync | Remove `TimeEntry.invoice_line_item_id`. Keep `InvoiceLineItem.time_entry_id`. Use `TimeEntry.is_invoiced` flag + JOIN when needed |
| 7 | **High** | Missing entity | No `CalendarBlockedTime` table — calendar page (§1.8) says "add blocked time (vacation, personal day)" but there's no storage for it (QA §8.1 tests it) | Add `CalendarBlockedTime` table: `id, user_id, title, start_date, end_date, created_at, updated_at` |
| 8 | **High** | BusinessProfile.next_invoice_number | Race condition: two concurrent invoice creations both read same number, assign same invoice_number, one fails on unique constraint | Use atomic SQL: `UPDATE ... SET next_invoice_number = next_invoice_number + 1 RETURNING next_invoice_number - 1`. Wrap in transaction |
| 9 | **High** | User table | No `deleted_at` or `scheduled_deletion_at` field — §4.5/§5.5 specify "cascades within 30 days" but there's no field to track the deletion schedule (QA §13.6) | Add `scheduled_deletion_at timestamp nullable` to User. Daily job hard-deletes where `scheduled_deletion_at < now() - 30 days` |
| 10 | **Medium** | Invoice table | No snapshot fields for business profile "from" info (business name, address, logo). Changing business profile retroactively alters all historical invoices. Also no snapshot fields for client/project info when parents are deleted | Add to Invoice: `client_name, client_email, client_address, project_name, from_business_name, from_address, from_logo_url`. Populate at creation. Display from snapshots on sent invoices |
| 11 | **Medium** | Invoice.issued_date | `NOT NULL` but set when invoice is created as Draft — semantically wrong since the invoice hasn't been "issued" yet | Make `issued_date` nullable. Set it on Draft → Sent transition (the actual issuance moment) |
| 12 | **Medium** | Invoice.invoice_number | Constraint says "unique per user" but simple `UNIQUE` is table-wide — User A and User B would collide on "INV-001" | Use composite unique: `UNIQUE(user_id, invoice_number)`. In Prisma: `@@unique([userId, invoiceNumber])` |
| 13 | **Medium** | FileAttachment | Both `project_id` and `task_id` are nullable with no constraint — file can have neither parent (orphaned with no way to find or clean up) | Add `CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)` to ensure every file has at least one parent |
| 14 | **Medium** | Missing entity | Dashboard "recent activity feed" (§1.2) and Client Detail "Activity tab" (§1.3) reference activity data, but no `Activity`/`AuditLog` entity exists to store it | Add `ActivityLog` table: `id, user_id, entity_type, entity_id, action (created/updated/deleted/status_changed), metadata JSON, created_at`. Index on `(user_id, created_at)` |
| 15 | **Medium** | Invoice status §5.3 | Partial ↔ Overdue oscillation: Partial invoice past due → Overdue (daily job) → receives partial payment → Partial → next day → Overdue again. Generates duplicate notifications | Either: (a) Once Overdue, partial payments keep status as Overdue. Or (b) track whether overdue notification was already sent, don't re-send. Option (a) is simpler |
| 16 | **Low** | ER Diagram §2.1 | `Project (1) ──── (0..1) ProjectTemplate` implies direct FK, but ProjectTemplate has no `project_id` field — it's owned by User, not Project | Change diagram to `User (1) ──── (N) ProjectTemplate`. Optionally add `source_project_id nullable` for traceability |
| 17 | **Low** | Project.budget_alert_threshold | `decimal(3,2)` allows 0.00–9.99 (up to 999%). Default 0.80 (80%) is correct but type allows nonsensical values | Add `CHECK (budget_alert_threshold >= 0.00 AND budget_alert_threshold <= 1.00)` |
| 18 | **Low** | Subtask, Milestone | Missing `updated_at` — Subtask.is_completed and Milestone.status are edited frequently but last-modified time is not tracked | Add `updated_at timestamp not null` to both entities |
| 19 | **Low** | Notification.reference_type | `string` type instead of enum — allows typos ('taks' instead of 'task'), lacks type safety | Change to enum: `ReferenceType { task, project, invoice }`. Or add CHECK constraint |
| 20 | **Low** | FileAttachment | No way to distinguish portal uploads from owner uploads — §4.2 specifies "sandboxed area" for portal files but no field to identify them | Add `upload_source enum (owner, portal) default owner` to FileAttachment |
| 21 | **Low** | Indexes §2.3 | Missing FK indexes on commonly queried columns: `invoice_line_items.invoice_id`, `subtasks.task_id`, `payments.invoice_id`, `file_attachments.project_id`, `file_attachments.task_id` | Add explicit indexes for all FK columns used in lookups |
| 22 | **Low** | Project status §5.1 | Completed → Cancelled not allowed — requires two-step workaround (Completed → Active → Cancelled) to cancel a mistakenly-completed project | Document as intentional, or add direct Completed → Cancelled transition with confirmation |

---

## Entity Completeness Check

### Missing Entities (must be added to APPLICATION-PLAN.md §2.2)

| Entity | Fields | Why Needed |
|--------|--------|-----------|
| **Session** | id, user_id, token_hash, created_at, last_active_at, expires_at, ip_address, user_agent | Server-side session management, revocation, timeout enforcement |
| **PasswordResetToken** | id, user_id, token_hash, expires_at, used_at, created_at | Password reset flow (single-use, expiring tokens) |
| **EmailVerificationToken** | id, user_id, token_hash, expires_at, used_at, created_at | Email verification flow (single-use, resend invalidates prior) |
| **NotificationPreference** | id, user_id, per-type toggles, channel toggles, quiet_hours_start, quiet_hours_end | Notification settings persistence |
| **CalendarBlockedTime** | id, user_id, title, start_date, end_date, created_at, updated_at | Calendar blocked time feature |
| **ActivityLog** | id, user_id, entity_type, entity_id, action, metadata, created_at | Dashboard activity feed, client activity tab |

### Fields to Add to Existing Entities

| Entity | Field(s) to Add | Why |
|--------|----------------|-----|
| **User** | `scheduled_deletion_at timestamp nullable` | 30-day delayed account deletion |
| **Invoice** | `client_name, client_email, client_address, project_name` | Client/project snapshot for orphaned invoices |
| **Invoice** | `from_business_name, from_address, from_logo_url` | Business profile snapshot at send time |
| **Invoice** | Make `client_id` nullable, make `project_id` nullable | Allow FK orphaning on parent deletion |
| **Invoice** | Make `issued_date` nullable | Not set until Draft → Sent |
| **Subtask** | `updated_at timestamp` | Track edit time for is_completed toggling |
| **Milestone** | `updated_at timestamp` | Track edit time for status changes |
| **FileAttachment** | `upload_source enum (owner, portal) default owner` | Distinguish portal uploads |

### Fields to Remove from Existing Entities

| Entity | Field to Remove | Why |
|--------|----------------|-----|
| **TimeEntry** | `invoice_line_item_id` | Circular FK with InvoiceLineItem.time_entry_id — redundant |

### Constraints to Add

| Entity | Constraint | Why |
|--------|-----------|-----|
| **Invoice** | `UNIQUE(user_id, invoice_number)` instead of simple `UNIQUE(invoice_number)` | Per-user uniqueness |
| **FileAttachment** | `CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)` | Prevent orphaned files |
| **Project** | `CHECK (budget_alert_threshold >= 0.00 AND budget_alert_threshold <= 1.00)` | Prevent nonsensical threshold values |

### Indexes to Add

| Table | Index | Why |
|-------|-------|-----|
| `sessions` | `(token_hash)` unique | Fast session lookup |
| `sessions` | `(user_id)` | Fast session revocation |
| `invoice_line_items` | `(invoice_id)` | Line item lookup by invoice |
| `subtasks` | `(task_id)` | Subtask lookup by task |
| `payments` | `(invoice_id)` | Payment lookup by invoice |
| `file_attachments` | `(project_id)` | File lookup by project |
| `file_attachments` | `(task_id)` | File lookup by task |
| `activity_log` | `(user_id, created_at)` | Activity feed query |
| `calendar_blocked_time` | `(user_id, start_date)` | Calendar range query |

---

## Status Consistency Check

All status enum values were cross-referenced between entity definitions (§2.2), transition tables (§5.1–5.4), page specs (§1.x), QA checklist, and error handling (§6.x).

| Status Set | Definition | Pages | Transitions | QA | Verdict |
|-----------|-----------|-------|------------|-----|---------|
| ProjectStatus: `active, on_hold, completed, cancelled` | §2.2 ✓ | §1.4 ✓ | §5.1 ✓ | §4.2, §11.6 ✓ | **Consistent** |
| TaskStatus: `todo, in_progress, waiting_on_client, review, done` | §2.2 ✓ | §1.4 Board ✓ | §5.2 ✓ | §4.3 ✓ | **Consistent** |
| InvoiceStatus: `draft, sent, paid, overdue, partial` | §2.2 ✓ | §1.7 ✓ | §5.3 ✓ | §7.1, §7.2 ✓ | **Consistent** (but see Issue #15 re: oscillation) |
| MilestoneStatus: `pending, completed, invoiced` | §2.2 ✓ | §4.2 ✓ | §5.4 ✓ | §4.2, §11.4 ✓ | **Consistent** |
| TaskPriority: `low, medium, high, urgent` | §2.2 ✓ | §1.5 ✓ | N/A | §5.1, §5.2 ✓ | **Consistent** |
| BillingType: `hourly, fixed_price` | §2.2 ✓ | §1.4 ✓ | N/A | §4.1a, §4.2 ✓ | **Consistent** |
| NotificationType: `deadline_reminder, budget_alert, overdue_invoice, time_tracking_reminder` | §2.2 ✓ | §1.9 ✓ | N/A | §10.2, §11.9 ✓ | **Consistent** |

---

## Deletion Cascade Verification

Each cascade from §5.5 was verified against FK constraints and entity relationships:

| Deleted Entity | Cascaded Entities | FK Issues | Verdict |
|---------------|-------------------|-----------|---------|
| **User** | All owned data | None (top of chain) | **OK** |
| **Client** | → Projects (cascade below) | None | **OK** |
| **Project** | → Tasks, Subtasks, TimeEntries, Milestones, Files, Dependencies | None | **OK** |
| **Project** | Draft invoices deleted | None | **OK** |
| **Project** | Sent/paid invoices retained | **BROKEN** — `project_id NOT NULL` FK will fail | **Issue #4** |
| **Task** | → Subtasks, Dependencies, Task-level files | None | **OK** |
| **Task** | Time entries retained (task_id = null) | `task_id` is already nullable | **OK** |
| **Invoice (draft)** | → Line items; unmark time entries; unmark milestones | None | **OK** |
| **Client** (via project cascade) | Sent/paid invoices retained | **BROKEN** — `client_id NOT NULL` FK will fail | **Issue #4** |

---

*This audit should be resolved before Phase B (Core Data & CRUD) of the Implementation Plan begins. All Critical and High issues must be fixed in APPLICATION-PLAN.md before writing Prisma schema.*
