# TaskFlow — Implementation Plan

> Step-by-step technical blueprint for building TaskFlow from the current UI mockup into a fully functional production application.
> This is the **single source of truth** during the build phase.
> Read alongside [APPLICATION-PLAN.md](./APPLICATION-PLAN.md), [QA-CHECKLIST.md](./QA-CHECKLIST.md), and [DATA-MODEL-AUDIT.md](./DATA-MODEL-AUDIT.md).

### Data Model Audit Fixes Applied

All 22 issues from [DATA-MODEL-AUDIT.md](./DATA-MODEL-AUDIT.md) have been accepted and incorporated into this plan. Key changes:

| Fix | Category | Change |
|-----|----------|--------|
| #1 | New entity | `Session` table for database-backed sessions (replaces stateless iron-session) |
| #2 | New entity | `PasswordResetToken` table for single-use, expiring reset tokens |
| #3 | New entity | `EmailVerificationToken` table for verification flow |
| #4 | FK fix | Invoice `client_id`/`project_id` now nullable; snapshot fields added for orphaned invoices |
| #5 | New entity | `NotificationPreference` table for notification settings persistence |
| #6 | Circular FK | Removed `TimeEntry.invoice_line_item_id` (keep `InvoiceLineItem.time_entry_id` only) |
| #7 | New entity | `CalendarBlockedTime` table for vacation/blocked time |
| #8 | Race condition | Atomic `next_invoice_number` increment via SQL `RETURNING` clause |
| #9 | Missing field | `User.scheduled_deletion_at` for 30-day delayed account deletion |
| #10 | Missing fields | Invoice snapshot fields: `client_name`, `client_email`, `client_address`, `project_name`, `from_business_name`, `from_address`, `from_logo_url` |
| #11 | Constraint fix | `Invoice.issued_date` now nullable (set on send, not creation) |
| #12 | Constraint fix | `Invoice.invoice_number` uses composite unique `@@unique([userId, invoiceNumber])` |
| #13 | Constraint fix | `FileAttachment` CHECK: at least one of `project_id` or `task_id` must be set |
| #14 | New entity | `ActivityLog` table for dashboard feed and client activity tab |
| #15 | Status fix | Overdue invoices stay overdue on partial payment (prevents oscillation) |
| #16 | Docs fix | ER diagram corrected: `User (1) → (N) ProjectTemplate` |
| #17 | Constraint fix | `Project.budget_alert_threshold` CHECK: 0.00–1.00 |
| #18 | Missing field | `Subtask.updated_at` and `Milestone.updated_at` added |
| #19 | Type fix | `Notification.reference_type` changed from string to enum |
| #20 | Missing field | `FileAttachment.upload_source` enum (owner/portal) added |
| #21 | Missing indexes | FK indexes added for all commonly queried columns |
| #22 | Docs note | Completed → Cancelled requires two-step workaround (documented as intentional) |

---

## Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | Already in use; SSR + API Routes in one project |
| **Language** | TypeScript (strict mode) | Already configured |
| **Database** | PostgreSQL via Neon | Serverless Postgres; free tier; scales to zero; native `gin` + `tsvector` support for full-text search required by APPLICATION-PLAN.md §2.3 |
| **ORM** | Prisma | Best TypeScript integration; declarative schema; automatic migrations; type-safe queries |
| **Auth** | Custom (bcrypt + database sessions) | APPLICATION-PLAN.md §4.1 specifies bcrypt cost 12, server-side sessions, specific cookie flags — custom gives full control |
| **Session** | Database-backed sessions + signed cookie | Server-side session records in PostgreSQL; signed session ID in HTTP-only cookie; supports revocation, multi-session tracking, idle/absolute timeouts (Audit Issue #1) |
| **File Storage** | Uploadthing | Simple file upload API with signed URLs; presigned upload from client; 2 GB free; integrates with Next.js |
| **Email** | Resend | Transactional email API; React email templates; free tier (100/day); simple SDK |
| **PDF** | @react-pdf/renderer | Generate invoice PDFs server-side from React components; no headless browser needed |
| **Rate Limiting** | upstash/ratelimit + Upstash Redis | Serverless-compatible rate limiting; free tier; per-IP and per-user; matches §4.3 limits |
| **Validation** | Zod | Runtime schema validation for API inputs; shared between client and server; pairs with Prisma |
| **Drag & Drop** | @dnd-kit/core | Accessible, performant Kanban drag-and-drop; keyboard alternative built-in |
| **Calendar** | date-fns + custom component | Lightweight date math; no heavy calendar dependency |
| **Deployment** | Netlify (SSR mode) | Already deployed; @netlify/plugin-nextjs for SSR + API Routes as serverless functions |
| **Error Tracking** | Sentry | Free tier; automatic Next.js integration; source maps |
| **Charts** | Recharts | Already installed |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    NETLIFY CDN                       │
│         Static assets, security headers              │
└─────────┬───────────────────────────────┬───────────┘
          │                               │
          ▼                               ▼
┌─────────────────┐            ┌──────────────────────┐
│  Next.js SSR    │            │  Next.js API Routes  │
│  (Pages/RSC)    │            │  /api/*              │
│  Server         │            │  (Netlify Functions)  │
│  Components     │            │                      │
└────────┬────────┘            └──────────┬───────────┘
         │                                │
         │         ┌──────────┐           │
         └────────►│  Prisma  │◄──────────┘
                   │  Client  │
                   └────┬─────┘
                        │
              ┌─────────┴─────────┐
              │   Neon PostgreSQL  │
              │   (Serverless)     │
              └───────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌───────────┐ ┌───────────┐ ┌───────────┐
   │Uploadthing│ │  Resend   │ │  Upstash  │
   │  (Files)  │ │  (Email)  │ │  (Redis)  │
   └───────────┘ └───────────┘ └───────────┘
```

**Request flow:**
1. Browser → Netlify CDN (static assets cached at edge)
2. SSR pages → Netlify Functions → Prisma → Neon PostgreSQL
3. API routes → Netlify Functions → auth check → Prisma → Neon PostgreSQL
4. File uploads → Client → Uploadthing (presigned) → storage
5. File downloads → API route → signed URL redirect → storage

---

## Directory Structure (Target)

```
src/
├── app/
│   ├── (auth)/              # Auth pages (no sidebar layout)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/[token]/
│   ├── (authenticated)/     # App pages (sidebar layout, auth required)
│   │   ├── layout.tsx       # Sidebar + timer bar + notification bell
│   │   ├── dashboard/
│   │   ├── today/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── time/
│   │   ├── invoices/
│   │   ├── calendar/
│   │   ├── settings/
│   │   ├── templates/
│   │   └── search/
│   ├── portal/[token]/      # Client portal (no auth, no sidebar)
│   ├── api/                 # API Route Handlers
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── time-entries/
│   │   ├── invoices/
│   │   ├── files/
│   │   ├── templates/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── health/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── not-found.tsx        # 404 page
│   └── error.tsx            # Error boundary
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # Session helpers (getSession, requireAuth)
│   ├── validations/        # Zod schemas (one per entity)
│   ├── email/              # Email templates (React Email)
│   ├── pdf/                # Invoice PDF template
│   └── utils.ts            # Shared utilities
├── components/
│   ├── ui/                 # Base components (Button, Input, Modal, etc.)
│   └── features/           # Feature components (TimerBar, NotificationBell, etc.)
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema
└── migrations/             # Migration history
```

---

## PHASE A — Foundation

> **Goal:** Working auth, database, deployment pipeline. A user can sign up, log in, log out, and see an empty dashboard. Everything after this builds on a solid, tested foundation.

### A.1 Project Reconfiguration

Switch from static export to SSR for API routes and dynamic pages.

**Changes:**
- `next.config.mjs`: Remove `output: "export"` and `images: { unoptimized: true }`
- `netlify.toml`: Re-add `@netlify/plugin-nextjs`, change publish back to `.next`
- Remove `generateStaticParams()` wrappers from `clients/[id]` and `projects/[id]` (no longer needed for SSR)
- Reorganize route groups: `(auth)` for public auth pages, `(authenticated)` for protected pages
- Add root `not-found.tsx` and `error.tsx` pages

**Files to modify:**
- `next.config.mjs`
- `netlify.toml`
- `src/app/` (restructure route groups)

### A.2 Database Setup (Neon PostgreSQL)

**Steps:**
1. Create Neon project → get connection string
2. Install Prisma: `prisma`, `@prisma/client`
3. Create `prisma/schema.prisma` with initial User, Session, PasswordResetToken, EmailVerificationToken models
4. Run `npx prisma migrate dev` for initial migration
5. Create `src/lib/db.ts` — Prisma client singleton (handles serverless cold starts)

**Prisma client singleton pattern:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### A.3 Authentication System

Implement custom auth matching APPLICATION-PLAN.md §4.1 exactly.

**Install:** `bcryptjs`, `zod`, `nanoid` (for cryptographic token generation)

**Components:**
1. **Password hashing** — bcrypt with cost factor 12
2. **Sessions** — Database-backed (Audit fix #1):
   - On login: create `Session` row in PostgreSQL, return signed session ID in cookie
   - Cookie flags: `Secure`, `HttpOnly`, `SameSite=Strict`
   - 7-day idle timeout (`last_active_at` + 7 days), 30-day absolute max (`created_at` + 30 days)
   - On each request: look up session by token hash, update `last_active_at`
   - **Why not iron-session:** iron-session is stateless (encrypted cookie) — cannot revoke sessions server-side, which §4.1 and §10.6 require
3. **Auth middleware** — `src/lib/auth.ts`:
   - `getSession(req)` — returns session or null (checks expiry)
   - `requireAuth(req)` — returns session or throws 401
   - `requireOwnership(userId, resourceUserId)` — throws 403 if mismatch
4. **Session invalidation on password change** — `DELETE FROM sessions WHERE user_id = ? AND id != ?` (delete all except current)
5. **Password reset tokens** (Audit fix #2) — stored in `PasswordResetToken` table: single-use, 1-hour expiry, cryptographically random (nanoid 32 chars), stored as hash
6. **Email verification tokens** (Audit fix #3) — stored in `EmailVerificationToken` table: single-use, resend invalidates all prior tokens for that user

**API Routes:**
- `POST /api/auth/signup` — create user, hash password, send verification email
- `POST /api/auth/login` — verify credentials, create session
- `POST /api/auth/logout` — destroy session
- `POST /api/auth/forgot-password` — generate token, send email
- `POST /api/auth/reset-password` — validate token, update password
- `GET /api/auth/verify-email` — verify email token

**Pages (rewire from mockup):**
- `/signup` — connect form to `POST /api/auth/signup`
- `/login` — connect form to `POST /api/auth/login`
- `/forgot-password` — connect form to `POST /api/auth/forgot-password`
- `/reset-password/[token]` — connect form to `POST /api/auth/reset-password`

### A.4 Email Service

**Install:** `resend`, `@react-email/components`

**Email templates:**
1. Email verification — "Verify your email" with token link
2. Password reset — "Reset your password" with token link
3. (Later in Phase C: Invoice email)

**Implementation:**
- `src/lib/email/send.ts` — wrapper around Resend SDK
- `src/lib/email/templates/` — React Email templates

### A.5 Rate Limiting

**Install:** `@upstash/ratelimit`, `@upstash/redis`

**Implementation:**
- Create rate limiters matching APPLICATION-PLAN.md §4.3:
  - Login: 5/15min per IP
  - Signup: 3/hour per IP
  - Forgot password: 3/hour per email
  - General API: 100/min per user
  - File upload: 10/hour per user
  - Invoice email: 5/hour per user
- Apply as middleware in API routes

### A.6 Deployment Pipeline

**Steps:**
1. Verify Netlify deploys with SSR mode (not static export)
2. Configure environment variables in Netlify dashboard
3. Set up Prisma migration step in build command: `npx prisma generate && next build`
4. Verify security headers in `netlify.toml` still apply
5. Test that API routes respond (add `/api/health` endpoint)

### A.7 Error Tracking

**Install:** `@sentry/nextjs`

**Setup:**
- Initialize Sentry in `next.config.mjs`
- Add `sentry.client.config.ts` and `sentry.server.config.ts`
- Wire to `error.tsx` error boundary

---

**DEPENDENCIES:** None — this is the first phase.

**ENVIRONMENT VARIABLES (Netlify):**

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Neon dashboard | PostgreSQL connection string |
| `SESSION_SECRET` | Generate: 32+ char random string | Signs session cookies (database-backed sessions — fix #1) |
| `RESEND_API_KEY` | Resend dashboard | Transactional email |
| `UPSTASH_REDIS_REST_URL` | Upstash dashboard | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard | Rate limiting |
| `SENTRY_DSN` | Sentry dashboard | Error tracking |
| `NEXT_PUBLIC_APP_URL` | `https://neo-taskflow.netlify.app` | Base URL for email links |

**QA CHECKPOINT — Sections testable after Phase A:**

| QA Section | What's Testable |
|------------|-----------------|
| §1.2 Sign Up | Full section: form, validation, error states, loading, security (rate limit, CSRF) |
| §1.2a Email Verification | Full section: token flow, resend, expiry |
| §1.3 Log In | Full section: form, validation, session creation, return URL |
| §1.4 Forgot Password | Full section: email flow, rate limit, token security |
| §1.5 Reset Password | Full section: token validation, password change, session invalidation |
| §10.3 HTTP Errors | 401, 404, 500 responses |
| §10.5 Error Boundary | JavaScript error → fallback UI |
| §10.6 Logout | Full section: session destruction, redirect, back-button protection |
| §12.1 Auth Bypass | Access protected routes without auth → redirect |
| §12.3 Rate Limiting | Login, signup, forgot-password rate limits |
| §12.6 Session Security | Cookie flags, idle timeout, absolute timeout, password invalidation |
| §12.7 Data Protection | HTTPS, HSTS, no password in responses |
| §17.1 Double-Click | Signup/login submit protection |
| §17.2 Back/Forward | Back after signup/login, forward after back |
| §17.5 Autofill | Password manager on signup/login forms |

---

## PHASE B — Core Data & CRUD

> **Goal:** Every entity from APPLICATION-PLAN.md §2 has a database table, a Prisma model, Zod validation schemas, and API route handlers. No UI changes yet — this is purely data layer + API.

### B.1 Database Schema (Prisma)

Create all models in `prisma/schema.prisma` matching APPLICATION-PLAN.md §2.2 with all accepted audit fixes applied:

| Model | Key Fields | Relations | Audit Changes |
|-------|-----------|-----------|---------------|
| **User** | id, email, password_hash, name, email_verified, timezone, **scheduled_deletion_at** (nullable) | → BusinessProfile, Clients, Projects, Sessions, etc. | **+scheduled_deletion_at** (fix #9) |
| **Session** | id, user_id, **token_hash** (unique), created_at, **last_active_at**, **expires_at**, ip_address, user_agent | → User | **New entity** (fix #1) |
| **PasswordResetToken** | id, user_id, **token_hash** (unique), expires_at, used_at (nullable), created_at | → User | **New entity** (fix #2) |
| **EmailVerificationToken** | id, user_id, **token_hash** (unique), expires_at, used_at (nullable), created_at | → User | **New entity** (fix #3) |
| BusinessProfile | user_id (unique), business_name, logo_url, default_tax_rate, default_currency, invoice_number_prefix, next_invoice_number | → User | — |
| Client | user_id, name, contact_name, email, default_hourly_rate, default_payment_terms, is_archived | → User, Projects, Invoices | — |
| Project | client_id, user_id, name, status (enum), billing_type (enum), hourly_rate, fixed_price, budget_hours, budget_amount, budget_alert_threshold, deadline, portal_token | → Client, Tasks, Milestones, Invoices, Files | **+CHECK constraint** on budget_alert_threshold 0.00–1.00 (fix #17) |
| Task | project_id, user_id, title, status (enum), priority (enum), due_date, position | → Project, Subtasks, TimeEntries, Files, Dependencies | — |
| **Subtask** | task_id, title, is_completed, position, **updated_at** | → Task | **+updated_at** (fix #18) |
| TaskDependency | task_id, blocked_by_task_id (unique pair) | → Task × 2 | — |
| **TimeEntry** | task_id (nullable), project_id, user_id, description, start_time, end_time, duration_minutes, is_billable, is_invoiced | → Task, Project | **Removed invoice_line_item_id** (fix #6 — circular FK) |
| **Milestone** | project_id, name, amount, due_date, status (enum), position, **updated_at** | → Project | **+updated_at** (fix #18) |
| **Invoice** | user_id, **project_id** (nullable), **client_id** (nullable), invoice_number (**@@unique with user_id**), status (enum), **issued_date** (nullable), due_date, subtotal, tax_rate, tax_amount, total, amount_paid, balance_due, currency, notes, payment_instructions, sent_at, **client_name, client_email, client_address, project_name, from_business_name, from_address, from_logo_url** | → Project, Client, LineItems, Payments | **client_id/project_id nullable** (fix #4); **+snapshot fields** (fix #10); **issued_date nullable** (fix #11); **composite unique** (fix #12) |
| InvoiceLineItem | invoice_id, description, quantity, unit_price, amount, type (enum), time_entry_id, milestone_id, position | → Invoice, TimeEntry, Milestone | — |
| Payment | invoice_id, amount, payment_date, method, notes | → Invoice | — |
| **FileAttachment** | user_id, project_id (nullable), task_id (nullable), file_name, file_url, file_size, mime_type, **upload_source** (enum: owner/portal, default owner) | → User, Project, Task | **+CHECK** (project_id OR task_id not null) (fix #13); **+upload_source** (fix #20) |
| ProjectTemplate | user_id, name, description, template_data (JSON) | → User | — |
| **Notification** | user_id, type (enum), title, message, **reference_type** (enum: task/project/invoice), reference_id, is_read, channel (enum) | → User | **reference_type → enum** (fix #19) |
| **NotificationPreference** | id, user_id (unique), deadline_reminders_enabled, deadline_reminder_days, budget_alerts_enabled, overdue_invoice_reminders_enabled, time_tracking_reminders_enabled, email_channel_enabled, in_app_channel_enabled, quiet_hours_start, quiet_hours_end | → User | **New entity** (fix #5) |
| **CalendarBlockedTime** | id, user_id, title, start_date, end_date, created_at, updated_at | → User | **New entity** (fix #7) |
| **ActivityLog** | id, user_id, entity_type, entity_id, action (created/updated/deleted/status_changed), metadata (JSON), created_at | → User | **New entity** (fix #14) |

**Enums:**
- ProjectStatus: `active`, `on_hold`, `completed`, `cancelled`
- BillingType: `hourly`, `fixed_price`
- TaskStatus: `todo`, `in_progress`, `waiting_on_client`, `review`, `done`
- TaskPriority: `low`, `medium`, `high`, `urgent`
- MilestoneStatus: `pending`, `completed`, `invoiced`
- InvoiceStatus: `draft`, `sent`, `paid`, `overdue`, `partial`
- InvoiceLineItemType: `time_entry`, `milestone`, `custom`
- NotificationType: `deadline_reminder`, `budget_alert`, `overdue_invoice`, `time_tracking_reminder`
- NotificationChannel: `in_app`, `email`
- ReferenceType: `task`, `project`, `invoice` (Audit fix #19 — was string, now enum)
- UploadSource: `owner`, `portal` (Audit fix #20)
- ActivityAction: `created`, `updated`, `deleted`, `status_changed` (Audit fix #14)

**Indexes** (from APPLICATION-PLAN.md §2.3 + Audit fix #21):

Original indexes:
- `clients(user_id) WHERE is_archived = false`
- `projects(user_id, status)`
- `projects(client_id)`
- `tasks(project_id, status)`
- `tasks(user_id, due_date) WHERE status != 'done'`
- `time_entries(project_id)`
- `time_entries(user_id, start_time)`
- `time_entries(project_id, is_billable, is_invoiced)`
- `invoices(user_id, status)`
- `invoices(client_id)`
- `notifications(user_id, is_read) WHERE is_read = false`
- Full-text search GIN indexes on clients, projects, tasks

New indexes (from audit):
- `sessions(token_hash)` — unique, fast session lookup
- `sessions(user_id)` — fast session revocation on password change
- `password_reset_tokens(token_hash)` — unique, fast token validation
- `email_verification_tokens(token_hash)` — unique, fast token validation
- `invoice_line_items(invoice_id)` — line item lookup by invoice
- `subtasks(task_id)` — subtask lookup by task
- `payments(invoice_id)` — payment lookup by invoice
- `file_attachments(project_id)` — file lookup by project
- `file_attachments(task_id)` — file lookup by task
- `activity_log(user_id, created_at)` — activity feed query
- `calendar_blocked_time(user_id, start_date)` — calendar range query
- `notification_preferences(user_id)` — unique, preference lookup

**CHECK constraints** (from audit):
- `Project: CHECK (budget_alert_threshold >= 0.00 AND budget_alert_threshold <= 1.00)` (fix #17)
- `FileAttachment: CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)` (fix #13)
- `Invoice: @@unique([user_id, invoice_number])` composite unique (fix #12)

### B.2 Zod Validation Schemas

Create `src/lib/validations/` with one file per entity, matching APPLICATION-PLAN.md §6.3:

- `client.ts` — name (required, max 200), email (valid if provided), hourly_rate (non-negative), payment_terms (positive integer)
- `project.ts` — name (required, max 200), billing_type (required), hourly_rate/fixed_price (conditional), deadline (future date), budget_hours (non-negative)
- `task.ts` — title (required, max 500), due_date (valid date), priority (enum), no self-dependency, same-project dependency
- `time-entry.ts` — project_id (required), duration (1–1440 min), start_time (not future), end_time (after start)
- `invoice.ts` — at least one line item, total > 0, payment ≤ balance_due
- `subtask.ts` — title (required)
- `milestone.ts` — name (required), amount (positive)
- `business-profile.ts` — tax_rate (0–100), currency (ISO 4217)
- `notification-preference.ts` — quiet_hours_start/end (valid time), reminder_days (positive integer)
- `calendar-blocked-time.ts` — title (required), start_date (valid), end_date (≥ start_date)
- `search.ts` — query (min 2 chars, max 200)

### B.3 API Route Pattern

Every API route follows this pattern:

```typescript
// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createClientSchema } from '@/lib/validations/client'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // 1. Rate limit
  const rateLimitResult = await rateLimit.api(req)
  if (!rateLimitResult.success) return NextResponse.json(
    { error: 'Too many requests' }, { status: 429 }
  )

  // 2. Auth
  const session = await requireAuth(req) // throws 401 if no session

  // 3. Parse + validate
  const body = await req.json()
  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(
    { errors: parsed.error.flatten().fieldErrors }, { status: 422 }
  )

  // 4. Business logic
  const client = await db.client.create({
    data: { ...parsed.data, user_id: session.userId }
  })

  // 5. Response
  return NextResponse.json(client, { status: 201 })
}
```

### B.4 API Routes — Full List

**Auth** (built in Phase A):
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET  /api/auth/verify-email`
- `GET  /api/auth/me` — return current user

**Clients:**
- `GET    /api/clients` — list (with search, filter by archived)
- `POST   /api/clients` — create
- `GET    /api/clients/[id]` — detail
- `PATCH  /api/clients/[id]` — update
- `DELETE /api/clients/[id]` — delete (with cascade logic)
- `PATCH  /api/clients/[id]/archive` — archive/unarchive

**Projects:**
- `GET    /api/projects` — list (with search, filter by client/status)
- `POST   /api/projects` — create
- `GET    /api/projects/[id]` — detail (with summary stats)
- `PATCH  /api/projects/[id]` — update (including status changes with side effects)
- `DELETE /api/projects/[id]` — delete (with cascade logic)
- `POST   /api/projects/[id]/portal-token` — generate portal token
- `DELETE /api/projects/[id]/portal-token` — revoke portal token

**Tasks:**
- `GET    /api/tasks` — cross-project list (with filters)
- `GET    /api/projects/[id]/tasks` — project tasks (for board/list view)
- `POST   /api/projects/[id]/tasks` — create task in project
- `GET    /api/tasks/[id]` — task detail
- `PATCH  /api/tasks/[id]` — update (status change triggers timer stop on Done)
- `DELETE /api/tasks/[id]` — delete (with cascade)
- `PATCH  /api/tasks/[id]/position` — reorder (drag-and-drop)
- `POST   /api/tasks/[id]/subtasks` — add subtask
- `PATCH  /api/subtasks/[id]` — toggle subtask
- `DELETE /api/subtasks/[id]` — delete subtask
- `POST   /api/tasks/[id]/dependencies` — add dependency
- `DELETE /api/task-dependencies/[id]` — remove dependency

**Time Entries:**
- `GET    /api/time-entries` — list (with date range, client, project filters)
- `POST   /api/time-entries` — create manual entry
- `PATCH  /api/time-entries/[id]` — update (blocked if invoiced)
- `DELETE /api/time-entries/[id]` — delete (blocked if invoiced)
- `POST   /api/timer/start` — start timer (auto-pause existing)
- `POST   /api/timer/stop` — stop timer → create entry
- `POST   /api/timer/discard` — discard timer
- `GET    /api/timer/current` — get current running timer

**Milestones:**
- `POST   /api/projects/[id]/milestones` — create
- `PATCH  /api/milestones/[id]` — update (status change)
- `DELETE /api/milestones/[id]` — delete

**Invoices:**
- `GET    /api/invoices` — list (with status/client filters)
- `POST   /api/invoices` — create draft
- `GET    /api/invoices/[id]` — detail (with line items, payments)
- `PATCH  /api/invoices/[id]` — update (draft only)
- `DELETE /api/invoices/[id]` — delete (draft only, unmark time entries)
- `POST   /api/invoices/[id]/send` — send email, mark as sent, lock entries
- `POST   /api/invoices/[id]/payments` — record payment
- `GET    /api/invoices/[id]/pdf` — generate and download PDF

**Line Items:**
- `POST   /api/invoices/[id]/line-items` — add
- `PATCH  /api/invoice-line-items/[id]` — update
- `DELETE /api/invoice-line-items/[id]` — remove

**Files:**
- `POST   /api/files/upload` — get presigned upload URL
- `DELETE /api/files/[id]` — delete file
- `GET    /api/files/[id]/download` — generate signed download URL

**Templates:**
- `GET    /api/templates` — list
- `POST   /api/templates` — create from project
- `POST   /api/templates/[id]/apply` — create project from template
- `DELETE /api/templates/[id]` — delete

**Notifications:**
- `GET    /api/notifications` — list (unread first)
- `PATCH  /api/notifications/[id]/read` — mark as read
- `POST   /api/notifications/mark-all-read` — mark all read

**Business Profile:**
- `GET    /api/business-profile` — get
- `PATCH  /api/business-profile` — update

**Settings:**
- `GET    /api/settings/account` — get
- `PATCH  /api/settings/account` — update name/email
- `POST   /api/settings/change-password` — change password
- `POST   /api/settings/delete-account` — delete account (cascade)
- `GET    /api/settings/export` — GDPR data export
- `GET    /api/settings/notifications` — get prefs
- `PATCH  /api/settings/notifications` — update prefs

**Search:**
- `GET    /api/search?q=` — full-text search across clients, projects, tasks

**Calendar Blocked Time** (Audit fix #7):
- `GET    /api/calendar/blocked-time` — list blocked time entries for a date range
- `POST   /api/calendar/blocked-time` — create blocked time (vacation, personal day)
- `PATCH  /api/calendar/blocked-time/[id]` — update
- `DELETE /api/calendar/blocked-time/[id]` — delete

**Activity Log** (Audit fix #14):
- `GET    /api/activity` — recent activity for current user (for dashboard feed)
- `GET    /api/activity?entity_type=client&entity_id=X` — activity for a specific entity (for client detail activity tab)

**Portal:**
- `GET    /api/portal/[token]` — get project data (no auth required)

**Health:**
- `GET    /api/health` — database connectivity check

### B.5 Deletion Cascade Logic

Implement APPLICATION-PLAN.md §5.5 in service layer (not just Prisma cascades).

**Audit fix #4 applied:** Sent/paid invoices are preserved by setting `client_id = null` and `project_id = null` — the snapshot fields (`client_name`, `client_email`, `client_address`, `project_name`, `from_business_name`, `from_address`, `from_logo_url`) retain all display information. FKs are now nullable to support this.

| Delete | Cascade (hard delete) | Preserve | Side Effects |
|--------|----------------------|----------|-------------|
| **Client** | All projects (→ cascade below), draft invoices | Sent/paid invoices (set client_id = null; snapshot fields preserved) | Stop all running timers on client's projects |
| **Project** | Tasks, subtasks, time entries, milestones, project-level files, task dependencies | Sent/paid invoices (set project_id = null; snapshot preserved) | Stop all running timers on project; write ActivityLog entries |
| **Task** | Subtasks, task dependencies, task-level files | Time entries (set task_id = null) | Stop timer if running on this task; write ActivityLog entry |
| **Invoice (draft only)** | Line items | — | Unmark time entries (is_invoiced = false), unmark milestones (→ completed) |
| **Time Entry** | — | — | Blocked if is_invoiced = true |
| **Account** | Everything (all entities, sessions, tokens, activity log, blocked time, notification prefs) | — | Set `scheduled_deletion_at` = now(); immediate logout; daily job hard-deletes 30 days later (fix #9) |

---

**DEPENDENCIES:** Phase A must be complete (database exists, auth works).

**ENVIRONMENT VARIABLES:** None new — all set in Phase A.

**QA CHECKPOINT — Sections testable after Phase B:**

| QA Section | What's Testable |
|------------|-----------------|
| §3.3 Client Creation | Validation rules (via API) |
| §4.1a Project Creation | Validation rules (via API) |
| §5.2 Task Detail | Validation rules (via API) |
| §6.1 Time Entries | Validation, manual entry (via API) |
| §7.3 New Invoice | Validation (via API) |
| §12.2 IDOR Tests | All entity isolation — User A cannot access User B's data |
| §12.4 Input Injection | SQL injection attempts rejected via parameterized queries |
| §13.1–13.6 Destructive Actions | All cascade behaviors (via API) |

> **Note:** Phase B is API-only testing (Postman, curl, or automated tests). UI integration happens in Phase C.

---

## PHASE C — Feature Build

> **Goal:** Connect every page in the mockup to real data. Replace mock-data imports with API calls. Each sub-phase delivers a working feature area end-to-end.

### C.1 Auth Pages (Rewire)

Connect existing mockup forms to Phase A API routes.

**Data needed:** User, Session
**User actions:** Sign up, log in, log out, forgot password, reset password, verify email
**Security:** Rate limiting, CSRF, no user enumeration, bcrypt
**Validation:** Zod schemas (email format, password requirements, name length)
**Error handling:** Network errors → toast; 429 → retry countdown; 422 → inline field errors

**Implementation details:**
- Replace static form handlers with `fetch()` to `/api/auth/*`
- Add loading states (button spinner + disabled)
- Add form-level error display
- Redirect authenticated users away from auth pages
- Add verification banner to authenticated layout
- Add "Resend verification" action
- Wire return URL preservation (redirect after login)

### C.2 Dashboard & Today View

**Data needed:** Aggregated stats (active project count, upcoming deadlines, hours this week, outstanding invoice total), recent activity, today's tasks
**User actions:** Navigate to detail pages, start timer from task
**Security:** All data scoped to `session.userId`
**Validation:** N/A (read-only page)
**Error handling:** Partial failure (one widget fails, others load); error boundary per widget

**Implementation details:**
- Dashboard: 4 stat cards with links → each calls a dedicated aggregation endpoint or `GET /api/dashboard`
- Recent activity feed: `GET /api/activity` → reads from `ActivityLog` table (fix #14), showing latest actions (client created, task completed, invoice sent, etc.)
- Today view: `GET /api/tasks?due_date=today&include_overdue=true` grouped by project/client
- Empty state for new users: onboarding prompts ("Add your first client →")
- Start timer action: `POST /api/timer/start` with task_id

### C.3 Clients

**Data needed:** Client list, client detail (with projects, invoices, activity tabs)
**User actions:** Create, edit, archive, delete client; add project from client
**Security:** `user_id` scoping on all queries; ownership checks on mutations
**Validation:** Name required (max 200), email format, hourly_rate non-negative, payment_terms positive
**Error handling:** 404 (invalid ID), 403 (not owner), 409 (concurrent edit), network errors

**Implementation details:**
- Client list: `GET /api/clients` with search + archive filter → replace mock data
- Client detail: `GET /api/clients/[id]` → tabs load projects, invoices, activity (from `ActivityLog` — fix #14)
- Create: modal form → `POST /api/clients` → redirect to detail or list
- Edit: inline or modal → `PATCH /api/clients/[id]`
- Archive: `PATCH /api/clients/[id]/archive` with unpaid invoice warning
- Delete: cascade warning → `DELETE /api/clients/[id]`

### C.4 Projects

**Data needed:** Project list, project detail (overview, board, list view), milestones, files, portal token
**User actions:** Create project (with billing type, budget, template), edit, change status, manage milestones, manage portal, drag tasks on board
**Security:** `user_id` scoping; portal token read-only; status transition guards
**Validation:** Name required, billing type required, conditional rate/price, deadline future, budget non-negative
**Error handling:** Status transition blocks (Cancelled → Active), timer stop on status change, 404/403

**Implementation details:**
- Project list: `GET /api/projects` with client/status filters
- Project creation: multi-field form → `POST /api/projects` (with optional template)
- Board view: `GET /api/projects/[id]/tasks` → render Kanban columns via @dnd-kit
  - Drag-and-drop: `PATCH /api/tasks/[id]` to update status + position
  - Optimistic updates: move card immediately, revert on API failure
- List view: same data, table layout with sort + bulk actions
- Overview: project summary + milestones CRUD + file management + portal token
- Status changes: `PATCH /api/projects/[id]` with side effects (stop timers, warn on incomplete tasks)
- Templates: `GET/POST/DELETE /api/templates`

### C.5 Tasks

**Data needed:** Cross-project task list, task detail (subtasks, files, time entries, notes, dependencies)
**User actions:** Filter/sort tasks, create/edit/delete task, add subtasks, attach files, log time, add notes, manage dependencies, start timer
**Security:** `user_id` scoping; file download via signed URLs
**Validation:** Title required (max 500), no self-dependency, same-project dependency
**Error handling:** 404/403, file upload failure, concurrent edits (409)

**Implementation details:**
- Cross-project list: `GET /api/tasks` with multi-filter support
- Task detail slide-over: `GET /api/tasks/[id]` with full relations
- Subtask CRUD: inline within slide-over
- File upload: Uploadthing presigned upload, attach to task
- Dependencies: add/remove with validation
- Timer integration: start/stop from task detail

### C.6 Time Tracking

**Data needed:** Time entry list, active timer state
**User actions:** Start/stop/discard timer, add manual entry, edit/delete entries, filter, export, group by day/client/project
**Security:** `user_id` scoping; invoiced entries are read-only
**Validation:** Duration 1–1440 min, start_time not future, end_time after start
**Error handling:** Timer conflicts (starting new while one runs → auto-pause), invoiced entry protection

**Implementation details:**
- Timer bar (global component in authenticated layout):
  - `GET /api/timer/current` on mount → show bar if timer running
  - Timer display: compute elapsed from `start_time` + server sync on focus
  - Stop: `POST /api/timer/stop` → create entry
  - Start new: `POST /api/timer/start` → auto-pause existing
- Time entries page: `GET /api/time-entries` with filters + grouping
- Manual entry form: `POST /api/time-entries`
- Export: `GET /api/time-entries/export?format=csv`
- Billable toggle: affects `amount` calculation (duration × hourly_rate)

### C.7 Invoicing

**Data needed:** Invoice list, invoice detail (line items, payments), new invoice wizard, business profile
**User actions:** Create invoice (wizard), edit draft, send, record payment, export PDF
**Security:** `user_id` scoping; draft-only editing; invoiced entries locked
**Validation:** At least one line item, total > 0, payment ≤ balance, business profile required for send
**Error handling:** Send failure, PDF generation failure, concurrent payment race condition

**Implementation details:**
- Invoice list: `GET /api/invoices` with status/client filters
- Invoice detail: `GET /api/invoices/[id]` with line items + payments
  - **Display from snapshot fields** (`client_name`, `from_business_name`, etc.) for sent invoices, not from live FK lookups (fix #10)
- New invoice wizard (3 steps):
  1. Select client → `GET /api/clients`
  2. Select project → `GET /api/projects?client_id=X`
  3. Select time entries or milestones → `GET /api/time-entries?project_id=X&is_invoiced=false&is_billable=true` or `GET /api/milestones?project_id=X&status=completed`
  4. Review + adjust → `POST /api/invoices`
- **Invoice number assignment** (fix #8): Use atomic SQL to prevent race condition:
  ```sql
  UPDATE business_profiles SET next_invoice_number = next_invoice_number + 1
  WHERE user_id = $1 RETURNING next_invoice_number - 1 AS assigned_number
  ```
  Wrap in a transaction with invoice creation. The composite unique `@@unique([userId, invoiceNumber])` (fix #12) is the safety net.
- **Snapshot fields** populated on invoice creation (fix #10): `client_name`, `client_email`, `client_address`, `project_name`. On send: also populate `from_business_name`, `from_address`, `from_logo_url` from current BusinessProfile.
- **issued_date** set to null on draft creation; set to current date on Draft → Sent transition (fix #11)
- Send: `POST /api/invoices/[id]/send` → email via Resend, mark entries as invoiced, write ActivityLog entry
- Record payment: `POST /api/invoices/[id]/payments` → update status
- PDF: `GET /api/invoices/[id]/pdf` → @react-pdf/renderer (uses snapshot fields, not live lookups)
- Business profile: `GET/PATCH /api/business-profile`
- Invoice overdue automation (with fix #15): Scheduled function checks daily: `WHERE status IN ('sent','partial') AND due_date < today AND balance_due > 0` → set status = 'overdue', create notification. **Once overdue, partial payments keep status as Overdue** (prevents Partial ↔ Overdue oscillation and duplicate notifications)

### C.8 Calendar

**Data needed:** Task due dates, project deadlines, blocked time (stored in `CalendarBlockedTime` table — fix #7)
**User actions:** Navigate months, click deadline → navigate to entity, add/edit/delete blocked time
**Security:** `user_id` scoping on all queries
**Validation:** Blocked time: title required, start_date ≤ end_date
**Error handling:** Minimal (read-heavy page)

**Implementation details:**
- Calendar data: `GET /api/calendar?month=2026-03` → returns tasks with due_date, projects with deadline, blocked time from `CalendarBlockedTime` table
- Blocked time CRUD: `POST/PATCH/DELETE /api/calendar/blocked-time` (fix #7 — new entity and API)
- Build calendar grid with date-fns
- Color-code by client
- Blocked time shown in distinct style (grayed out, hatched pattern)
- Mobile: switch to agenda/list view

### C.9 Settings & Search

**Data needed:** User account, notification preferences, search results
**User actions:** Change name/email/password, delete account, export data, toggle notifications, search
**Security:** Password change requires current password; email change requires verification; account delete requires confirmation
**Validation:** Per APPLICATION-PLAN.md §6.3
**Error handling:** Wrong current password, email already taken, export generation failure

**Implementation details:**
- Account: `GET/PATCH /api/settings/account`, `POST /api/settings/change-password`, `POST /api/settings/delete-account`
- Account deletion: sets `User.scheduled_deletion_at = now()` (fix #9); immediate logout; daily scheduled job hard-deletes 30 days later
- GDPR export: `GET /api/settings/export` → generate JSON archive of all user data (includes activity log, blocked time, notification prefs)
- Notification settings: `GET/PATCH /api/settings/notifications` → reads/writes `NotificationPreference` table (fix #5)
- Search: `GET /api/search?q=` → PostgreSQL full-text search via GIN indexes → results grouped by type
  - Debounce on client (300ms)
  - Highlight matching terms in snippets

### C.10 Client Portal

**Data needed:** Project name, task statuses, milestones (for fixed-price), file upload area
**User actions:** View project status (read-only), upload files (if enabled)
**Security:** Token-based (no auth); read-only; no financials exposed; file upload sandboxed
**Validation:** Valid token required
**Error handling:** Invalid/revoked token → error page

**Implementation details:**
- `GET /api/portal/[token]` → returns project summary (no auth middleware)
- File upload: files created with `upload_source = 'portal'` (fix #20) — distinguishable from owner uploads; restricted to portal sandbox storage
- No sensitive data (hourly rates, budgets, invoices) exposed

### C.11 Notifications System

**Implementation details:**
- **Bell component** in authenticated layout header: `GET /api/notifications?unread=true` → badge count
- **Dropdown**: list of notifications with type icon, message, timestamp
- **Mark read**: `PATCH /api/notifications/[id]/read`
- **Mark all read**: `POST /api/notifications/mark-all-read`
- **Click**: navigate to `reference_type` (now enum: task/project/invoice — fix #19) / `reference_id`
- **Notification triggers** (background/scheduled):
  - Read user's `NotificationPreference` record (fix #5) to determine which notifications are enabled
  - Deadline reminder: daily check for tasks due within `deadline_reminder_days` (from NotificationPreference)
  - Budget alert: on time entry creation, check project budget threshold
  - Overdue invoice: daily check (described in C.7)
  - In-app: create Notification record (if `in_app_channel_enabled`)
  - Email: send via Resend (if `email_channel_enabled` and not within `quiet_hours_start`–`quiet_hours_end`)

---

**DEPENDENCIES:** Phase A (auth) and Phase B (data layer) must be complete.

**ENVIRONMENT VARIABLES (new in Phase C):**

| Variable | Source | Purpose |
|----------|--------|---------|
| `UPLOADTHING_SECRET` | Uploadthing dashboard | File upload signing |
| `UPLOADTHING_APP_ID` | Uploadthing dashboard | File upload config |

**QA CHECKPOINT — Sections testable after Phase C:**

| QA Section | What's Testable |
|------------|-----------------|
| §1.1 Landing Page | Full section (already works from mockup) |
| §1.6 Client Portal | Full section |
| §2.1 Dashboard | Full section including empty state, stat cards, navigation |
| §2.2 Today View | Full section |
| §3.1 Client List | Full section |
| §3.2 Client Detail | Full section |
| §3.3 Client Creation | Full section |
| §4.1 Project List | Full section |
| §4.1a Project Creation | Full section |
| §4.2 Project Overview | Full section including milestones, portal, budget alerts |
| §4.3 Board View | Full section including drag-and-drop |
| §4.4 List View | Full section |
| §4.5 Templates | Full section |
| §5.1 Task List | Full section |
| §5.2 Task Detail | Full section |
| §6.1 Time Entries | Full section |
| §6.2 Active Timer | Full section |
| §7.1 Invoice List | Full section |
| §7.2 Invoice Detail | Full section |
| §7.3 New Invoice | Full section |
| §7.4 Business Profile | Full section |
| §8.1 Calendar | Full section |
| §9.1 Account Settings | Full section |
| §9.2 Notification Settings | Full section |
| §9.3 Search | Full section |
| §10.1 Navigation | Full section |
| §10.2 Notifications Bell | Full section |
| §11.1–11.10 Cross-Page Flows | All flows |

> **After Phase C, the app is functionally complete.** Every feature works end-to-end. Phases D and E harden it for production.

---

## PHASE D — Polish & Hardening

> **Goal:** Every loading state, empty state, error state, and edge case is handled. The app feels polished and professional on every device.

### D.1 Loading States

Add skeleton loaders for every data-dependent view:

| Page | Skeleton |
|------|----------|
| Dashboard | 4 stat cards shimmer + activity feed skeleton |
| Client list | Card/row skeletons × 6 |
| Client detail | Header skeleton + tab content skeleton |
| Project list | Card skeletons × 6 |
| Board view | 5 column skeletons with card placeholders |
| Task list | Table row skeletons × 10 |
| Task detail | Slide-over with field skeletons |
| Time entries | Row skeletons × 10 |
| Invoice list | Table row skeletons × 10 |
| Calendar | Grid skeleton with placeholder dots |
| Search results | Grouped skeletons by type |

**Implementation:** Use React Suspense boundaries where possible. Client components use loading state from SWR/React Query fetch hooks.

### D.2 Empty States

Verify every list/table has a meaningful empty state with a CTA:

| Page | Empty State Message | CTA |
|------|-------------------|-----|
| Dashboard (new user) | Welcome message | "Add your first client →", "Set up business profile →" |
| Client list | "No clients yet." | "Add your first client" button |
| Project list | "No projects yet." | "Create your first project" button |
| Board (no tasks) | "No tasks yet." | "Add your first task →" |
| Task list (no tasks) | "No tasks yet." | Link to projects |
| Time entries | "No time tracked yet." | "Start a timer" or "Log time" |
| Invoice list | "No invoices yet." | "Create your first invoice" |
| Calendar (no events) | "No upcoming deadlines." | Link to projects |
| Templates | "No templates yet." | "Create a template" |
| Search (no results) | "No results found for '{query}'" | — |
| Notifications | "All caught up!" | — |

### D.3 Error Pages

- **`/not-found.tsx`** (404): "We couldn't find what you're looking for." + link to dashboard
- **`/error.tsx`** (500): "Something went wrong on our end." + "Return to Dashboard" button + Sentry error ID
- **Error boundary** per major section: isolate failures (one widget crash doesn't take down the page)

### D.4 Toast Notifications

Add a toast system for transient feedback:
- Success: "Client created", "Invoice sent", "Time entry saved"
- Error: "That action couldn't be completed", "Network error"
- Warning: "This client has outstanding invoices"
- Use a lightweight library (sonner or react-hot-toast)

### D.5 Optimistic Updates

Implement for high-frequency actions:
- Kanban drag-and-drop → move card immediately, revert on failure
- Subtask toggle → flip checkbox immediately, revert on failure
- Timer start/stop → update UI immediately

### D.6 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements reachable via Tab; focus order matches visual order |
| Focus indicators | Visible focus ring (Tailwind `ring`) on all interactive elements |
| Skip-to-content | Link at top of every page |
| Screen reader | `<label>` on all form fields; `aria-describedby` for errors; `aria-live` for dynamic content |
| Modal focus trap | Focus trapped inside modals/slide-overs; Escape closes |
| Kanban keyboard | @dnd-kit keyboard sensor for arrow-key task movement |
| Color contrast | WCAG AA (4.5:1 text, 3:1 large text) — verify with contrast checker |
| Status indicators | Use text + color (not color alone) for all status badges |
| Progress bars | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Reduced motion | Respect `prefers-reduced-motion` media query |

### D.7 Mobile Responsiveness

Verify all pages at these breakpoints:
- 320px (small phone)
- 375px (standard phone)
- 768px (tablet portrait)
- 1024px (tablet landscape)
- 1280px+ (desktop)

Key mobile adaptations:
- Sidebar → bottom nav with "More" overlay
- Kanban columns → horizontal scroll
- Tables → card layout or horizontal scroll
- Modals/slide-overs → full screen
- Touch targets → min 44×44px
- Date pickers → mobile-friendly
- Calendar → agenda/list view

### D.8 Offline Handling

- Detect network status: `navigator.onLine` + `online`/`offline` events
- Show persistent banner: "You're offline. Changes will sync when you reconnect."
- Disable server-dependent actions (form submits, timer operations)
- Re-enable on reconnect

### D.9 Form Data Preservation

- On session expiry mid-form: save form state to `localStorage`
- After re-login: restore form state from `localStorage` and clear
- Applies to: all create/edit forms, invoice wizard

### D.10 Meta Tags & SEO

- Root `<title>` and `<meta description>` for landing page (SEO)
- `<title>` per page (e.g., "Dashboard | TaskFlow", "Client: Acme Corp | TaskFlow")
- OpenGraph tags for landing page (social sharing)
- `robots: noindex` on all authenticated pages
- Favicon and web manifest

---

**DEPENDENCIES:** Phase C must be complete (all features working).

**ENVIRONMENT VARIABLES:** None new.

**QA CHECKPOINT — Sections testable after Phase D:**

| QA Section | What's Testable |
|------------|-----------------|
| §10.3 HTTP Error Responses | All error codes (400, 401, 403, 404, 409, 413, 422, 429, 500) |
| §10.4 Client-Side Errors | Offline banner, timeout retry, optimistic revert, session expiry form save |
| §10.5 Error Boundary | Component crash → fallback UI |
| §14.4 Network Resilience | Slow 3G, network drop, offline/online |
| §15.1 Keyboard Navigation | Tab order, Enter/Space, Escape, skip-to-content |
| §15.2 Screen Reader | Labels, aria attributes, live regions |
| §15.3 Visual Accessibility | Contrast, focus indicators, no color-only info, reduced motion |
| §16.1 Desktop Browsers | Chrome, Firefox, Safari, Edge |
| §16.2 Mobile Browsers | iOS Safari, Android Chrome, Samsung Internet |
| §16.3 Responsive Breakpoints | 320px through 1280px+ |
| §17.2 Back/Forward | Unsaved changes warning, no re-submit |
| §17.4 Paste Bomb | 100KB+ text handling |
| §17.5 Autofill | Password manager compatibility |
| §17.8 Refresh Mid-Action | Form reset, no duplicates |
| §17.9 Deep Linking | Bookmarks, filtered view URLs, return after expiry |
| §17.10 Zoom | 200% zoom, mobile pinch-to-zoom |

---

## PHASE E — Security & Production Readiness

> **Goal:** Security audit, performance validation, monitoring, and documentation. After this phase, the app is ready for real users.

### E.1 Security Audit

Systematic pass through APPLICATION-PLAN.md §4 and QA-CHECKLIST.md §12:

**Authentication (§4.1):**
- [ ] Verify bcrypt cost factor is 12
- [ ] Verify session cookie flags: Secure, HttpOnly, SameSite=Strict
- [ ] Verify idle timeout (7 days) and absolute timeout (30 days)
- [ ] Verify password change invalidates all other sessions
- [ ] Verify password reset tokens are single-use, expire in 1 hour
- [ ] Verify email verification tokens are single-use, prior tokens invalidated on resend

**Authorization (§4.2):**
- [ ] Every API endpoint checks `user_id` ownership
- [ ] IDOR test: attempt access to every entity type with another user's ID → 403/404
- [ ] Portal: verify no financial data, internal IDs, or write access exposed
- [ ] File download: verify signed URLs expire and are user-scoped

**Rate Limiting (§4.3):**
- [ ] Verify all rate limits from table are enforced
- [ ] Verify `Retry-After` header in 429 responses
- [ ] Verify rate limits apply per-IP for public endpoints and per-user for authenticated

**Input Validation (§4.4):**
- [ ] SQL injection: test all text fields with injection payloads → parameterized queries prevent
- [ ] XSS: test all rendered fields with `<script>` payloads → HTML-escaped
- [ ] CSRF: verify all state-changing requests require valid origin/CSRF token
- [ ] File upload: verify MIME type + extension allowlist, 25 MB max, malicious content scan

**Data Protection (§4.5):**
- [ ] HTTPS only (HTTP redirects to HTTPS)
- [ ] HSTS header with appropriate max-age
- [ ] Passwords never in API responses
- [ ] Error pages don't expose stack traces, database schemas, or paths
- [ ] API errors don't leak other users' existence

### E.2 Performance Validation

Run through QA-CHECKLIST.md §14:

**Page load targets:**
- [ ] Landing page < 2s
- [ ] Dashboard < 3s (fully interactive)
- [ ] Board with 50 tasks < 3s
- [ ] Client list with 100 clients < 3s

**Data volume tests:**
- [ ] 50 clients → renders correctly
- [ ] 100 projects → renders correctly
- [ ] 200 tasks on board → renders, columns scrollable
- [ ] 1000 time entries → pagination works
- [ ] 100 invoice line items → renders and calculates

**Optimizations to apply if needed:**
- React.memo on heavy components (task cards, list rows)
- Virtual scrolling for long lists (react-window)
- Image optimization for logos
- Database query optimization (check Prisma query log for N+1s)
- Connection pooling (Neon handles this at edge)

### E.3 Concurrent Operation Safety

- [ ] Two tabs editing same entity → 409 Conflict or last-write-wins (no 500)
- [ ] Two tabs with timers → only one active timer enforced server-side
- [ ] Rapid form submissions → debounced client-side + server-side idempotency where critical
- [ ] Simultaneous invoice creation → unique invoice numbers guaranteed (database unique constraint + next_invoice_number atomic increment)

### E.4 Deletion Cascade Verification

Test every cascade from APPLICATION-PLAN.md §5.5 against QA-CHECKLIST.md §13 (with audit fixes applied):

- [ ] Delete client → projects, tasks, subtasks, time entries, milestones, files deleted; sent/paid invoices retained with `client_id = null` + snapshot fields preserved (fix #4)
- [ ] Delete project → tasks, subtasks, time entries, milestones, project files deleted; sent/paid invoices retained with `project_id = null` + snapshot preserved (fix #4)
- [ ] Delete task → subtasks, dependencies, task files deleted; time entries orphaned (task_id = null)
- [ ] Delete draft invoice → line items deleted; time entries unmarked; milestones reset to completed
- [ ] Delete time entry (non-invoiced) → removed
- [ ] Delete account → `scheduled_deletion_at` set (fix #9); daily job hard-deletes 30 days later; all sessions, tokens, activity logs, blocked time, notification prefs included in cascade
- [ ] Verify orphaned invoices display correctly using snapshot fields (no FK lookups on null references)

### E.5 Scheduled Jobs

Set up Netlify Scheduled Functions (or equivalent cron):

| Job | Schedule | Logic |
|-----|----------|-------|
| Invoice overdue check | Daily at midnight UTC | `WHERE status IN ('sent','partial') AND due_date < today AND balance_due > 0` → set status = 'overdue', create notification. Once overdue, stays overdue even with partial payments (fix #15) |
| Deadline reminders | Daily at 8am user timezone | Check `NotificationPreference.deadline_reminder_days` (fix #5); tasks due within window → create notification (if enabled) |
| Session cleanup | Weekly | `DELETE FROM sessions WHERE expires_at < now() OR last_active_at < now() - INTERVAL '7 days'` (fix #1 — database sessions) |
| Token cleanup | Weekly | Delete expired/used PasswordResetTokens and EmailVerificationTokens (fixes #2, #3) |
| Account deletion | Daily | `DELETE FROM users WHERE scheduled_deletion_at < now() - INTERVAL '30 days'` (fix #9) — cascade all owned data |
| Activity log pruning | Monthly | Delete activity log entries older than 90 days to prevent unbounded growth (fix #14) |

### E.6 Monitoring & Health Checks

- **Health endpoint**: `GET /api/health` → checks database connectivity, returns status + latency
- **Sentry**: runtime errors, unhandled rejections, API route failures
- **Netlify Analytics**: page views, function invocations, error rates
- **Database monitoring**: Neon dashboard for query performance, connection count

### E.7 Backup Verification

- Neon provides automatic daily backups with point-in-time recovery
- Verify: restore from backup to a test database → data intact
- Document backup retention period (match APPLICATION-PLAN.md §4.5: 90 days)

### E.8 Security Headers Audit

Verify `netlify.toml` security headers:
- [ ] `Content-Security-Policy` — restrictive policy matching actual resource origins
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — disable unused browser features

### E.9 Documentation

- [ ] Update `README.md` with setup instructions, env vars, deployment
- [ ] Document all API endpoints (OpenAPI/Swagger or markdown)
- [ ] Document database schema and migration process
- [ ] Document scheduled job setup and monitoring
- [ ] Create runbook for common operations (reset user password, debug failed emails, check rate limit status)

---

**DEPENDENCIES:** Phases A–D must be complete.

**ENVIRONMENT VARIABLES:** None new — verify all existing vars are set correctly in production.

**QA CHECKPOINT — Sections testable after Phase E (FINAL):**

| QA Section | What's Testable |
|------------|-----------------|
| §12.1 Auth Bypass | Complete pass |
| §12.2 IDOR | Complete pass (all entities) |
| §12.3 Rate Limiting | Complete pass (all endpoints) |
| §12.4 Injection | Complete pass (SQL, XSS, CSRF) |
| §12.5 File Upload Security | Complete pass |
| §12.6 Session Security | Complete pass |
| §12.7 Data Protection | Complete pass |
| §13.1–13.6 Destructive Actions | Complete pass (all cascades verified) |
| §14.1 Page Load Times | Complete pass (benchmarked) |
| §14.2 Data Volume | Complete pass (stress tested) |
| §14.3 Concurrent Operations | Complete pass |
| §17.1 Double-Click | Complete pass (all forms) |
| §17.3 Multi-Tab | Complete pass |
| §17.6 Locale | Complete pass |
| §17.7 File Upload Interruptions | Complete pass |
| §17.11 Browser Extensions | Complete pass |
| §17.12 Rapid Navigation | Complete pass |
| §17.13 Right-Click / Open in New Tab | Complete pass |
| §17.14 Drag-and-Drop Edge Cases | Complete pass |
| §17.15 Timer Drift | Complete pass |

---

## Phase Summary

| Phase | Duration Estimate | What's Built | Total QA Sections Testable |
|-------|-------------------|-------------|---------------------------|
| **A — Foundation** | — | Auth, DB, email, deploy pipeline | 15 sections |
| **B — Core Data** | — | All tables, all API routes, validation | +8 sections (23 total) |
| **C — Feature Build** | — | Every page wired to real data | +27 sections (50 total) |
| **D — Polish** | — | Loading, empty, error states; a11y; mobile; offline | +16 sections (66 total) |
| **E — Security** | — | Security audit, perf, monitoring, docs | +18 sections (**all 84 QA sub-sections**) |

---

## Full Environment Variables Reference

| Variable | Phase | Required |
|----------|-------|----------|
| `DATABASE_URL` | A | Yes |
| `SESSION_SECRET` | A | Yes — 32+ char random string for signing session cookies (replaces iron-session — fix #1) |
| `RESEND_API_KEY` | A | Yes |
| `UPSTASH_REDIS_REST_URL` | A | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | A | Yes |
| `SENTRY_DSN` | A | Yes |
| `NEXT_PUBLIC_APP_URL` | A | Yes |
| `UPLOADTHING_SECRET` | C | Yes |
| `UPLOADTHING_APP_ID` | C | Yes |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Neon cold start latency | First request after idle may be slow (~500ms) | Neon auto-scaling; keep-alive ping from health check |
| Netlify function timeout (10s default) | PDF generation or data export could timeout | Increase to 26s max; stream large exports; generate PDFs async |
| Uploadthing free tier limits | 2 GB storage, 2 GB bandwidth/month | Monitor usage; upgrade if needed; warn users on approaching limits |
| Resend free tier limits | 100 emails/day | Monitor usage; upgrade if users send many invoices; queue overflow to next day |
| Database session table growth | Session records accumulate over time | Weekly cleanup job deletes expired sessions (fix #1); index on expires_at |
| Activity log table growth | ActivityLog records accumulate indefinitely | Monthly pruning job deletes entries older than 90 days (fix #14) |
| Full-text search performance | GIN indexes may slow writes on large datasets | Monitor Neon query performance; consider dedicated search (Typesense) if needed |
| Prisma serverless bundle size | Large Prisma client in serverless functions | Use Prisma Accelerate or Prisma Data Proxy if cold starts exceed 3s |

---

*This plan should be treated as a living document. Update it as implementation decisions are made and as the QA-CHECKLIST.md evolves.*
