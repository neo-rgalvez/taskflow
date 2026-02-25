# TaskFlow — Edge Case Audit

> Systematic review of five edge case categories against IMPLEMENTATION-PLAN.md.
> For each scenario: is the behavior specified? If not, what should it be?

---

## Summary

**31 issues found:** 5 Critical, 8 High, 12 Medium, 6 Low

| Category | Issues | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| 1. Session expiry mid-edit | 6 | 1 | 2 | 2 | 1 |
| 2. Entity deleted while being viewed | 5 | 1 | 2 | 2 | 0 |
| 3. Concurrent edits (two tabs) | 7 | 1 | 2 | 3 | 1 |
| 4. Large data / pagination | 8 | 1 | 1 | 4 | 2 |
| 5. External service failures | 5 | 1 | 1 | 1 | 2 |

---

## 1. Session Expiry Mid-Edit

**What the plan currently says:** D.9 mentions "On session expiry mid-form: save form state to localStorage. After re-login: restore form state from localStorage and clear. Applies to: all create/edit forms, invoice wizard." A.3 specifies 7-day idle timeout, 30-day absolute max.

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 1 | **Critical** | D.9 | **No detection mechanism specified.** How does the app know the session expired? A 401 from a `fetch()` call? A periodic heartbeat? SWR background revalidation? Without a detection mechanism, D.9's localStorage save never triggers. | Add to D.9: "Detection: every API response is checked by a centralized `fetch` wrapper. On 401 status: (1) save current form state to `localStorage` keyed by route path, (2) redirect to `/login?returnUrl=<current_path>`, (3) on post-login redirect, check `localStorage` for saved state and hydrate the form." |
| 2 | **High** | D.9, C.6 | **Running timer during session expiry.** User has a timer running, session expires while they're idle, they return. The timer has been counting since `start_time` on the server. But the client may show a stale elapsed time or fail to sync. | Add to D.9: "Timer resilience: timer continues server-side (tracked by `start_time`). On session expiry + re-login, `GET /api/timer/current` restores timer bar with correct elapsed time computed from `start_time`." |
| 3 | **High** | D.9, C.7 | **Invoice wizard mid-expiry.** The wizard has 4 steps with accumulated state (selected client, project, line items). Session expires at step 3. Saving just "form state" is ambiguous — which step, which selections? | Add to D.9: "Invoice wizard: serialize full wizard state (current step index, selected client ID, project ID, selected entry/milestone IDs, custom line items, tax rate, notes) to `localStorage` under key `invoice-wizard-draft`. Restore on return. Clear on successful save or intentional discard." |
| 4 | **Medium** | D.9 | **Drag-and-drop in progress when API returns 401.** User drags a task, optimistic update moves the card, the PATCH request returns 401. The card should revert, but the user also gets redirected to login. | Add to D.9: "Optimistic revert on 401: if an in-flight request returns 401, first revert any optimistic UI updates, then trigger the session-expiry redirect. Do not save board state to localStorage (board state is server-authoritative)." |
| 5 | **Medium** | D.9 | **Multiple in-flight requests at expiry.** User submits a form and the session check fails. But SWR hooks may also be refetching in the background. Multiple 401s could trigger multiple redirects or multiple localStorage writes. | Add to D.9: "Deduplicate 401 handling: use a module-level `isRedirecting` flag in the fetch wrapper. First 401 triggers save + redirect. Subsequent 401s within the same tick are no-ops." |
| 6 | **Low** | D.9 | **localStorage key collision.** If the user has two tabs open on different forms when the session expires, both may write to localStorage. Keys should be unique per route + form. | Add to D.9: "localStorage keys follow pattern `taskflow:form:<route_path>` (e.g., `taskflow:form:/clients/new`). Each form page reads and clears only its own key on mount." |

---

## 2. Entity Deleted While Being Viewed

**Context:** TaskFlow is single-user, so "admin deletes something" means the user deletes via cascade from another tab or another entity. For example: user deletes a client in Tab A → cascade deletes the client's projects → Tab B is viewing one of those projects.

