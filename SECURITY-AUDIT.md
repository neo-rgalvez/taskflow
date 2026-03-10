# TaskFlow — Security Audit (Code-Level)

> Full security audit of the TaskFlow application performed against OWASP Top 10 (2021), multi-tenant data isolation requirements, and professional penetration testing standards.
>
> **Audit date:** 2026-03-10
> **Auditor:** Automated static analysis of every source file
> **Scope:** All 31 API routes, middleware, auth library, 4 validation schemas, Prisma schema, Next.js configuration, environment configuration, and client-side code
> **Methodology:** Line-by-line review of every API route handler, every database query, every validation schema, and every cookie/header operation

---

## Audit Framework

### OWASP Top 10 (2021) Applied to TaskFlow

| # | Risk | What We Checked |
|---|------|-----------------|
| A01 | Broken Access Control | Every DB query filtered by `userId`? IDOR on every route? Auth required on all protected endpoints? |
| A02 | Cryptographic Failures | Password hashing algorithm and cost? Session tokens: entropy, storage, hashing? Cookie flags? |
| A03 | Injection | SQL injection via Prisma? XSS via `dangerouslySetInnerHTML`? Input validation on all mutations? |
| A04 | Insecure Design | Rate limiting on auth endpoints? Email verification? CSRF protection? Timing attacks? |
| A05 | Security Misconfiguration | Security headers? Empty config? Committed secrets? Debug info in responses? |
| A07 | Auth Failures | Session lifecycle? Brute-force protection? Password policy? Session invalidation? |
| A09 | Logging Failures | Auth event logging? Error detail leakage in logs? |

### Penetration Tester Checklist

- Can any page/API be accessed without login? (Only `/`, `/login`, `/signup`, `/api/health` allowed)
- Can User A see/modify/delete User B's data via URL manipulation?
- Are sessions `httpOnly`, `secure`, `sameSite=strict`, properly destroyed?
- Are error messages generic? No stack traces? No password hashes?
- All inputs validated on server? Length limits enforced?
- Security headers present?
- Secrets in committed code?
- Rate limiting active and effective?
- Password change requires current password?
- Account deletion cascades completely?

---

## Findings Summary

| # | Finding | Severity | OWASP |
|---|---------|----------|-------|
| 1 | Invoice payment `update()` missing `userId` in WHERE clause | **CRITICAL** | A01 |
| 2 | Invoice deletion `delete()` missing `userId` in WHERE clause | **CRITICAL** | A01 |
| 3 | Time entry `update()` missing `userId` in WHERE clause | **HIGH** | A01 |
| 4 | No security headers configured anywhere in the application | **HIGH** | A05 |
| 5 | Registration endpoint has no rate limiting | **HIGH** | A04 |
| 6 | Rate limiter is in-memory only — ineffective in serverless/multi-instance | **HIGH** | A07 |
| 7 | Login timing attack leaks email existence | **MEDIUM** | A07 |
| 8 | Middleware checks cookie existence only, not session validity | **MEDIUM** | A01 |
| 9 | Email change does not require password re-verification | **MEDIUM** | A07 |
| 10 | GDPR data export has no re-authentication or rate limiting | **MEDIUM** | A01 |
| 11 | Hardcoded fallback `DATABASE_URL` in `db.ts` | **MEDIUM** | A05 |
| 12 | No email verification flow implemented | **MEDIUM** | A07 |
| 13 | `x-forwarded-for` IP is client-spoofable, bypasses rate limiting | **MEDIUM** | A04 |
| 14 | No audit logging for authentication events | **MEDIUM** | A09 |
| 15 | `SESSION_SECRET` env var is defined but never used | **LOW** | A02 |
| 16 | Registration name field has no max length | **LOW** | A03 |
| 17 | `console.error` leaks full error objects in multiple routes | **LOW** | A09 |
| 18 | No explicit CSRF token (relies on `SameSite=Strict` only) | **LOW** | A01 |
| 19 | Project GET/POST routes missing try-catch around DB operations | **LOW** | A05 |
| 20 | Deleted-account users can still authenticate (soft delete not enforced) | **HIGH** | A07 |
| 21 | Open redirect via `returnUrl` parameter on login page | **HIGH** | A01 |
| 22 | Invoice number generation has race condition (duplicate numbers) | **MEDIUM** | A04 |
| 23 | Invoice status has no state transition validation (paid→draft allowed) | **MEDIUM** | A04 |
| 24 | Payment amount has no upper bound (overpayment creates data inconsistency) | **LOW** | A04 |
| 25 | Seed file contains hardcoded credentials in committed code | **LOW** | A05 |

**Totals: 2 Critical, 6 High, 9 Medium, 8 Low**

---

## Detailed Findings

### FINDING 1 — Invoice Payment IDOR: `update()` Without `userId` (CRITICAL)

