# TaskFlow — Security Audit

> Security-focused review of IMPLEMENTATION-PLAN.md and QA-CHECKLIST.md.
> Every place the app reads or writes data has been checked for: permission model, ownership verification, data leakage, rate limiting, session security, and re-verification of sensitive actions.

---

## Summary

**19 issues found:** 3 Critical, 5 High, 7 Medium, 4 Low

---

## Issues by Severity

| # | Severity | Location | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 1 | **Critical** | Session cookie signing | `SESSION_SECRET` signs session cookies, but plan doesn't specify HMAC algorithm or how session IDs are generated — a weak signing method allows session forgery | Use HMAC-SHA256 for cookie signing. Generate session IDs with `crypto.randomBytes(32)` or `nanoid(32)`. Store hash of session ID in DB (never raw token). Cookie value = `sessionId.hmac(sessionId, SECRET)` |
| 2 | **Critical** | Password reset token in URL | §A.3 sends reset token in email link (`/reset-password/[token]`). Token appears in URL → logged in browser history, server access logs, Referrer headers, and potentially Sentry error reports | 1. Use token as URL param only for initial load. 2. On page load, immediately exchange token via POST (not GET) for a short-lived session. 3. Clear the URL from browser history via `replaceState`. 4. Exclude `/reset-password/*` from Sentry URL capture. 5. Strip `Referer` header on this page via `<meta name="referrer" content="no-referrer">` |
| 3 | **Critical** | GDPR export endpoint | `GET /api/settings/export` returns all user data as JSON archive. No re-authentication required — if session is stolen, attacker gets full data dump including client emails, financials, and business profile | Require password re-entry before initiating export. Apply dedicated rate limit (1 export per hour). Log export events to ActivityLog. Consider generating export async with download link sent via email (prevents session-hijack instant dump) |
| 4 | **High** | Account deletion | `POST /api/settings/delete-account` sets `scheduled_deletion_at` — plan says "requires confirmation" but doesn't specify re-authentication. If session is stolen, attacker can delete the account | Require current password re-entry before processing deletion. This is mentioned in QA §9.1 ("ideally re-entering password") but IMPLEMENTATION-PLAN.md §C.9 doesn't specify it. Make it mandatory, not "ideal" |
| 5 | **High** | Session ID in cookie vs. hash in DB | §A.3 says "look up session by token hash" but the plan doesn't explicitly state that the raw session ID is never stored. If the database is compromised and raw tokens are stored, all sessions are compromised | Store only the SHA-256 hash of the session ID in the `Session.token_hash` column. On each request: hash the cookie value and look up by hash. This way, a database breach doesn't give attackers valid session tokens |
| 6 | **High** | Notification mark-as-read — ownership check | `PATCH /api/notifications/[id]/read` — the plan doesn't mention an ownership check. A user could mark another user's notification as read by guessing/enumerating UUIDs | Add `WHERE user_id = session.userId AND id = :id` to the query. Same applies to `POST /api/notifications/mark-all-read` — scope to `user_id` |
| 7 | **High** | Subtask/dependency routes — ownership via parent | `PATCH /api/subtasks/[id]`, `DELETE /api/subtasks/[id]`, `DELETE /api/task-dependencies/[id]` — these entities don't have `user_id`. Ownership must be verified by joining through parent Task → Project → User. The plan doesn't spell out this join chain | Document that every route for Subtask, TaskDependency, InvoiceLineItem, Payment, and Milestone must join through the parent chain to verify `user_id` ownership. Create a shared helper: `requireOwnershipViaParent(entityType, entityId, userId)` |
| 8 | **High** | Portal token predictability | `Project.portal_token` is described as a unique string but the plan doesn't specify how it's generated. If sequential or short, it can be brute-forced | Generate portal tokens with `nanoid(32)` (URL-safe, cryptographic randomness). Store as-is (not hashed — needed for URL lookup). 32 chars of base64 = ~192 bits of entropy. Add rate limit on portal endpoint: 10 requests/min per IP |
| 9 | **Medium** | Email change — no re-authentication | §C.9 says `PATCH /api/settings/account` updates name/email. QA §9.1 says "Email change requires verification of new email" but doesn't require current password. Attacker with session access could change email, then reset password via new email, permanently hijacking the account | Require current password when changing email (not just verification of new email). This closes the session-theft → email-change → password-reset attack chain |
| 10 | **Medium** | ActivityLog — data leakage via entity_id | `GET /api/activity?entity_type=client&entity_id=X` — if someone passes another user's client_id, does the endpoint verify ownership of the entity_id? The plan says `user_id` scoping on all queries, but ActivityLog only has its own `user_id` field, which should be sufficient if the query scopes by `WHERE user_id = session.userId` | Ensure the query is `WHERE user_id = session.userId` (not `WHERE entity_id = X`). The entity_type/entity_id params should only filter within the user's own activity. Add explicit documentation that activity is never queried by entity_id alone |
| 11 | **Medium** | Invoice PDF — unauthenticated access risk | `GET /api/invoices/[id]/pdf` generates a PDF. If the endpoint is authenticated, it's fine. But if this URL is ever shared (e.g., in email links), it could leak invoice data. The plan says "export PDF" but doesn't mention if the PDF download URL is authenticated or signed | PDF endpoint MUST require authentication. For emailed invoices, render the PDF inline in the email or attach it to the email via Resend (not as a link to the app). If a shareable PDF link is needed, generate a time-limited signed URL |
| 12 | **Medium** | Timer API — no project status check | `POST /api/timer/start` starts a timer on a task. QA §4.2 says "Start timer on a completed project → blocked." But the plan doesn't mention checking project status in the timer start API | Add project status check in `POST /api/timer/start`: if `project.status IN ('completed', 'cancelled')`, return 422: "This project is marked as completed. Reopen it to track time." Same check for `POST /api/time-entries` (manual entry) |
| 13 | **Medium** | Bulk operations — scope check | §B.4 lists "Bulk select → bulk status change" for tasks. The plan says "Bulk operations only affect the authenticated user's data" (§12.2) but doesn't describe how bulk operations verify ownership of each item in the batch | For bulk operations, validate ownership of every ID in the batch: `WHERE id IN (:ids) AND user_id = session.userId`. Return 403 if any ID doesn't belong to the user (don't silently skip). Use a transaction to ensure atomicity |
| 14 | **Medium** | File download signed URLs — scope to user | §B.4 says "GET /api/files/[id]/download → generate signed download URL". §12.5 says "File URLs are signed and time-limited → expired URL returns 403". But signed URLs from Uploadthing may only be time-limited, not user-scoped. If a URL leaks, anyone can download the file until it expires | Before generating the signed URL, verify the requesting user owns the file (via `FileAttachment.user_id`). Set short expiry (5–15 minutes). For portal files (`upload_source = 'portal'`), verify the request comes from a valid portal token, not just any user |
| 15 | **Medium** | Search results — no pagination limit | `GET /api/search?q=` returns results grouped by type. The plan says "paginated" in Phase E perf tests but the search API definition doesn't include pagination params. Without limits, a broad query could return thousands of results, causing performance issues and potentially leaking data volume information | Add `limit` and `offset` params to search API. Default limit = 10 per type (clients, projects, tasks). Max limit = 50. Return total count for each type (for "show more" UI) |
| 16 | **Medium** | Password hash timing attack | §A.3 says login returns "Invalid email or password" for both wrong email and wrong password (no user enumeration). But if the code does `findUser(email)` → if not found, return error; if found, `bcrypt.compare()` → the response time differs (bcrypt compare takes ~250ms, lookup failure is instant). This leaks whether the email exists | Always run `bcrypt.compare()` even when the user is not found — compare against a dummy hash. This makes both paths take the same time. `const dummyHash = await bcrypt.hash('dummy', 12)` at startup; reuse on every "user not found" |
| 17 | **Low** | CSRF protection — not specified how | §A.3 mentions "CSRF protection on form submission" and §12.4 says "state-changing POST/PUT/DELETE without valid CSRF token → 403". But the implementation plan doesn't specify the CSRF mechanism | For API routes: use `SameSite=Strict` cookies (already specified) + verify `Origin` header matches `NEXT_PUBLIC_APP_URL`. This is the double-submit cookie pattern. No separate CSRF token needed with `SameSite=Strict`, but Origin checking adds defense-in-depth |
| 18 | **Low** | Resend API key exposure risk | `RESEND_API_KEY` is a server-side env var. But if it accidentally leaks in a Sentry error, console log, or API response error, an attacker could send emails as the app | Ensure Sentry's `beforeSend` hook strips all env vars and request headers from error reports. Never log env vars. Add `RESEND_API_KEY` to `.gitignore` patterns. Resend API keys can be scoped to specific domains — use domain-restricted keys |
| 19 | **Low** | Session token in Sentry breadcrumbs | Database session tokens travel in cookies. Sentry's automatic breadcrumb capture could log cookie headers, exposing session tokens in Sentry dashboard | Configure Sentry to strip `Cookie` and `Set-Cookie` headers from request breadcrumbs: `beforeBreadcrumb` hook. Strip `Authorization` header too, as a precaution |

---

## Authentication Deep Dive

### Can a session be stolen or replayed?

**Current protections:**
- `HttpOnly` cookie → JavaScript cannot read the session ID (XSS cannot steal it)
- `Secure` flag → cookie only sent over HTTPS (no network sniffing on HTTP)
- `SameSite=Strict` → cookie not sent on cross-origin requests (no CSRF)
- Database-backed sessions → server can revoke at any time

**Remaining risks:**
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Physical device access | Medium | 7-day idle timeout + 30-day absolute timeout limit the window |
| Malware/keylogger on device | Low (out of scope) | Nothing the app can do — OS-level issue |
| Sentry/logging leaking session cookie | Medium | **Issue #19** — strip cookies from Sentry. Issue #18 — strip API keys |
| Shoulder surfing the cookie value | Very Low | HttpOnly prevents JS access; cookie value isn't displayed anywhere in UI |
| Session fixation | Low | Generate new session ID on login (never reuse pre-auth session) — **add this to the plan** |

**Recommendation:** Add to §A.3: "On login, always create a new session (never promote a pre-login session). Invalidate any existing session cookie before setting the new one."

### What triggers a session refresh?

**Currently documented:**
- `last_active_at` updated on every authenticated request → extends idle timeout
- 7-day idle timeout → session expires if no requests for 7 days
- 30-day absolute timeout → session expires regardless of activity
- Password change → all other sessions deleted
- Logout → current session deleted

**Not documented (should be added):**
- IP address change: Should the session be invalidated or just flagged? **Recommendation:** Log the IP change in ActivityLog but don't invalidate (users on mobile networks change IPs frequently). Consider adding a "suspicious login from new IP" notification.
- User agent change: Similar — log but don't invalidate.

### Are all sensitive actions re-verified?

| Action | Re-verification | Status |
|--------|----------------|--------|
| Password change | Current password required | Documented in §6.3, §C.9 |
| Account deletion | Password re-entry | **Issue #4** — plan says "confirmation" but needs "password re-entry" |
| Email change | Verification of new email | Documented — **but also needs current password** (Issue #9) |
| GDPR data export | None | **Issue #3** — needs password re-entry |
| Send invoice (financial action) | None (authenticated session sufficient) | Acceptable — not a destructive action, just sends an email |
| Delete client (cascades data) | Confirmation dialog | Acceptable — "double confirmation" for clients with active projects |
| Revoke portal token | Confirmation dialog | Acceptable |

---

## Permission Model — Complete Map

### Every API route and its permission check:

| Route | Auth Required | Ownership Check | Rate Limit | Notes |
|-------|--------------|-----------------|------------|-------|
| **Public** | | | | |
| `GET /` (landing) | No | N/A | N/A | Static page |
| `POST /api/auth/signup` | No | N/A | 3/hr per IP | |
| `POST /api/auth/login` | No | N/A | 5/15min per IP | Timing attack risk (Issue #16) |
| `POST /api/auth/forgot-password` | No | N/A | 3/hr per email | No user enumeration |
| `POST /api/auth/reset-password` | No (token) | Token validates user | 3/hr per IP | Token in URL risk (Issue #2) |
| `GET /api/auth/verify-email` | No (token) | Token validates user | 3/hr per IP | |
| `GET /api/portal/[token]` | No (token) | Token validates project | 10/min per IP | Read-only; no financials |
| `GET /api/health` | No | N/A | N/A | Returns only status + latency |
| **Authenticated — Own data** | | | | |
| `GET /api/auth/me` | Yes | Session → user | General API | Returns current user (no password_hash) |
| `POST /api/auth/logout` | Yes | Session destroyed | General API | |
| `GET /api/clients` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/clients` | Yes | `data.user_id = session.userId` | General API | |
| `GET /api/clients/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | 403 if not owner |
| `PATCH /api/clients/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | |
| `DELETE /api/clients/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | Cascade logic in service layer |
| `GET /api/projects` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/projects` | Yes | `data.user_id = session.userId` + verify client ownership | General API | Client_id must belong to user |
| `GET /api/projects/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | |
| `PATCH /api/projects/[id]` | Yes | Same ownership check | General API | Status transition side effects |
| `DELETE /api/projects/[id]` | Yes | Same ownership check | General API | |
| `GET /api/projects/[id]/tasks` | Yes | Verify project ownership first | General API | |
| `POST /api/projects/[id]/tasks` | Yes | Verify project ownership first | General API | |
| `GET /api/tasks` | Yes | `WHERE user_id = session.userId` | General API | Cross-project view |
| `GET /api/tasks/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | |
| `PATCH /api/tasks/[id]` | Yes | Same ownership check | General API | Timer stop on Done |
| `DELETE /api/tasks/[id]` | Yes | Same ownership check | General API | |
| `PATCH /api/tasks/[id]/position` | Yes | Same ownership check | General API | Drag-and-drop reorder |
| `POST /api/tasks/[id]/subtasks` | Yes | Verify task ownership | General API | |
| `PATCH /api/subtasks/[id]` | Yes | **Join: Subtask → Task → user_id** | General API | **Issue #7** |
| `DELETE /api/subtasks/[id]` | Yes | **Join: Subtask → Task → user_id** | General API | **Issue #7** |
| `POST /api/tasks/[id]/dependencies` | Yes | Verify both tasks owned by user | General API | Same-project check too |
| `DELETE /api/task-dependencies/[id]` | Yes | **Join: TaskDep → Task → user_id** | General API | **Issue #7** |
| `GET /api/time-entries` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/time-entries` | Yes | Verify project ownership | General API | Check project status (Issue #12) |
| `PATCH /api/time-entries/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | Blocked if invoiced |
| `DELETE /api/time-entries/[id]` | Yes | Same | General API | Blocked if invoiced |
| `POST /api/timer/start` | Yes | Verify task/project ownership | General API | Check project status (Issue #12) |
| `POST /api/timer/stop` | Yes | Verify timer ownership | General API | |
| `POST /api/timer/discard` | Yes | Verify timer ownership | General API | |
| `GET /api/timer/current` | Yes | `WHERE user_id = session.userId AND end_time IS NULL` | General API | |
| `POST /api/projects/[id]/milestones` | Yes | Verify project ownership | General API | |
| `PATCH /api/milestones/[id]` | Yes | **Join: Milestone → Project → user_id** | General API | **Issue #7** |
| `DELETE /api/milestones/[id]` | Yes | **Join: Milestone → Project → user_id** | General API | **Issue #7** |
| `GET /api/invoices` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/invoices` | Yes | Verify client + project ownership | General API | Atomic invoice number (fix #8) |
| `GET /api/invoices/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | |
| `PATCH /api/invoices/[id]` | Yes | Same + draft status check | General API | |
| `DELETE /api/invoices/[id]` | Yes | Same + draft status check | General API | |
| `POST /api/invoices/[id]/send` | Yes | Same + business profile check | 5/hr per user | Email rate limit |
| `POST /api/invoices/[id]/payments` | Yes | Same | General API | |
| `GET /api/invoices/[id]/pdf` | Yes | Same | General API | **Issue #11** — must be authenticated |
| `POST /api/invoices/[id]/line-items` | Yes | **Join: Invoice → user_id** | General API | Draft only |
| `PATCH /api/invoice-line-items/[id]` | Yes | **Join: LineItem → Invoice → user_id** | General API | **Issue #7**; draft only |
| `DELETE /api/invoice-line-items/[id]` | Yes | **Join: LineItem → Invoice → user_id** | General API | **Issue #7**; draft only |
| `POST /api/files/upload` | Yes | `data.user_id = session.userId` | 10/hr per user | File type + size validation |
| `DELETE /api/files/[id]` | Yes | `WHERE id = :id AND user_id = session.userId` | General API | |
| `GET /api/files/[id]/download` | Yes | Same | General API | **Issue #14** — signed URL, user-scoped |
| `GET /api/templates` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/templates` | Yes | Verify source project ownership | General API | |
| `POST /api/templates/[id]/apply` | Yes | Verify template ownership | General API | |
| `DELETE /api/templates/[id]` | Yes | Same | General API | |
| `GET /api/notifications` | Yes | `WHERE user_id = session.userId` | General API | |
| `PATCH /api/notifications/[id]/read` | Yes | **Must scope by user_id** | General API | **Issue #6** |
| `POST /api/notifications/mark-all-read` | Yes | `WHERE user_id = session.userId` | General API | |
| `GET /api/business-profile` | Yes | `WHERE user_id = session.userId` | General API | |
| `PATCH /api/business-profile` | Yes | Same | General API | |
| `GET /api/settings/account` | Yes | Session → user | General API | |
| `PATCH /api/settings/account` | Yes | Session → user | General API | **Issue #9** — needs password for email |
| `POST /api/settings/change-password` | Yes | Current password required | General API | Invalidates other sessions |
| `POST /api/settings/delete-account` | Yes | **Must require password** | General API | **Issue #4** |
| `GET /api/settings/export` | Yes | **Must require password** | 1/hr per user | **Issue #3** |
| `GET /api/settings/notifications` | Yes | `WHERE user_id = session.userId` | General API | |
| `PATCH /api/settings/notifications` | Yes | Same | General API | |
| `GET /api/search?q=` | Yes | `WHERE user_id = session.userId` on all entities | General API | **Issue #15** — add pagination |
| `GET /api/calendar/blocked-time` | Yes | `WHERE user_id = session.userId` | General API | |
| `POST /api/calendar/blocked-time` | Yes | `data.user_id = session.userId` | General API | |
| `PATCH /api/calendar/blocked-time/[id]` | Yes | Same ownership check | General API | |
| `DELETE /api/calendar/blocked-time/[id]` | Yes | Same | General API | |
| `GET /api/activity` | Yes | `WHERE user_id = session.userId` | General API | **Issue #10** — entity_id filter must still scope by user_id |
| `GET /api/dashboard` | Yes | `WHERE user_id = session.userId` on all aggregations | General API | |

---

## Data Leakage Check

### Can any response accidentally include password hashes or internal data?

| Risk Point | What Could Leak | Status |
|------------|----------------|--------|
| User API responses | `password_hash` field | **Must explicitly exclude** — use Prisma `select` to never return `password_hash`. Create a `sanitizeUser()` helper that strips it |
| Error responses (500) | Stack traces, SQL queries, DB schema | Covered by §10.3 — "error pages do not expose stack traces." Sentry captures internally; user sees generic message |
| Prisma error messages | "Unique constraint failed on field `email`" → reveals email existence | Catch Prisma errors and map to generic messages. `P2002` (unique violation) on signup → "An account with this email already exists" (this is acceptable; signup reveals existence intentionally) |
| Portal endpoint | Hourly rates, budgets, financial data | Plan explicitly says "no sensitive data" — verify the query uses a restrictive `select` that only returns task titles, statuses, milestone names, and file upload area. Never return `hourly_rate`, `fixed_price`, `budget_*`, invoice data |
| Search results | Internal IDs (UUIDs) | UUIDs are not secret per se, but combined with IDOR this matters. Since all routes check ownership, UUID exposure is acceptable |
| Invoice snapshot fields | Client emails, addresses | These are the invoice owner's own data — acceptable. Portal never shows invoices |
| Session cookie | Session ID | HttpOnly prevents JS access. Issue #19 addresses Sentry leaking cookies |
| API error details | Which field failed validation | Acceptable — validation errors should show field-level messages for good UX |

**Action items:**
1. Create a `sanitizeUser()` function that removes `password_hash` before any API response
2. Never use `select: *` or `include: *` in Prisma queries — always explicitly select fields
3. Catch all Prisma errors in a central error handler; map to safe HTTP responses

---

## Rate Limiting Analysis

### Is it per-user, per-IP? What prevents abuse?

| Endpoint Category | Rate Limit | Keyed By | Abuse Scenario | Prevention |
|-------------------|-----------|----------|----------------|-----------|
| Login | 5/15min | IP | Credential stuffing | After 5 failures: 429 + increasing backoff. Combined with generic error message ("Invalid email or password") prevents enumeration |
| Signup | 3/hour | IP | Mass account creation for spam | Low limit per IP. **Missing: CAPTCHA.** Recommendation: add CAPTCHA (Turnstile) after 1st failed attempt or on all signups |
| Forgot password | 3/hour | Email | Email bombing a user | Good — per-email limit. Also: same success message for registered and unregistered emails prevents enumeration |
| General API | 100/min | User | Automated data scraping | Adequate for normal use. **Question:** Is this per-user or per-session? Should be per-user (across all sessions). Verified: scoped to `session.userId` via Upstash |
| File upload | 10/hour | User | Storage abuse | Good limit. Combined with 25 MB max per file = 250 MB/hour worst case |
| Invoice email | 5/hour | User | Spam/harassment via invoice emails | Good limit. **Missing: email content is not user-controlled** — the app generates the email, user can't inject arbitrary content. Verify this |
| Portal | Not specified | — | DoS / enumeration of portal tokens | **Missing:** Add 10/min per IP rate limit on portal endpoint to prevent token brute-force |
| Health check | Not specified | — | Monitoring abuse | Add 10/min per IP to prevent ping flood |
| Password reset token | Not specified | — | Token brute-force | Token is 32 chars (nanoid) → ~192 bits of entropy → not brute-forceable. But still add rate limit on `POST /api/auth/reset-password` (wrong token attempts): 5/15min per IP |
| GDPR export | Not specified | — | Resource exhaustion | **Issue #3:** Add 1/hour per user |

**Missing rate limits to add:**
1. Portal endpoint: 10/min per IP
2. Health endpoint: 10/min per IP
3. Reset password (token validation): 5/15min per IP
4. GDPR export: 1/hour per user
5. Signup: Consider adding Cloudflare Turnstile CAPTCHA

---

## Recommendations Summary (sorted by severity)

| # | Severity | Action |
|---|----------|--------|
| 1 | **Critical** | Use HMAC-SHA256 for session cookie signing. Store only hash of session ID in database |
| 2 | **Critical** | Mitigate password reset token URL exposure: POST-based exchange, strip Referer, clear URL |
| 3 | **Critical** | Require password re-entry for GDPR data export. Rate limit to 1/hour |
| 4 | **High** | Require password re-entry for account deletion (mandatory, not optional) |
| 5 | **High** | Store only SHA-256 hash of session ID in `Session.token_hash` column |
| 6 | **High** | Add `WHERE user_id = session.userId` to notification mark-as-read endpoint |
| 7 | **High** | Document join-chain ownership verification for all child entity routes (subtask, milestone, line item, payment, dependency) |
| 8 | **High** | Generate portal tokens with `nanoid(32)`. Add rate limit on portal endpoint |
| 9 | **Medium** | Require current password for email changes (prevent session-theft → email-change → password-reset chain) |
| 10 | **Medium** | Scope activity log queries by `user_id`, not just `entity_id` |
| 11 | **Medium** | Ensure invoice PDF endpoint is always authenticated. Never expose as public URL |
| 12 | **Medium** | Check project status (completed/cancelled) in timer start and manual time entry APIs |
| 13 | **Medium** | Validate ownership of every ID in bulk operation batches |
| 14 | **Medium** | Verify file ownership before generating signed download URL. Short expiry (5–15 min) |
| 15 | **Medium** | Add pagination (limit/offset) to search API. Default 10, max 50 per type |
| 16 | **Medium** | Prevent bcrypt timing attack: always compare against a dummy hash when user not found |
| 17 | **Low** | Implement CSRF via `SameSite=Strict` + `Origin` header verification |
| 18 | **Low** | Strip API keys and env vars from Sentry error reports |
| 19 | **Low** | Strip `Cookie` and `Set-Cookie` headers from Sentry breadcrumbs |

---

*This audit should be addressed before Phase A (Foundation) begins. Critical and High issues must be resolved in the implementation. Medium issues should be resolved by Phase D. Low issues should be resolved by Phase E.*