**What the plan currently says:** B.5 specifies deletion cascades. D.3 specifies 404/500 error pages. No mention of stale-view handling.

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 7 | **Critical** | B.5, C.4, D.3 | **No stale-view recovery path.** User is on `/projects/123/board`, switches to another tab, deletes the parent client (cascade deletes the project), switches back. The board still shows stale tasks. Any action (drag, create task) will fail with 404. The plan specifies no behavior for this. | Add new section D.11 "Stale Data Recovery": "Every data-fetching hook (`useSWR`/`fetch`) handles 404 on revalidation. On 404 from a detail page API call: (1) show a non-blocking toast 'This [entity] has been deleted', (2) redirect to parent list page after 2 seconds, (3) revalidate the list cache. On 404 from a mutation: show toast 'This [entity] no longer exists' and redirect." |
| 8 | **High** | C.7, B.5 | **Invoice wizard for a deleted project.** User starts the invoice wizard, selects a client and project. In another tab (or the same session after navigating away), they delete the client. They return to the wizard and click "Save". The `POST /api/invoices` call fails because `client_id` and `project_id` no longer exist. | Add to C.7: "Invoice creation validates that `client_id` and `project_id` still exist in the transaction that creates the invoice. On FK violation, return 404 with message 'The selected client or project no longer exists. Please start over.' Frontend: show error and reset wizard to step 1." |
| 9 | **High** | C.5, B.5 | **Task detail open during parent project deletion.** User has task detail slide-over open. Project is deleted (via client cascade or directly). Next subtask toggle or note addition fails with 404. No graceful handling. | Add to D.11: "Task detail: on 404 from any mutation, close slide-over, show toast 'This task has been deleted', refresh parent project view (which will also 404 and redirect to project list)." |
| 10 | **Medium** | C.6, B.5 | **Time entry edit on a deleted project.** User opens a time entry edit form for a project that gets cascade-deleted. Save returns 404. The entry may have been orphaned (task_id set to null) or deleted depending on cascade rules. | Add to D.11: "Time entry mutations: on 404, show toast and refresh the time entries list. If the entry was orphaned (task deleted but entry preserved), it remains editable." |
| 11 | **Medium** | C.3, C.4 | **Client/project detail page background refresh finds deleted entity.** SWR revalidates on focus. If the entity was deleted between tab switches, the revalidation returns 404. Currently no handler for this. | Covered by D.11 recommendation in issue #7: "On 404 during SWR revalidation, redirect to parent list with toast notification." |

---

## 3. Concurrent Edits (Two Tabs, Same Data)

**What the plan currently says:** E.3 mentions "Two tabs editing same entity → 409 Conflict or last-write-wins (no 500)" but does not choose a strategy or specify how conflicts are detected.

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 12 | **Critical** | E.3 | **No conflict detection mechanism chosen.** "409 Conflict or last-write-wins" is a placeholder, not a decision. Without a mechanism (optimistic locking via `updated_at` check, ETags, or explicit version counter), neither strategy can be implemented. The plan has no `If-Match` headers, no version field, and no `WHERE updated_at = ?` in UPDATE queries. | Add to B.3 (API route pattern): "Optimistic locking: every PATCH/PUT request includes `updated_at` from the client's last read. The server compares it against the current `updated_at`. If they differ, return 409 with the current entity data. Client shows: 'This record was modified by another session. Your version: [timestamp]. Current version: [timestamp]. [Reload / Overwrite].' Implementation: add `WHERE id = ? AND updated_at = ?` to all update queries. If zero rows affected + entity exists → 409." |
| 13 | **High** | C.4, E.3 | **Kanban board: two tabs, same board.** Tab A drags a task from "To Do" to "In Progress". Tab B still shows the task in "To Do" and drags it to "Review". Both PATCH requests succeed (last-write-wins). The final position is whatever Tab B sent. Neither tab shows the truth. | Add to C.4: "Board view uses SWR with `revalidateOnFocus: true` and a `refreshInterval` of 30 seconds. On tab focus, the board refetches from server and reconciles. Optimistic moves are reverted if the server state differs. For the conflict itself: with optimistic locking via `updated_at`, the second drag returns 409 and the card snaps back to its server-side position." |
| 14 | **High** | C.7, E.3 | **Two tabs create invoices for the same unbilled time entries.** Tab A selects time entries X, Y, Z and saves the invoice. Tab B (opened earlier with the same unbilled entries) also selects X, Y, Z and saves. Both invoices are created, but the time entries are marked `is_invoiced = true` by the first save. The second save either (a) invoices already-invoiced entries or (b) creates an invoice with zero valid line items. | Add to C.7: "Invoice creation transaction: for each time entry selected, verify `is_invoiced = false` within the transaction. If any are already invoiced, return 409 with list of conflicting entries: 'These time entries have already been invoiced: [list]. Please refresh and try again.' Same check for milestones (status must be 'completed', not 'invoiced')." |
| 15 | **Medium** | C.7, E.3 | **Two tabs record payments on the same invoice.** Tab A records $500 payment. Tab B (showing stale balance) also records $500. Total payments could exceed the invoice total if not guarded. | Add to C.7: "`POST /api/invoices/[id]/payments` validates within a transaction: `SELECT balance_due FROM invoices WHERE id = ? FOR UPDATE`. If `payment_amount > balance_due`, return 422: 'Payment of $X exceeds remaining balance of $Y.' The `FOR UPDATE` lock prevents race conditions." |
| 16 | **Medium** | C.5, E.3 | **Two tabs edit the same task.** Tab A changes the title. Tab B changes the due date. Without optimistic locking, both succeed. With it, the second returns 409. But both are non-conflicting changes. The plan doesn't address field-level vs entity-level conflict resolution. | Add to E.3: "Conflict resolution is entity-level, not field-level. On 409, the client receives the full current entity and the user must manually re-apply their changes. Field-level merging is out of scope (adds significant complexity for a single-user app)." |
| 17 | **Medium** | C.6, E.3 | **Two tabs with the timer.** Tab A starts a timer for Task X. Tab B (stale) shows no timer and starts one for Task Y. `POST /api/timer/start` auto-stops the first timer. But Tab A's timer bar still shows the old timer running. | Add to C.6: "Timer bar polls `GET /api/timer/current` on a 30-second interval. If the response differs from the local state (different task, stopped, etc.), update the timer bar. On tab focus, immediately sync." |
| 18 | **Low** | C.3, E.3 | **Two tabs: one archives a client while the other creates a project for that client.** The project creation may succeed for an archived client if the archive flag isn't checked in project creation validation. | Add to B.2: "Project creation validation: reject if `client.is_archived = true`. Return 422: 'Cannot create a project for an archived client.'" |