**File:** `src/app/api/invoices/[id]/payment/route.ts:61-68`
**OWASP:** A01 — Broken Access Control

The ownership check on line 34 uses `findFirst({ where: { id, userId } })`, which is correct. But the `update()` on line 61 drops the `userId` filter:

```typescript
// Line 34 — ownership read (correct)
const invoice = await db.invoice.findFirst({
  where: { id: params.id, userId: auth.userId },
});

// Line 61 — update WITHOUT userId (defense-in-depth failure)
const updated = await db.invoice.update({
  where: { id: params.id },  // ← missing userId
  data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newStatus },
});
```

**Current exploitability:** The `findFirst` on line 34 returns 404 for non-owners, so the `update` is not directly reachable by a non-owner in the current code path. However, this is a **critical defense-in-depth failure** — if any future refactor caches the invoice lookup, adds a batch payment endpoint, or introduces middleware that pre-populates the invoice, the write becomes immediately exploitable.

**Real-world risk:** Any authenticated user could record payments on any other user's invoice, corrupting billing data across tenants.

**Fix:** `db.invoice.update({ where: { id: params.id, userId: auth.userId }, ... })` — or use `updateMany` with both constraints.

---

### FINDING 2 — Invoice Deletion: `delete()` Without `userId` (CRITICAL)

**File:** `src/app/api/invoices/[id]/route.ts:171`
**OWASP:** A01 — Broken Access Control

Same pattern as Finding 1. The ownership check on line 156–158 uses `findFirst({ where: { id, userId } })`, but the actual `delete()` on line 171 uses only the ID:

```typescript
// Line 156 — ownership read (correct)
const invoice = await db.invoice.findFirst({
  where: { id: params.id, userId: auth.userId },
});

// Line 171 — delete WITHOUT userId constraint
await db.invoice.delete({ where: { id: params.id } });
```

**Current exploitability:** Same as Finding 1 — not directly exploitable today due to the prior `findFirst` check, but a TOCTOU race or future refactor makes it exploitable.

**Real-world risk:** An authenticated user could delete any other user's draft invoice by guessing IDs.

**Fix:** Replace with `db.invoice.deleteMany({ where: { id: params.id, userId: auth.userId } })` to make the operation atomic.

---

### FINDING 3 — Time Entry `update()` Without `userId` (HIGH)

**File:** `src/app/api/time-entries/[id]/route.ts:127-129`
**OWASP:** A01 — Broken Access Control

The PUT handler checks ownership on line 93 (`findFirst({ where: { id, userId } })`), but the `update()` on line 127 uses only the ID:

```typescript
// Line 93 — ownership read (correct)
const existing = await db.timeEntry.findFirst({
  where: { id, userId: auth.userId },
});

// Line 127 — update WITHOUT userId
const updated = await db.timeEntry.update({
  where: { id },  // ← missing userId
  data: updateData,
});
```

**Risk:** Identical pattern to Findings 1 and 2. The prior ownership check prevents direct exploitation, but defense-in-depth is broken. Rated HIGH (not Critical) because time entries are less sensitive than invoice financial data.

**Fix:** Use `updateMany({ where: { id, userId: auth.userId }, data: ... })` or add `userId` to the `update` WHERE clause.

---

### FINDING 4 — No Security Headers (HIGH)

**File:** `next.config.mjs` (entire file is 4 lines — empty config)
**OWASP:** A05 — Security Misconfiguration

```javascript
const nextConfig = {};
export default nextConfig;
```

No security headers are configured anywhere — not in `next.config.mjs`, not in middleware, not in any API route.

**Missing headers:**

| Header | Risk if Missing |
|--------|-----------------|
| `Content-Security-Policy` | Stored XSS in task descriptions, comments, or client notes executes arbitrary JS |
| `X-Frame-Options` | Clickjacking — attacker embeds app in iframe, tricks user into clicking |
| `X-Content-Type-Options` | MIME sniffing — browser may execute non-script responses as scripts |
| `Strict-Transport-Security` | Downgrade attacks on first visit — session cookie theft on public Wi-Fi |
| `Referrer-Policy` | Resource IDs leaked to external sites via Referer header |
| `Permissions-Policy` | Unnecessary access to camera, microphone, geolocation |

**Fix:** Add `headers()` function to `next.config.mjs` with all six headers.

---

### FINDING 5 — No Rate Limiting on Registration (HIGH)

**File:** `src/app/api/auth/register/route.ts`
**OWASP:** A04 — Insecure Design

The login endpoint applies rate limiting (`checkRateLimit("login:${ip}", 5, 15min)`), but the registration endpoint has none.

**Real-world risk:**
- **Mass account creation** — Automated bots create thousands of accounts
- **Email enumeration** — The 409 error `"An account with this email already exists."` (line 39) reveals whether an email is registered. Without rate limiting, an attacker enumerates emails at scale
- **Database cost abuse** — Neon PostgreSQL is billed by storage/compute

**Fix:** Add `checkRateLimit("register:${ip}", 3, 60 * 60 * 1000)` — 3 registrations per IP per hour.

---

### FINDING 6 — In-Memory Rate Limiter (HIGH)

**File:** `src/lib/rate-limit.ts`
**OWASP:** A07 — Identification & Authentication Failures

The rate limiter stores timestamps in a `Map` object:
```typescript
const store = new Map<string, RateLimitEntry>();
```

This data is:
- Lost on every process restart or redeployment
- Not shared across multiple serverless function instances
- Reset on every Vercel cold start
- Effectively **cosmetic** in any multi-instance deployment

**Real-world risk:** An attacker bypasses login rate limiting by timing requests to hit different function instances, or simply waiting for cold starts. On Vercel, the rate limit provides nearly zero protection.

**Fix:** The codebase already defines `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example`. Use `@upstash/ratelimit` for persistent, distributed rate limiting.

---

### FINDING 7 — Login Timing Attack Leaks Email Existence (MEDIUM)

**File:** `src/app/api/auth/login/route.ts:51-66`
**OWASP:** A07 — Identification & Authentication Failures

When the email doesn't exist, the handler returns immediately (line 53). When the email exists but password is wrong, `bcrypt.compare()` runs first (~250ms), then returns (line 62). The timing difference reveals whether an email is registered.

```typescript
if (!user) {
  // Returns immediately — ~0ms after DB lookup
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}

const valid = await bcrypt.compare(password, user.passwordHash);
// Returns after ~250ms bcrypt comparison
if (!valid) {
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}
```

**Real-world risk:** An attacker measures response times to determine which email addresses have accounts. Combined with no rate limiting on registration (Finding 5), this enables large-scale email enumeration.

**Fix:** Always run `bcrypt.compare()` even when the user is not found:
```typescript
const dummyHash = "$2a$12$LJ3m4ys3Lz0YPfTvCaQb5e0000000000000000000000000000";
if (!user) {
  await bcrypt.compare(password, dummyHash); // constant-time path
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}
```

---

### FINDING 8 — Middleware Checks Cookie Existence Only (MEDIUM)

**File:** `src/middleware.ts:22,40`
**OWASP:** A01 — Broken Access Control

The middleware only checks if the `session_token` cookie exists:
```typescript
const sessionToken = req.cookies.get("session_token")?.value;
if (isProtected && !sessionToken) {
  // redirect to login
}
```

It does not verify the session is valid, unexpired, or unrevoked. A user with a stale/expired/deleted session cookie reaches protected page shells.

**Mitigating factor:** Every API route calls `requireAuth()` which validates the session in the database. The page shell renders without data. This is a UX issue more than a security breach.

**Fix:** The authenticated layout (`src/app/(authenticated)/layout.tsx`) is a plain client component with no server-side session check. Add a server component wrapper that validates the session.

---

### FINDING 9 — Email Change Without Password Re-Verification (MEDIUM)

**File:** `src/app/api/settings/account/route.ts:80-106`
**OWASP:** A07 — Identification & Authentication Failures

The account settings PATCH endpoint allows changing the email address with only a valid session — no password re-entry required.

**Attack chain:** Session theft → change email → password reset via new email → permanent account hijack.

**Fix:** When `email` is being changed, require `currentPassword` in the request body and verify it with `bcrypt.compare()` before proceeding.

---

### FINDING 10 — GDPR Export: No Re-Authentication or Rate Limiting (MEDIUM)

**File:** `src/app/api/settings/export/route.ts`
**OWASP:** A01 — Broken Access Control

The data export endpoint dumps all user data (clients with emails, projects with rates, tasks, time entries, invoices, comments, notifications) as JSON. It requires only a valid session — no password re-entry, no rate limiting.

**Real-world risk:** If a session is stolen (physical device access, XSS, Sentry cookie leakage), the attacker gets a complete data dump in one request — client emails, financial records, business details.

**Fix:**
1. Require password re-entry before export
2. Add rate limit: 1 export per hour per user
3. Log export events for audit trail

---

### FINDING 11 — Hardcoded Fallback DATABASE_URL (MEDIUM)

**File:** `src/lib/db.ts:4-7`
**OWASP:** A05 — Security Misconfiguration

```typescript
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL =
    "postgresql://taskflow:taskflow@localhost:5432/taskflow";
}
```

This hardcodes a database connection string with credentials (`taskflow:taskflow`) as a development fallback. While it only activates in non-production, the credentials are in committed source code.

**Real-world risk:**
- If someone deploys without setting `NODE_ENV=production`, the app connects with hardcoded credentials
- The credentials are visible in the git history forever
- Password reuse: if the same `taskflow:taskflow` credentials are used elsewhere, they're compromised