---

## 4. Large Data / Pagination

**What the plan currently says:** E.2 lists data volume targets (50 clients, 200 tasks on board, 1000 time entries). API routes in B.4 specify list endpoints but no pagination parameters.

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 19 | **Critical** | B.3, B.4 | **No pagination pattern defined anywhere.** Not a single list endpoint specifies `limit`, `offset`, `cursor`, page size, or pagination response format. Every `GET /api/[entities]` returns all records. With 500 tasks or 1000 time entries, this will cause timeouts, memory issues, and slow renders. | Add new section B.6 "Pagination Pattern": "All list endpoints use cursor-based pagination. Request: `?cursor=<last_id>&limit=<n>` (default limit 25, max 100). Response: `{ data: [...], nextCursor: string|null, hasMore: boolean }`. Endpoints: `/api/clients`, `/api/projects`, `/api/tasks`, `/api/time-entries`, `/api/invoices`, `/api/notifications`, `/api/activity`, `/api/search`. Exceptions: `/api/projects/[id]/tasks` (board view loads all tasks in project — capped at 500), `/api/invoices/[id]/line-items` (all items loaded — typically < 50)." |
| 20 | **High** | C.4 | **Board view with 200+ tasks.** All tasks for a project are loaded at once for the Kanban board. With 200+ tasks across 5 columns, this is a large DOM. No virtualization or lazy loading is specified. | Add to C.4: "Board view: load all tasks (project-scoped, typically < 200). If > 100 tasks in a column, virtualize the column with `react-window`. Show column task count in header. If a project exceeds 500 tasks total, show a warning and offer list view as alternative." |
| 21 | **Medium** | C.6 | **Time entries list with 1000+ entries.** Filtering by date range helps, but no default date range is specified. Without one, the first load fetches ALL time entries ever. | Add to C.6: "Time entries page defaults to current month date range. User can expand. API uses cursor pagination (B.6). Summary stats (total hours, billable amount) are computed server-side for the filtered range and returned alongside paginated data." |
| 22 | **Medium** | C.2 | **Activity feed unbounded.** `GET /api/activity` has no limit. A long-time user could have thousands of activity log entries. | Add to C.2: "Activity feed: load last 20 entries. 'Load more' button fetches next page via cursor. Activity log entries are pruned at 90 days (E.5) so max theoretical size is bounded." |
| 23 | **Medium** | C.9 | **Search results unbounded.** `GET /api/search?q=` returns all matches. A broad query on a large dataset could return hundreds of results. | Add to C.9: "Search results: return top 5 per entity type (clients, projects, tasks) for the dropdown. Full search results page shows 20 per page with load-more. Server limits total results to 100." |
| 24 | **Medium** | C.11 | **Notifications list unbounded.** `GET /api/notifications` returns all notifications. Old notifications accumulate. | Add to C.11: "Notification dropdown: load last 10 unread + 10 recent read. 'View all' link goes to full notifications page with cursor pagination. No pruning — notifications are lightweight and queryable by `is_read` index." |
| 25 | **Low** | C.3 | **Client list at 100+ clients.** Cards/table may be slow to render. | Covered by pagination (B.6). Client list paginates at 25 per page. Search/filter results also paginate. |
| 26 | **Low** | C.8 | **Calendar with 50+ deadlines in one month.** Many tasks and projects with deadlines in the same month. All loaded at once for the calendar grid. | Add to C.8: "Calendar loads all events for the visible month range (single query). For months with > 30 events, collapse into day summary dots. Click to expand a day shows event list. This is a bounded query (one month) so performance is acceptable." |