**Fix:** Remove the fallback. Fail loudly if `DATABASE_URL` is not set:
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
```

---

### FINDING 12 — No Email Verification Flow (MEDIUM)

**File:** `src/app/api/auth/register/route.ts:52`
**OWASP:** A07 — Identification & Authentication Failures

Users are auto-logged-in with `emailVerified: false`. The schema has `EmailVerificationToken` model, but no verification routes exist. The `emailVerified` field is never checked in any API route.

**Real-world risk:** Attacker registers with victim's email address; no proof of ownership required; password reset (when built) targets unverified addresses.

**Fix:** Implement email verification; gate sensitive operations behind `emailVerified: true`.

---

### FINDING 13 — Spoofable IP for Rate Limiting (MEDIUM)

**Files:** `src/app/api/auth/login/route.ts:21`, `src/app/api/auth/register/route.ts:66`
**OWASP:** A04 — Insecure Design

```typescript
const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
```

`X-Forwarded-For` is client-controllable. An attacker sends unique values to get a fresh rate-limit window per request.

**Fix:** Use `req.ip` or `x-real-ip` (set by Vercel/trusted proxies, not spoofable by clients).

---

### FINDING 14 — No Authentication Audit Logging (MEDIUM)

**OWASP:** A09 — Security Logging & Monitoring Failures

No auth events are logged to persistent storage:
- Failed login attempts (IP, email)
- Successful logins (IP, user agent)
- Password changes, account deletions, session invalidations

Only ephemeral `console.error` in serverless environment.

**Fix:** Create an `AuditLog` table or integrate with external logging. Log event type, userId, IP, user agent, timestamp, success/failure.

---

### FINDING 15 — `SESSION_SECRET` Defined But Never Used (LOW)

**File:** `.env.example:9`
**OWASP:** A02 — Cryptographic Failures

`SESSION_SECRET` is defined in `.env.example` with instructions to generate it, but is never referenced in any source file. Sessions use `nanoid(32)` → SHA-256 → DB storage. The secret serves no purpose.

**Risk:** Low — but confusing. Developers may believe sessions are signed with this secret when they are not.

**Fix:** Either remove `SESSION_SECRET` from `.env.example` or implement HMAC signing of session cookies using it.

---

### FINDING 16 — Registration Name Field Unbounded (LOW)

**File:** `src/app/api/auth/register/route.ts:9`
**OWASP:** A03 — Injection

```typescript
name: z.string().trim().min(1, "Full name is required."),
// Missing .max() — all other schemas have max lengths
```

**Fix:** Add `.max(200)` to match convention in other schemas.

---

### FINDING 17 — `console.error` Leaks Full Error Objects (LOW)

**Files:** Multiple routes including `register/route.ts:85`, `login/route.ts:97`, `settings/account/route.ts:33`, `analytics/route.ts:401`, and 8+ others.
**OWASP:** A09

```typescript
console.error("Registration error:", message, err);
```

Full error objects including Prisma stack traces, constraint names, and query details are logged. Visible in serverless deployment dashboards.

**Fix:** Log only error messages, not full objects. Use structured logging.

---

### FINDING 18 — No Explicit CSRF Token (LOW)

**OWASP:** A01 — Broken Access Control

The app relies on `SameSite=Strict` cookies only. No CSRF tokens are generated or validated.

**Risk:** `SameSite=Strict` covers modern browsers. Risk limited to legacy browsers and subdomain compromise.

**Fix:** Low priority. For defense-in-depth, add `Origin` header verification in API routes.

---

### FINDING 19 — Missing Try-Catch on DB Operations in Project Routes (LOW)

**Files:** `src/app/api/projects/route.ts:130-148` (POST), `src/app/api/projects/[id]/route.ts:153-160` (PATCH), `src/app/api/projects/[id]/route.ts:204-206` (DELETE)
**OWASP:** A05

These route handlers call Prisma without a surrounding try-catch. An unhandled database error (constraint violation, connection timeout) could return a raw Next.js error page with internal details.

**Fix:** Wrap all database operations in try-catch blocks, returning generic 500 error messages.

---

### FINDING 20 — Soft-Deleted Users Can Still Authenticate (HIGH)

**Files:** `src/app/api/settings/delete-account/route.ts:67`, `src/lib/auth.ts:25-28`
**OWASP:** A07 — Identification & Authentication Failures

When an account is "deleted", the handler sets `scheduledDeletionAt = now()` (line 67) and deletes all sessions. However, `scheduledDeletionAt` is **never checked** anywhere:
- `getSession()` in `auth.ts` does not check if the user has `scheduledDeletionAt` set
- The login route does not check `scheduledDeletionAt` before creating a new session
- The register route does not check if a soft-deleted user with that email exists

**Attack scenario:**
1. User requests account deletion → sessions cleared, `scheduledDeletionAt` set
2. User immediately logs back in → new session created, full access restored
3. The user's data is still present, account functions normally
4. When the (unimplemented) cron job runs 30 days later, it hard-deletes an actively-used account

**Real-world risk:** Account deletion is a no-op. Users can log right back in. If a hard-delete cron is ever implemented, it will destroy active accounts that the user thought they "undeleted" by simply logging in again.

**Fix:** Add `scheduledDeletionAt` check in two places:
1. `getSession()`: If `user.scheduledDeletionAt IS NOT NULL`, return null (treat as expired)
2. Login route: If user has `scheduledDeletionAt`, either block login or clear the deletion flag (with a "welcome back" message)

---

### FINDING 21 — Open Redirect via `returnUrl` (HIGH)

**File:** `src/app/(auth)/login/page.tsx:12,57`
**OWASP:** A01 — Broken Access Control

After successful login, the user is redirected to wherever `returnUrl` points:
```typescript
const returnUrl = searchParams.get("returnUrl") || "/dashboard";
// ...after successful login:
window.location.href = returnUrl;  // No validation!
```

The `returnUrl` value is taken directly from the query parameter with no validation. An attacker crafts a phishing link:
```
https://taskflow.com/login?returnUrl=https://evil-taskflow.com/dashboard
```

**Attack scenario:**
1. Attacker sends phishing email: "Your TaskFlow session expired, please log in"
2. Link goes to legitimate `taskflow.com/login` with malicious `returnUrl`
3. User sees the real TaskFlow login page, enters real credentials
4. After successful login, user is redirected to `evil-taskflow.com` (attacker's clone)
5. Attacker's site shows "Session expired, please log in again" and captures credentials

**Real-world risk:** High — this is a classic credential harvesting technique. The user interacts with the legitimate site first, building trust.

**Fix:** Validate that `returnUrl` is a relative path (starts with `/` and does not contain `//`):
```typescript
function getSafeReturnUrl(param: string | null): string {
  if (!param || !param.startsWith("/") || param.startsWith("//")) {
    return "/dashboard";
  }
  return param;
}
```

---

### FINDING 22 — Invoice Number Race Condition (MEDIUM)

**File:** `src/app/api/invoices/route.ts:137-149`
**OWASP:** A04 — Insecure Design

Invoice numbers are generated by reading the last invoice number, incrementing, and creating:
```typescript
const lastInvoice = await db.invoice.findFirst({
  where: { userId: auth.userId },
  orderBy: { createdAt: "desc" },
  select: { invoiceNumber: true },
});
let nextNum = 1;
if (lastInvoice?.invoiceNumber) {
  const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
  if (match) nextNum = parseInt(match[1], 10) + 1;
}
const invoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;
```

If two requests create invoices concurrently, both read the same "last" number and generate the same next number. The `@@unique([userId, invoiceNumber])` constraint in Prisma will throw a `P2002` error on one of them, but there is no retry logic — the user gets a generic 500 error.

**Real-world risk:** Duplicate invoice number error under concurrent use. Not a security breach but a data integrity and UX issue.

**Fix:** Use a database sequence or catch the `P2002` error and retry with an incremented number.

---

### FINDING 23 — No Invoice State Transition Validation (MEDIUM)

**File:** `src/app/api/invoices/[id]/route.ts:69-74`
**OWASP:** A04 — Insecure Design

The invoice PATCH endpoint accepts any status transition without validation:
```typescript
if (updateData.status !== undefined) {
  payload.status = updateData.status;
  // Only special-cases "sent" — no guard on any other transition
}
```

An attacker (or confused user) can:
- Set a `paid` invoice back to `draft` (erasing payment history semantically)
- Set a `sent` invoice back to `draft` after it was emailed to a client
- Set an `overdue` invoice to `draft` to hide delinquency

**Real-world risk:** Financial data integrity. A user could manipulate invoice statuses to misrepresent payment states.

**Fix:** Implement a state machine with allowed transitions:
```
draft → sent → (paid | partial | overdue)
partial → paid
overdue → partial → paid
```
Reject any transition not in the allowed set.

---

### FINDING 24 — Overpayment Creates Data Inconsistency (LOW)

**File:** `src/app/api/invoices/[id]/payment/route.ts:56-59`
**OWASP:** A04 — Insecure Design

The payment endpoint allows recording amounts larger than the balance due:
```typescript
const newAmountPaid = Number(invoice.amountPaid) + data.amount;
const newBalanceDue = Math.max(0, total - newAmountPaid);
// If amount > balance, amountPaid > total, balanceDue = 0
```

While the Zod schema validates `amount` is `.positive()`, there is no upper bound check against the remaining balance. This creates records where `amountPaid > total` and `balanceDue = 0`.

**Fix:** Add: `if (data.amount > Number(invoice.balanceDue)) return 422 "Payment exceeds balance due"`.