---

## 5. External Service Failures

**What the plan currently says:** D.8 covers offline detection (browser offline). Risk Register mentions Neon cold start, Netlify function timeout, Uploadthing/Resend free tier limits. No mention of service-level failure handling.

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 27 | **Critical** | A.5, all API routes | **Rate limiter failure mode undefined.** If Upstash Redis is unreachable, every API route that calls `rateLimit.api(req)` will throw. Does the app fail open (allow all requests) or fail closed (block all requests)? Failing closed makes the entire app unusable when Redis is down. Failing open removes rate protection. | Add to A.5: "Rate limiter failure mode: fail open. Wrap `rateLimit.api()` in try/catch. On Redis connection error, log to Sentry and allow the request. Rationale: a temporarily unprotected app is better than a completely broken one. Redis outages are rare and brief." |
| 28 | **High** | C.7, A.4 | **Email service failure during invoice send.** User clicks "Send Invoice". The invoice status is changed to "Sent", time entries are marked as invoiced, then `resend.sendEmail()` fails. The invoice is now "Sent" but the email was never delivered. The user doesn't know. | Add to C.7: "Invoice send is a transaction with email as the last step: (1) Begin transaction. (2) Update invoice status to 'sent', set `issued_date`, populate snapshot fields, mark time entries/milestones. (3) Attempt email send via Resend. (4) If email succeeds: commit transaction, set `sent_at`. (5) If email fails: rollback transaction, return 502 with message 'Invoice could not be sent. The email service is temporarily unavailable. Please try again.' All changes (status, entries, milestones) are reverted." |
| 29 | **Medium** | A.2, all API routes | **Database connection failure.** Neon PostgreSQL is unreachable (outage, network issue, cold start timeout). Every API route and SSR page will fail. The plan has a health endpoint but no graceful degradation. | Add to D.3: "Database unreachable: Prisma throws `PrismaClientInitializationError` or connection timeout. The global error handler catches this and returns 503 with message 'Service temporarily unavailable. Please try again in a few moments.' The error page shows a retry button. Sentry alert fires. `/api/health` returns `{ status: 'unhealthy', database: 'unreachable' }` for monitoring." |
| 30 | **Low** | C.5, C.10 | **File upload service failure.** Uploadthing is unreachable during file upload. The presigned URL request fails. | Add to C.5: "File upload error handling: if Uploadthing presigned URL request fails, show inline error: 'File upload is temporarily unavailable. Please try again later.' Do not block the rest of the form — allow saving the entity without the file." |
| 31 | **Low** | A.7 | **Error tracking service failure.** Sentry is unreachable. Errors are silently dropped. | Add to A.7: "Sentry failure: the Sentry SDK handles its own connection failures silently (does not throw). No action needed. Errors are also logged to `console.error` for Netlify function logs as a secondary record." |

---

## Consolidated Action Items

### New sections to add to IMPLEMENTATION-PLAN.md:

1. **B.6 Pagination Pattern** — cursor-based pagination for all list endpoints
2. **D.11 Stale Data Recovery** — 404 handling on detail pages, SWR revalidation, toast + redirect

### Existing sections to update:

| Section | Addition |
|---------|----------|
| **A.5** | Rate limiter fail-open strategy |
| **A.7** | Sentry failure note |
| **B.2** | Archived client guard on project creation |
| **B.3** | Optimistic locking via `updated_at` check on all PATCH routes |
| **C.4** | Board SWR refresh + virtual scrolling for large columns |
| **C.5** | File upload service failure handling |
| **C.6** | Timer bar polling interval + sync on focus |
| **C.7** | Invoice send as rollback-capable transaction; double-invoice guard on time entries; payment amount lock; wizard state in localStorage |
| **C.8** | Calendar day collapse for dense months |
| **C.9** | Search result limits and pagination |
| **C.11** | Notification dropdown limit |
| **D.3** | Database 503 error page |
| **D.9** | Session expiry detection mechanism, localStorage key pattern, 401 dedup, timer resilience, drag-and-drop revert |
| **E.3** | Entity-level conflict resolution decision; concurrency guards detailed |

---

*All Critical and High issues should be incorporated into IMPLEMENTATION-PLAN.md before development begins.*