---

### FINDING 25 — Seed File Contains Hardcoded Credentials (LOW)

**File:** `prisma/seed.ts:8,23`
**OWASP:** A05 — Security Misconfiguration

```typescript
const passwordHash = await bcrypt.hash("password123", 12);
console.log("Seeded dev user: sarah@fletcherdesign.co / password123");
```

The seed file contains a hardcoded password (`password123`) and email for the development user. While seed files are development-only, this is in committed source code.

**Risk:** If the seed is accidentally run against a production database, a known credential exists. The password is also logged to console.

**Fix:** Use environment variables for seed credentials, or ensure the seed script checks `NODE_ENV !== "production"` before running.

---

## Route-by-Route Data Isolation Audit

Every API route was individually reviewed. For each database read and write, I verified whether `userId` is included in the WHERE clause.

### Routes With Defense-in-Depth Failures (3 of 31)

These routes check ownership on the READ but not on the subsequent WRITE operation:

| Route | Operation | Line | Issue |
|-------|-----------|------|-------|
| `POST /api/invoices/[id]/payment` | `db.invoice.update()` | 61 | Missing `userId` (Finding #1) |
| `DELETE /api/invoices/[id]` | `db.invoice.delete()` | 171 | Missing `userId` (Finding #2) |
| `PUT /api/time-entries/[id]` | `db.timeEntry.update()` | 127 | Missing `userId` (Finding #3) |

### Fully Secure Routes (28 of 31)

Every database read AND write includes `userId: auth.userId`:

| Route | Methods | Isolation Pattern |
|-------|---------|------------------|
| `GET/POST /api/clients` | GET, POST | `userId` in WHERE and CREATE |
| `GET/PATCH/DELETE /api/clients/[id]` | All | `findFirst`/`updateMany`/`deleteMany` with `userId` |
| `PATCH /api/clients/[id]/archive` | PATCH | `updateMany` with `userId` |
| `GET /api/clients/[id]/summary` | GET | All aggregations scoped to `userId` |
| `GET/POST /api/projects` | GET, POST | `userId` filter; client ownership verified |
| `GET/PATCH/DELETE /api/projects/[id]` | All | All ops include `userId`; optimistic locking |
| `GET/POST /api/projects/[id]/tasks` | GET, POST | Project ownership verified; `userId` on task create |
| `GET /api/tasks` | GET | `userId` on main query; archived clients excluded |
| `GET/PATCH/DELETE /api/tasks/[id]` | All | `userId` on all ops; `updateMany`/`deleteMany` atomic |
| `GET/POST /api/tasks/[id]/comments` | GET, POST | Task ownership verified; `userId` on create |
| `PATCH /api/tasks/[id]/position` | PATCH | `userId` + optimistic locking (atomic `updateMany`) |
| `POST /api/tasks/[id]/subtasks` | POST | Task ownership verified before subtask create |
| `GET/POST /api/tasks/[id]/time-entries` | GET, POST | Task ownership verified; `userId` on create; server overrides `projectId`/`taskId` |
| `PATCH/DELETE /api/subtasks/[id]` | Both | Ownership via `task: { userId }` relation join |
| `GET/POST /api/time-entries` | GET, POST | `userId` filter; project/task ownership verified |
| `GET/DELETE /api/time-entries/[id]` | Both | `findFirst`/`deleteMany` with `userId` |
| `GET/POST /api/invoices` | GET, POST | `userId` filter; project/client ownership verified |
| `GET/PATCH /api/invoices/[id]` | Both | `userId` in findFirst and `updateMany` (atomic) |
| `GET /api/notifications` | GET | `userId` filter |
| `PATCH /api/notifications/[id]/read` | PATCH | Explicit `userId !== auth.userId` → 403 check |
| `POST /api/notifications/mark-all-read` | POST | `updateMany` scoped to `userId` |
| `GET /api/dashboard/stats` | GET | All 5 aggregations scoped to `userId` |
| `GET /api/analytics` | GET | All 7 parallel queries scoped to `userId` |
| `GET/PATCH /api/settings/account` | Both | `findUnique`/`update` by `auth.userId` |
| `POST/DELETE /api/settings/avatar` | Both | `update` by `auth.userId` |
| `POST /api/settings/change-password` | POST | Current password verified; other sessions invalidated |
| `POST /api/settings/delete-account` | POST | Password verified; soft delete; all sessions cleared |
| `GET /api/settings/export` | GET | All queries filtered by `userId` |
| `GET/PATCH /api/settings/notifications` | Both | `userId` on findUnique/upsert |
| `GET /api/health` | GET | Public (intentionally unauthenticated) |

---

## Authentication & Session Audit

| Check | Result | Evidence |
|-------|--------|---------|
| Unauthenticated page access blocked | **PASS** | `middleware.ts:40` redirects protected paths to `/login` |
| Unauthenticated API access blocked | **PASS** | `requireAuth()` called as first line of every auth'd route |
| Only public routes allowed without login | **PASS** | `/`, `/login`, `/signup`, `/api/health` only |
| Cookie `httpOnly` | **PASS** | Set in all 4 cookie operations (login, register, logout, requireAuth clear) |
| Cookie `secure` | **PASS** | `process.env.NODE_ENV === "production"` |
| Cookie `sameSite` | **PASS** | `"strict"` everywhere |
| Cookie `path` | **PASS** | `"/"` everywhere |
| Session absolute expiry (30d) | **PASS** | `auth.ts:32` checks `expiresAt < now()` |
| Session idle timeout (7d) | **PASS** | `auth.ts:36-42` checks `lastActiveAt + 7d < now()` |
| `lastActiveAt` updated on use | **PASS** | `auth.ts:45-50` updates on every valid session access |
| Session destroyed on logout | **PASS** | `logout/route.ts:12` `deleteMany({ where: { tokenHash } })` |
| Sessions invalidated on password change | **PASS** | `change-password/route.ts:85-90` deletes all except current |
| Token stored as SHA-256 hash, not plaintext | **PASS** | `auth.ts:10-12` — `createHash("sha256")` |
| Token entropy | **PASS** | `nanoid(32)` = 192 bits |
| Password hash: bcrypt, cost 12 | **PASS** | `bcrypt.hash(password, 12)` in register and change-password |
| Password complexity enforced | **PASS** | Zod: 8+ chars, uppercase, lowercase, digit |
| Generic login error message | **PASS** | Same `"Invalid email or password."` for wrong email and wrong password |
| Login rate limiting | **PASS** | 5 attempts/15min per IP |
| Registration rate limiting | **FAIL** | None (Finding #5) |
| Login timing attack protection | **FAIL** | No dummy bcrypt compare when user not found (Finding #7) |
| Password change requires current password | **PASS** | `bcrypt.compare()` before update |
| Email change requires password | **FAIL** | No re-authentication (Finding #9) |

---

## Input Validation Audit

| Check | Result | Evidence |
|-------|--------|---------|
| All mutations validated server-side | **PASS** | Zod schemas on every POST, PATCH, PUT, DELETE endpoint |
| SQL injection prevented | **PASS** | All queries through Prisma (parameterized); no raw SQL except `SELECT 1` in health check |
| XSS via `dangerouslySetInnerHTML` | **PASS** | Zero occurrences in entire codebase |
| XSS via CSP header | **FAIL** | No CSP configured (Finding #4) |
| Error messages: no stack traces | **PASS** | All 500 responses use generic messages |
| Error messages: no password hashes | **PASS** | `passwordHash` never in Prisma `select` for API responses |
| IDs non-sequential | **PASS** | CUIDs used (non-guessable) |
| File upload validated | **PASS** | `avatar/route.ts:6-7` — 2MB max, JPEG/PNG only |
| Input length limits | **PARTIAL** | All schemas except register `name` have `max()` (Finding #16) |
| Query params validated | **PASS** | Zod schemas on GET routes for tasks, time-entries, notifications |
| Pagination limits enforced | **PASS** | All paginated routes: `Math.min(limit, 100)` or `z.coerce.number().max(100)` |

---

## Infrastructure Audit

| Check | Result | Evidence |
|-------|--------|---------|
| Security headers | **FAIL** | Empty `next.config.mjs` (Finding #4) |
| `.env` committed | **PASS** | Only `.env.example` with placeholder values |
| Hardcoded secrets | **PARTIAL** | Fallback `DATABASE_URL` with `taskflow:taskflow` in `db.ts` (Finding #11) |
| Dependencies audited | OUT OF SCOPE | Static analysis only |
| HTTPS enforcement (HSTS) | **FAIL** | No HSTS header |
| CSP configured | **FAIL** | No CSP header |
| Rate limiting active | **PARTIAL** | Login only; in-memory only (Findings #5, #6) |
| Prisma query safety | **PASS** | No raw SQL; all parameterized |
| Connection pooling | **PASS** | Neon pooler via `DATABASE_URL`; direct for migrations |

---

## Account Management Audit

| Check | Result | Evidence |
|-------|--------|---------|
| Password change requires current password | **PASS** | `bcrypt.compare()` in `change-password/route.ts:63` |
| Password change invalidates other sessions | **PASS** | `deleteMany` excluding current session |
| New password meets complexity rules | **PASS** | Same Zod schema as registration |
| Confirmation match validated | **PASS** | Zod `.refine()` |
| Account deletion requires password | **PASS** | `bcrypt.compare()` in `delete-account/route.ts:46` |
| Account deletion is soft delete (30d grace) | **PASS** | Sets `scheduledDeletionAt` |
| Account deletion clears all sessions | **PASS** | `deleteMany({ where: { userId } })` + cookie cleared |
| Cascading data deletion | **PASS** | Prisma `onDelete: Cascade` on all user-owned relations |
| Deletion response includes data counts | **PASS** | Returns client/project/task/entry/invoice counts |

---

## Positive Security Practices (to maintain)

1. **Consistent `userId` filtering** — 28 of 31 routes use atomic ownership in all DB operations (the 3 exceptions are defense-in-depth failures, not direct exploits)
2. **Atomic ownership operations** — Uses `updateMany`/`deleteMany` with `userId` constraint throughout (avoids TOCTOU races)
3. **Optimistic locking** — Clients, projects, tasks, invoices all verify `updatedAt` timestamp before writes
4. **Session token hashing** — SHA-256 hash stored in DB, raw token only in httpOnly cookie
5. **Server-side field override** — Time entry creation forces `projectId`/`taskId` from server-verified values, ignoring client input
6. **Invoiced entry protection** — Cannot modify/delete time entries that have been invoiced
7. **Draft-only invoice deletion** — Cannot delete sent/paid invoices
8. **Generic error messages** — All 500 responses use consistent, non-revealing messages
9. **Bcrypt cost 12** — Strong password hashing with appropriate cost factor
10. **Comprehensive Zod validation** — Every mutation endpoint validates with schemas including trim, min, max, type checks

---

## Recommendations by Priority

### Immediate — Fix Before Production

| # | Action | Finding | Effort |
|---|--------|---------|--------|
| 1 | Add `userId` to invoice payment `update()` WHERE clause | #1 | 1 line |
| 2 | Replace invoice `delete()` with `deleteMany()` including `userId` | #2 | 1 line |
| 3 | Add `userId` to time entry `update()` WHERE clause | #3 | 1 line |
| 4 | Configure security headers in `next.config.mjs` | #4 | 20 lines |
| 5 | Add rate limiting to registration endpoint | #5 | 5 lines |
| 6 | Replace in-memory rate limiter with Upstash Redis | #6 | ~50 lines |
| 7 | Block login for soft-deleted users (`scheduledDeletionAt` check) | #20 | 5 lines |
| 8 | Validate `returnUrl` is a relative path (prevent open redirect) | #21 | 5 lines |

### Short-Term — Before Public Launch

| # | Action | Finding | Effort |
|---|--------|---------|--------|
| 9 | Add dummy bcrypt compare for non-existent users on login | #7 | 3 lines |
| 10 | Add server-side session validation in authenticated layout | #8 | 10 lines |
| 11 | Require password when changing email | #9 | 15 lines |
| 12 | Require password + rate limit for data export | #10 | 15 lines |
| 13 | Remove hardcoded fallback `DATABASE_URL` from `db.ts` | #11 | 3 lines |
| 14 | Implement email verification flow | #12 | ~200 lines |
| 15 | Fix IP extraction to use `req.ip` or trusted proxy header | #13 | 2 lines |
| 16 | Add auth event audit logging | #14 | ~100 lines |
| 17 | Add invoice state transition validation (state machine) | #23 | 20 lines |
| 18 | Handle invoice number race condition (catch P2002, retry) | #22 | 10 lines |

### Long-Term — Hardening

| # | Action | Finding | Effort |
|---|--------|---------|--------|
| 19 | Remove unused `SESSION_SECRET` from `.env.example` or implement HMAC signing | #15 | 1–50 lines |
| 20 | Add `.max(200)` to register name field | #16 | 1 line |
| 21 | Sanitize `console.error` calls to log messages only | #17 | 10 lines |
| 22 | Add `Origin` header verification for CSRF defense-in-depth | #18 | 15 lines |
| 23 | Add try-catch to project route DB operations | #19 | 10 lines |
| 24 | Validate payment amount does not exceed balance due | #24 | 3 lines |
| 25 | Move seed credentials to env vars; guard against production use | #25 | 5 lines |

---

## Conclusion

**Overall assessment: GOOD foundation with specific holes to close.**

The codebase demonstrates strong security fundamentals. 28 of 31 routes have correct multi-tenant isolation. Session management is robust. Input validation is comprehensive. Error handling is consistent.

**Critical/High issues to fix immediately:**
1. **3 routes drop `userId` on write operations** (Findings #1, #2, #3) — 1-line fixes each
2. **Soft-deleted users can log back in** (Finding #20) — `scheduledDeletionAt` is never checked in auth
3. **Open redirect on login page** (Finding #21) — `returnUrl` goes to any URL including external sites
4. **No security headers** (Finding #4) — no CSP, HSTS, X-Frame-Options
5. **Registration has no rate limiting** (Finding #5) and rate limiter is in-memory only (#6)

The 8 "Immediate" fixes require approximately 90 lines of code total and address all Critical and High severity findings.
