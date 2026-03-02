# TaskFlow — Security Audit (Code-Level)

> **Scope:** Every implemented API route, middleware path, database query, session flow, and configuration file has been reviewed against OWASP Top 10 (2021), common multi-tenant security failures, and professional penetration testing standards.
>
> **Prior audit:** The previous version of this file audited the *plan documents*. This version audits the **actual shipped code** and identifies which planned mitigations were implemented, which were missed, and what new issues exist in the implementation.

---

## Audit Framework

### OWASP Top 10 (2021) Checklist

| # | Risk | Relevance to TaskFlow |
|---|------|-----------------------|
| A01 | Broken Access Control | Multi-tenant app — every query must scope to `userId`. IDOR via URL parameter manipulation. |
| A02 | Cryptographic Failures | Password hashing, session token generation, token storage |
| A03 | Injection | SQL injection (via Prisma ORM), XSS (React auto-escaping + CSP), NoSQL injection (N/A) |
| A04 | Insecure Design | Dev-mode auth bypass, missing re-authentication for sensitive actions |
| A05 | Security Misconfiguration | Security headers, default credentials in seed data, open error messages |
| A06 | Vulnerable Components | Dependency versions, known CVEs |
| A07 | Auth Failures | Session management, brute force protection, credential stuffing |
| A08 | Data Integrity Failures | Unsigned data, deserialization (N/A for this stack) |
| A09 | Logging & Monitoring | Error logging, missing audit trail |
| A10 | SSRF | Server-side URL fetching (not applicable — no URL-based inputs) |

### Multi-Tenant / Penetration Testing Checklist

- Can User A see/modify/delete User B's data on **every** endpoint?
- Can unauthenticated requests reach any protected resource?
- Are sessions properly created, validated, and destroyed?
- Is input validated server-side on every write path?
- Do error messages leak internal details?
- Are security headers complete?
- Are secrets excluded from committed code?
- Is rate limiting active?
- Does password change require current password?
- Does account deletion cascade completely?

---

## Summary of Findings

**Total issues: 21** — 4 Critical, 6 High, 7 Medium, 4 Low

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 4 | Auth bypass in dev mode, error message info leak, missing rate limiting, missing CSRF validation |
| **High** | 6 | TOCTOU race in project/task delete, email change without password, timing attack on login, missing bcrypt dummy comparison on registration, missing userId filter on time entry aggregation, account deletion doesn't cascade immediately |
| **Medium** | 7 | Registration reveals email existence, session cookie not Secure outside production, no Origin header check, next.config.mjs has no security headers for API routes, seed data has weak password, CSP allows unsafe-eval/unsafe-inline, no session count limit per user |
| **Low** | 4 | Dev database URL fallback in production risk, console.error may log sensitive data, no Referrer-Policy on API responses, missing rate limit on health endpoint |

---

## Issues by Severity

### CRITICAL

#### C1 — Development Auth Bypass Reachable in Production

**Location:** `src/lib/auth.ts:57-63`, `src/middleware.ts:40-46`

**Issue:** Both the middleware and `getSession()` have development-mode fallback logic. The middleware allows **all protected routes without a session cookie** when `NODE_ENV === "development"`. The `getSession()` function returns the **first user in the database** as a fallback when no valid session exists in development mode.

**Real-world risk:** If `NODE_ENV` is accidentally set to `"development"` in production (misconfigured Netlify env, missing variable), **every API route is accessible without authentication** and operates as the first user in the database. This is a complete authentication bypass.

**Evidence:**
```typescript
// middleware.ts:40-46
if (process.env.NODE_ENV === "development") {
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next(); // ← All protected routes accessible
}

// auth.ts:57-63
if (process.env.NODE_ENV === "development") {
  const devUser = await db.user.findFirst(); // ← Returns arbitrary user
  if (devUser) {
    return { userId: devUser.id, sessionId: "dev-session" };
  }
}
```

**Fix:** Remove the development bypass entirely. Developers should create a real account and log in via the normal flow. The seed script already provides test credentials (`sarah@fletcherdesign.co / password123`). If a dev convenience is needed, use a dedicated `DEV_AUTO_LOGIN=true` environment variable that is **never** tied to `NODE_ENV`.

---

#### C2 — Login Error Handler Leaks Internal Error Messages

**Location:** `src/app/api/auth/login/route.ts:78-85`

**Issue:** The login endpoint's catch block returns the raw error message to the client:

```typescript
const message = err instanceof Error ? err.message : String(err);
console.error("Login error:", message, err);
return NextResponse.json(
  { error: `Login failed: ${message}` }, // ← Leaks internal error
  { status: 500 }
);
```

**Real-world risk:** Database connection errors, Prisma query errors, or bcrypt errors could expose database hostnames, table names, query structure, or other internal details to attackers. This violates OWASP A05 (Security Misconfiguration).

**Fix:** Return a generic error message. Log the real error server-side only:
```typescript
return NextResponse.json(
  { error: "Login failed. Please try again." },
  { status: 500 }
);
```

---

#### C3 — No Rate Limiting on Any Endpoint

**Location:** All API routes under `src/app/api/`

**Issue:** The implementation plan specifies Upstash Redis rate limiting (5/15min on login, 3/hr on signup, etc.), but **no rate limiting is implemented in any API route**. The Upstash packages (`@upstash/ratelimit`, `@upstash/redis`) are not installed, and no rate limiting middleware or helper exists anywhere in the codebase.

**Real-world risk:**
- **Credential stuffing:** Unlimited login attempts allow automated password guessing
- **Account enumeration:** Registration endpoint reveals email existence (see M1) with no throttle
- **DoS:** Expensive endpoints (analytics, dashboard stats) can be hammered without limit
- **Data scraping:** All list endpoints can be iterated without throttle

**Evidence:**
```bash
$ grep -r "ratelimit\|upstash\|rate.limit\|throttle" src/
# (no results)
```

**Fix:** Install `@upstash/ratelimit` and `@upstash/redis`. Create a `src/lib/rate-limit.ts` helper. Apply rate limiters at minimum to:
- `POST /api/auth/login` — 5 per 15 min per IP
- `POST /api/auth/register` — 3 per hour per IP
- `POST /api/settings/delete-account` — 3 per hour per user
- `POST /api/settings/change-password` — 5 per hour per user
- All authenticated endpoints — 100 per minute per user

---

#### C4 — No CSRF Protection Beyond SameSite Cookie

**Location:** All state-changing API routes (POST, PATCH, DELETE)

**Issue:** The session cookie uses `sameSite: "strict"`, which provides CSRF protection in modern browsers. However:
1. There is **no `Origin` header validation** as defense-in-depth
2. There is **no CSRF token mechanism**
3. Older browsers or certain configurations may not enforce `SameSite`

The implementation plan (§4.2, QA §12.4) specifies CSRF protection, but only `SameSite` is implemented.

**Real-world risk:** If `SameSite` enforcement is bypassed (older browser, browser bug, plugin), any cross-origin site could forge state-changing requests using the user's session.

**Fix:** Add `Origin` header verification middleware for all state-changing requests:
```typescript
const origin = req.headers.get("origin");
if (origin && origin !== process.env.NEXT_PUBLIC_APP_URL) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

### HIGH

#### H1 — TOCTOU Race Condition in Project and Task Deletion

**Location:** `src/app/api/projects/[id]/route.ts:183-196`, `src/app/api/tasks/[id]/route.ts:151-168`

**Issue:** Both `DELETE /api/projects/[id]` and `DELETE /api/tasks/[id]` use a two-step pattern: first `findFirst` to verify ownership, then `delete` by `id` alone. Between the check and the delete, another request could change ownership or the record could be modified.

```typescript
// projects/[id]/route.ts:183-194
const project = await db.project.findFirst({
  where: { id: params.id, userId: auth.userId }, // Step 1: check ownership
});
if (!project) { return 404; }
await db.project.delete({ where: { id: params.id } }); // Step 2: delete WITHOUT userId check
```

**Real-world risk:** In a multi-tenant system, this is a classic Time-of-Check-Time-of-Use (TOCTOU) vulnerability. While unlikely to be exploitable in practice (CUIDs are random, race window is tiny), it violates the principle of least privilege. The client DELETE route correctly uses `deleteMany` with `userId` — the project and task routes should follow the same pattern.

**Fix:** Use `deleteMany` with both `id` and `userId` in the where clause (same pattern as `DELETE /api/clients/[id]`):
```typescript
const result = await db.project.deleteMany({
  where: { id: params.id, userId: auth.userId },
});
if (result.count === 0) { return 404; }
```

---

#### H2 — Email Change Without Password Re-authentication

**Location:** `src/app/api/settings/account/route.ts:82-100`

**Issue:** The `PATCH /api/settings/account` endpoint allows changing the user's email with only a valid session — no current password required.

**Real-world risk:** If an attacker obtains a valid session (stolen cookie, physical device access, session fixation), they can:
1. Change the email to their own
2. Use forgot-password flow on the new email
3. Set a new password → permanent account hijack

The previous plan-level audit (Issue #9) flagged this. It was not fixed in the implementation.

**Fix:** Require `currentPassword` in the request body when `email` is being changed. Verify it with `bcrypt.compare()` before applying the update.

---

#### H3 — Login Timing Attack Enables User Enumeration

**Location:** `src/app/api/auth/login/route.ts:28-48`

**Issue:** When a user is not found, the endpoint returns immediately. When a user is found, it runs `bcrypt.compare()` (~200-300ms). This timing difference reveals whether an email address is registered.

```typescript
const user = await db.user.findFirst({ ... });
if (!user) {
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  // ← Returns in ~5ms
}
const valid = await bcrypt.compare(password, user.passwordHash);
// ← Takes ~250ms
```

**Real-world risk:** An attacker can determine which email addresses have accounts by measuring response times. This enables targeted phishing and credential stuffing.

**Fix:** Always run bcrypt comparison, even when the user is not found:
```typescript
const DUMMY_HASH = "$2a$12$dummy.hash.for.timing.protection.padded";
if (!user) {
  await bcrypt.compare(password, DUMMY_HASH); // Constant-time regardless
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}
```

---

#### H4 — Registration Endpoint Reveals Email Existence (Different Error Code)

**Location:** `src/app/api/auth/register/route.ts:37-42`

**Issue:** The registration endpoint returns HTTP 409 with "An account with this email already exists" when a duplicate email is submitted. While this is standard UX, it enables automated email enumeration when combined with the lack of rate limiting (C3).

**Real-world risk:** An attacker can systematically check thousands of email addresses against the registration endpoint to build a list of registered users. Without rate limiting, this is trivially automatable.

**Fix:** This is acceptable UX if rate limiting (C3) is implemented. With rate limiting: low risk. Without rate limiting: high risk for enumeration.

---

#### H5 — Missing userId Filter on Time Entry Aggregation Queries

**Location:** `src/app/api/tasks/[id]/route.ts:126-129`, `src/app/api/tasks/[id]/position/route.ts:69-72`, `src/app/api/projects/route.ts:67-73`

**Issue:** Several time entry aggregation queries filter by `taskId` or `projectId` but **not** by `userId`:

```typescript
// tasks/[id]/route.ts:126-129 (PATCH response)
const timeAgg = await db.timeEntry.aggregate({
  where: { taskId: params.id }, // ← No userId filter
  _sum: { durationMinutes: true },
});

// tasks/[id]/position/route.ts:69-72
const timeAgg = await db.timeEntry.aggregate({
  where: { taskId: params.id }, // ← No userId filter
  _sum: { durationMinutes: true },
});

// projects/route.ts:67-73
const trackedHours = projectIds.length > 0
  ? await db.timeEntry.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projectIds } }, // ← No userId filter
      _sum: { durationMinutes: true },
    })
  : [];
```

**Real-world risk:** In the current single-tenant-per-row data model, time entries are already scoped by the parent task/project ownership, so this doesn't leak *other users' data* in practice. However, it violates defense-in-depth — if the data model ever changes (e.g., shared projects), these queries would aggregate across users. The fact that the same aggregation in `GET /api/tasks/[id]/time-entries` correctly includes `userId: auth.userId` shows this was intended.

**Fix:** Add `userId: auth.userId` to all time entry aggregation queries for consistency and defense-in-depth.

---

#### H6 — Account Deletion Doesn't Cascade Data Immediately

**Location:** `src/app/api/settings/delete-account/route.ts:63-67`

**Issue:** Account deletion only sets `scheduledDeletionAt = new Date()` but does not actually delete any data. The plan mentions a "daily job" that hard-deletes after 30 days, but **this job does not exist in the codebase**. Meanwhile:
1. The user's data (clients, projects, tasks, time entries) remains accessible if the session is somehow still valid
2. No mechanism prevents login after deletion is scheduled
3. There is no reactivation path documented

```typescript
await db.user.update({
  where: { id: auth.userId },
  data: { scheduledDeletionAt: new Date() },
});
```

**Real-world risk:** Users who "delete" their account have their data retained indefinitely because the cleanup job doesn't exist. This is a GDPR/privacy compliance issue. Additionally, a scheduled-for-deletion user could potentially log back in since the account still exists.

**Fix:**
1. Implement the scheduled deletion cron job (or Netlify scheduled function)
2. Add a check in `getSession()` / `requireAuth()` that rejects users where `scheduledDeletionAt` is set
3. Document the 30-day grace period clearly in the deletion response

---

### MEDIUM

#### M1 — Registration Reveals Email Existence Without Throttle

**Location:** `src/app/api/auth/register/route.ts:37-42`

**Issue:** Combined with C3 (no rate limiting), the 409 response on duplicate email enables automated user enumeration. See H4 for details.

**Fix:** Implement rate limiting per C3. Consider returning a 200 with "Check your email for verification" regardless of whether the account exists (requires email verification flow).

---

#### M2 — Session Cookie Not Secure Outside Production

**Location:** `src/app/api/auth/login/route.ts:70-71`, `src/app/api/auth/register/route.ts:74-75`

**Issue:** The `secure` flag on the session cookie is conditional:
```typescript
secure: process.env.NODE_ENV === "production",
```

**Real-world risk:** In staging environments, preview deploys, or any non-production HTTPS deployment where `NODE_ENV` is not exactly `"production"`, the cookie will be sent over HTTP, exposing it to network sniffing.

**Fix:** Set `secure: true` unconditionally for any deployed environment. Only disable for localhost development:
```typescript
secure: process.env.NODE_ENV !== "development" || req.url.startsWith("https"),
```

---

#### M3 — No Origin Header Validation on API Routes

**Location:** All API routes

**Issue:** No API route checks the `Origin` or `Referer` header. While `SameSite=Strict` cookies prevent most CSRF, Origin validation is a critical defense-in-depth layer. See C4.

**Fix:** Add Origin validation middleware.

---

#### M4 — next.config.mjs Has No Security Configuration

**Location:** `next.config.mjs`

**Issue:** The Next.js config is completely empty:
```javascript
const nextConfig = {};
```

While security headers are set in `netlify.toml`, they only apply when deployed to Netlify. The Next.js config should also set headers for:
- Local development security testing
- Non-Netlify deployment targets
- API route responses (Netlify headers may not apply to serverless function responses)

**Fix:** Add security headers in `next.config.mjs`:
```javascript
const nextConfig = {
  headers: async () => [{
    source: "/:path*",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      // etc.
    ],
  }],
  poweredBy: false,
};
```

---

#### M5 — Seed Data Contains Weak Default Password

**Location:** `prisma/seed.ts:8`

**Issue:** The seed script creates a user with password `password123`:
```typescript
const passwordHash = await bcrypt.hash("password123", 12);
```

**Real-world risk:** If seed data is accidentally run against a production database (misconfigured CI/CD), a known password exists. The email `sarah@fletcherdesign.co` with password `password123` would be a trivially guessable account.

**Fix:** Add a guard that prevents seeding in production:
```typescript
if (process.env.NODE_ENV === "production") {
  console.error("Seed script cannot run in production.");
  process.exit(1);
}
```

---

#### M6 — CSP Allows unsafe-eval and unsafe-inline

**Location:** `netlify.toml:21`

**Issue:** The Content-Security-Policy includes both `'unsafe-eval'` and `'unsafe-inline'` for scripts:
```
script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

**Real-world risk:** These directives significantly weaken XSS protection:
- `unsafe-inline` allows injected `<script>` tags to execute
- `unsafe-eval` allows `eval()`, `Function()`, and similar dynamic code execution
- Together, they essentially negate CSP's XSS protection

**Fix:** Use nonce-based CSP for inline scripts. Next.js supports `nonce` configuration. Remove `unsafe-eval` (if needed for development only, use a dev-specific CSP). At minimum, remove `unsafe-eval` in production.

---

#### M7 — No Session Count Limit Per User

**Location:** `src/app/api/auth/login/route.ts:56-65`, `src/app/api/auth/register/route.ts:61-70`

**Issue:** Every login/registration creates a new session without checking how many active sessions the user already has. There is no maximum session count.

**Real-world risk:** An attacker who obtains valid credentials could create unlimited sessions, making it impossible to revoke all compromised access (they'd need to change password to invalidate all). Also, session table could grow unboundedly.

**Fix:** Either limit sessions to N (e.g., 10) per user (delete oldest when exceeded), or add a "revoke all sessions" button in settings.

---

### LOW

#### L1 — Development Database URL Fallback

**Location:** `src/lib/db.ts:4-6`

**Issue:** The database module sets a fallback `DATABASE_URL` when none is configured and `NODE_ENV` is not production:
```typescript
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL = "postgresql://taskflow:taskflow@localhost:5432/taskflow";
}
```

**Real-world risk:** Low — the guard checks for non-production. However, if `NODE_ENV` is unset (defaults to undefined, not "production"), the fallback activates, potentially connecting to an unintended database.

**Fix:** Only set fallback when `NODE_ENV === "development"` (explicit match, not negation of production).

---

#### L2 — Console.error May Log Sensitive Data

**Location:** Multiple API routes (login, registration, analytics, dashboard, settings)

**Issue:** Several catch blocks log the full error object:
```typescript
console.error("Login error:", message, err);
console.error("GET /api/analytics error:", err);
```

In serverless environments (Netlify Functions), these logs are stored in the provider's logging dashboard. If errors contain request bodies, they could include passwords, tokens, or personal data.

**Fix:** Log only error messages, not full error objects. Never log request bodies. Use structured logging with sensitive field redaction.

---

#### L3 — No Referrer-Policy on API Responses

**Location:** All API route responses

**Issue:** The `netlify.toml` sets `Referrer-Policy: strict-origin-when-cross-origin` for page responses, but API responses from Netlify Functions may not inherit these headers.

**Fix:** Set headers in API responses or in Next.js middleware.

---

#### L4 — No Rate Limit on Health Endpoint

**Location:** `src/app/api/health/route.ts`

**Issue:** The health endpoint executes a database query (`SELECT 1`) on every request with no rate limiting. It could be used as a DoS amplifier.

**Fix:** Add rate limiting (10/min per IP) or cache the response for a few seconds.

---

## Authentication Audit

### Session Lifecycle — What's Implemented vs. Planned

| Feature | Planned | Implemented | Status |
|---------|---------|-------------|--------|
| Database-backed sessions | Yes | Yes | PASS |
| SHA-256 hash of token stored (not raw) | Yes | Yes (`createHash("sha256")`) | PASS |
| Session token generated with `nanoid(32)` | Yes | Yes | PASS |
| `httpOnly` cookie | Yes | Yes | PASS |
| `secure` cookie in production | Yes | Yes (conditional) | WARN — see M2 |
| `sameSite: strict` | Yes | Yes | PASS |
| 30-day absolute expiry | Yes | Yes (`expiresAt`) | PASS |
| 7-day idle timeout | Yes | Yes (`lastActiveAt` check) | PASS |
| Touch `lastActiveAt` on each request | Yes | Yes | PASS |
| Logout destroys server session | Yes | Yes (`deleteMany`) | PASS |
| Logout clears cookie | Yes | Yes (`maxAge: 0`) | PASS |
| Password change invalidates other sessions | Yes | Yes | PASS |
| Dev mode bypass | Not planned for prod | Exists (dangerous) | **FAIL — C1** |

### Can Any Page/Action Work Without Login?

| Route | Should Require Auth | Actually Requires Auth | Status |
|-------|-------------------|----------------------|--------|
| `GET /` (landing) | No | No | PASS |
| `GET /login` | No | No | PASS |
| `GET /signup` | No | No | PASS |
| `GET /api/health` | No | No | PASS |
| `POST /api/auth/login` | No | No | PASS |
| `POST /api/auth/register` | No | No | PASS |
| `POST /api/auth/logout` | No* | No* | PASS — gracefully handles missing session |
| `GET /dashboard` | Yes | **Dev bypass (C1)** | FAIL in dev |
| All `/api/clients/*` | Yes | Yes (`requireAuth`) | PASS |
| All `/api/projects/*` | Yes | Yes (`requireAuth`) | PASS |
| All `/api/tasks/*` | Yes | Yes (`requireAuth`) | PASS |
| All `/api/time-entries/*` | Yes | Yes (`requireAuth`) | PASS |
| All `/api/settings/*` | Yes | Yes (`requireAuth`) | PASS |
| `GET /api/analytics` | Yes | Yes (`requireAuth`) | PASS |
| `GET /api/dashboard/stats` | Yes | Yes (`requireAuth`) | PASS |

**Note:** Middleware skips API routes entirely (`pathname.startsWith("/api/")`), so API route protection relies solely on `requireAuth()` in each handler. This is correct — the middleware handles page redirects, and `requireAuth()` handles API auth.

---

## Data Isolation Audit (IDOR Check)

### Can User A EVER See, Modify, or Delete User B's Data?

Every API route has been checked for `userId` scoping in database queries:

| Route | Method | userId in WHERE/data | IDOR Protected | Notes |
|-------|--------|---------------------|----------------|-------|
| `/api/clients` | GET | `userId: auth.userId` | PASS | |
| `/api/clients` | POST | `userId: auth.userId` in create | PASS | |
| `/api/clients/[id]` | GET | `id + userId` | PASS | |
| `/api/clients/[id]` | PATCH | `id + userId` (updateMany) | PASS | Optimistic locking also scoped |
| `/api/clients/[id]` | DELETE | `id + userId` (deleteMany) | PASS | Atomic check+delete |
| `/api/clients/[id]/archive` | PATCH | `id + userId` (updateMany) | PASS | |
| `/api/clients/[id]/summary` | GET | `id + userId` | PASS | Sub-queries also scoped |
| `/api/projects` | GET | `userId: auth.userId` | PASS | |
| `/api/projects` | POST | `userId + client ownership verified` | PASS | |
| `/api/projects/[id]` | GET | `id + userId` | PASS | |
| `/api/projects/[id]` | PATCH | `id + userId` (updateMany) | PASS | Client change also verified |
| `/api/projects/[id]` | DELETE | `findFirst(id+userId)` then `delete(id)` | **WARN — H1** | TOCTOU race |
| `/api/projects/[id]/tasks` | GET | Project ownership verified, tasks scoped | PASS | |
| `/api/projects/[id]/tasks` | POST | Project ownership verified | PASS | |
| `/api/tasks` | GET | `userId: auth.userId` | PASS | |
| `/api/tasks/[id]` | GET | `id + userId` | PASS | |
| `/api/tasks/[id]` | PATCH | `id + userId` (updateMany) | PASS | |
| `/api/tasks/[id]` | DELETE | `findFirst(id+userId)` then `delete(id)` | **WARN — H1** | TOCTOU race |
| `/api/tasks/[id]/position` | PATCH | `id + userId` (updateMany) | PASS | |
| `/api/tasks/[id]/comments` | GET | Task ownership verified | PASS | |
| `/api/tasks/[id]/comments` | POST | Task ownership verified | PASS | |
| `/api/tasks/[id]/subtasks` | POST | Task ownership verified | PASS | |
| `/api/tasks/[id]/time-entries` | GET | Task ownership + `userId` | PASS | |
| `/api/tasks/[id]/time-entries` | POST | Task ownership verified | PASS | |
| `/api/subtasks/[id]` | PATCH | Join: subtask → task → userId | PASS | |
| `/api/subtasks/[id]` | DELETE | Join: subtask → task → userId | PASS | |
| `/api/time-entries` | GET | `userId: auth.userId` | PASS | |
| `/api/dashboard/stats` | GET | All queries scoped to userId | PASS | |
| `/api/analytics` | GET | All queries scoped to userId | PASS | |
| `/api/settings/account` | GET/PATCH | `auth.userId` | PASS | |
| `/api/settings/change-password` | POST | `auth.userId` | PASS | |
| `/api/settings/delete-account` | POST | `auth.userId` | PASS | |

**URL Manipulation Test Results:**
- Changing `[id]` params in client/project/task URLs → 404 (not 403), preventing existence enumeration
- All list endpoints filter by `userId` → no cross-user data in listings
- Cursor-based pagination cursors (client-provided IDs) are validated by Prisma's cursor mechanism, scoped by the `where` clause

---

## Input Validation Audit

### Server-Side Validation Coverage

| Endpoint | Validation Library | Schema Exists | Max Length Enforced | Type Checked |
|----------|-------------------|---------------|--------------------|----|
| `POST /api/auth/register` | Zod | Yes | name: no max, email: yes, password: yes | PASS |
| `POST /api/auth/login` | Zod | Yes | — | PASS |
| `POST /api/clients` | Zod | Yes | name: 200, email: 254, phone: 50, address: 1000, notes: 50000 | PASS |
| `PATCH /api/clients/[id]` | Zod | Yes | Same as create | PASS |
| `POST /api/projects` | Zod | Yes | name: 200, desc: 2000 | PASS |
| `PATCH /api/projects/[id]` | Zod | Yes | Same | PASS |
| `POST /api/projects/[id]/tasks` | Zod | Yes | title: 500, desc: 10000 | PASS |
| `PATCH /api/tasks/[id]` | Zod | Yes | Same | PASS |
| `POST /api/tasks/[id]/comments` | Zod | Yes | content: 5000 | PASS |
| `POST /api/tasks/[id]/subtasks` | Zod | Yes | title: 500 | PASS |
| `POST /api/tasks/[id]/time-entries` | Zod | Yes | duration: 1-1440min, desc: 2000 | PASS |
| `PATCH /api/settings/account` | Zod | Yes | name: 100, email: valid | PASS |
| `POST /api/settings/change-password` | Zod | Yes | Complexity rules enforced | PASS |
| `POST /api/settings/delete-account` | Zod | Yes | password: min 1 | PASS |

**Missing validation:**
- `POST /api/auth/register`: No max length on `name` field in the Zod schema (Prisma has no column limit either). A malicious user could submit a megabyte-long name. **Severity: Low.**

### SQL Injection

Prisma ORM parameterizes all queries. No raw SQL is used except `SELECT 1` in the health check. **No SQL injection risk.**

### XSS

- React auto-escapes rendered content by default
- No `dangerouslySetInnerHTML` usage found
- CSP headers configured (though weakened by `unsafe-inline` — see M6)
- Comment content, task descriptions, and notes are stored as plain text and rendered as text
- **No XSS risk in current implementation**

### Error Messages

| Endpoint | Error Detail Level | Status |
|----------|--------------------|--------|
| Login (wrong creds) | "Invalid email or password." | PASS — no enumeration |
| Login (server error) | **Leaks `err.message`** | **FAIL — C2** |
| Register (server error) | "Registration failed. Please try again." | PASS |
| Client CRUD (server error) | Generic message | PASS |
| Project/Task/Settings | Generic message or Zod field errors | PASS |
| Zod validation errors | Field-level messages (expected for UX) | PASS |

---

## Infrastructure Audit

### Security Headers (netlify.toml)

| Header | Value | Status |
|--------|-------|--------|
| `X-Frame-Options` | `DENY` | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `X-XSS-Protection` | `1; mode=block` | PASS (deprecated but harmless) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | PASS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | PASS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | PASS |
| `Content-Security-Policy` | See M6 | WARN — `unsafe-eval` and `unsafe-inline` |

**Missing headers:**
- `Cross-Origin-Opener-Policy: same-origin` (prevents cross-origin window access)
- `Cross-Origin-Embedder-Policy: require-corp` (prevents speculative execution attacks)

### Secrets in Committed Code

| File | Secret Type | Status |
|------|------------|--------|
| `.env.example` | Placeholder values only | PASS |
| `.gitignore` | `.env` and `.env*.local` excluded | PASS |
| `prisma/seed.ts` | Hardcoded password `password123` | WARN — see M5 |
| `src/lib/db.ts` | Fallback DB URL `postgresql://taskflow:taskflow@localhost:5432/taskflow` | WARN — see L1 |
| Source code | No API keys, tokens, or secrets found | PASS |

### Password Hashing

| Aspect | Implementation | Status |
|--------|---------------|--------|
| Algorithm | bcrypt (bcryptjs) | PASS |
| Cost factor | 12 rounds | PASS |
| Storage | `passwordHash` column, never returned in API responses | PASS |

---

## Account Management Audit

### Password Change (`POST /api/settings/change-password`)

| Check | Status |
|-------|--------|
| Requires current password | PASS |
| Validates new password complexity (8+ chars, upper, lower, digit) | PASS |
| Confirms new password matches | PASS |
| Hashes with bcrypt cost 12 | PASS |
| Invalidates all other sessions | PASS |
| Keeps current session valid | PASS |

### Account Deletion (`POST /api/settings/delete-account`)

| Check | Status |
|-------|--------|
| Requires password re-entry | PASS |
| Sets `scheduledDeletionAt` | PASS |
| Invalidates all sessions | PASS |
| Clears session cookie | PASS |
| Actually deletes data after 30 days | **FAIL — H6** (no cleanup job exists) |
| Blocks login after deletion scheduled | **FAIL — H6** (no check in auth) |
| Cascading delete configured in schema | PASS (all FKs have `onDelete: Cascade`) |

### Data Cascade Verification (Prisma Schema)

| Parent | Cascade Target | onDelete | Status |
|--------|---------------|----------|--------|
| User | Sessions | Cascade | PASS |
| User | PasswordResetTokens | Cascade | PASS |
| User | EmailVerificationTokens | Cascade | PASS |
| User | Clients | Cascade | PASS |
| User | Projects | Cascade | PASS |
| User | Tasks | Cascade | PASS |
| User | TimeEntries | Cascade | PASS |
| User | Comments | Cascade | PASS |
| Client | Projects | Cascade | PASS |
| Project | Tasks | Cascade | PASS |
| Project | TimeEntries | Cascade | PASS |
| Task | Subtasks | Cascade | PASS |
| Task | Comments | Cascade | PASS |
| Task | TimeEntries | **SetNull** | PASS — intentional (preserves time data) |

---

## Recommendations — Prioritized Fix List

### Must Fix Before Production (Critical + High)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| C1 | **Critical** | Dev auth bypass in `auth.ts` and `middleware.ts` | Remove dev fallbacks; use real auth in all environments |
| C2 | **Critical** | Login error leaks `err.message` | Return generic error; log details server-side only |
| C3 | **Critical** | No rate limiting on any endpoint | Install Upstash; implement per-endpoint rate limits |
| C4 | **Critical** | No CSRF Origin validation | Add Origin header check on state-changing routes |
| H1 | **High** | TOCTOU in project/task DELETE | Use `deleteMany` with `userId` in where clause |
| H2 | **High** | Email change without password | Require current password when changing email |
| H3 | **High** | Login timing attack | Always run bcrypt.compare (dummy hash on user-not-found) |
| H5 | **High** | Missing userId on time entry aggregation | Add `userId` filter to all aggregation queries |
| H6 | **High** | Account deletion incomplete | Implement cleanup job; block login for deleted users |

### Should Fix Before GA (Medium)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| M2 | **Medium** | Cookie not Secure outside production | Use `secure: true` for all non-localhost environments |
| M3 | **Medium** | No Origin header validation | Add to middleware or route wrapper |
| M4 | **Medium** | next.config.mjs empty | Add security headers for non-Netlify deployments |
| M5 | **Medium** | Seed script weak password | Guard against production execution |
| M6 | **Medium** | CSP unsafe-eval/unsafe-inline | Use nonce-based CSP; remove unsafe-eval |
| M7 | **Medium** | No session count limit | Cap at 10 sessions per user |
| H4 | **Medium** | Registration email enumeration + no rate limit | Fix by implementing C3 |

### Nice to Have (Low)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| L1 | **Low** | DB URL fallback on NODE_ENV unset | Use explicit `=== "development"` check |
| L2 | **Low** | console.error logs full errors | Use structured logging; redact sensitive fields |
| L3 | **Low** | No Referrer-Policy on API responses | Set in middleware |
| L4 | **Low** | No rate limit on health endpoint | Add basic per-IP throttle |

---

## What the Previous Plan-Level Audit Got Right

The previous SECURITY-AUDIT.md (which audited the plan documents) identified 19 issues. Here's how the implementation addressed them:

| Previous Issue | Status in Code |
|----------------|---------------|
| #1 — Session cookie signing / HMAC | **Resolved differently** — tokens hashed with SHA-256, not HMAC-signed. Secure because raw token is never stored. |
| #2 — Password reset token in URL | **Not yet implemented** — no forgot/reset password routes exist yet |
| #3 — GDPR export re-auth | **Not yet implemented** — no export endpoint exists yet |
| #4 — Account deletion requires password | **Implemented** — password required |
| #5 — Store only hash of session ID | **Implemented** — SHA-256 hash stored |
| #6 — Notification ownership check | **Not yet implemented** — no notification routes exist yet |
| #7 — Subtask ownership via parent join | **Implemented** — joins through task to verify userId |
| #8 — Portal token generation | **Not yet implemented** — no portal exists yet |
| #9 — Email change re-auth | **NOT implemented** — still missing (see H2) |
| #16 — Bcrypt timing attack | **NOT implemented** — still vulnerable (see H3) |
| #17 — CSRF via SameSite + Origin | **Partially implemented** — SameSite=Strict only, no Origin check (see C4) |

---

*This audit was performed against the codebase as of 2026-03-02. All findings reference specific file paths and line numbers. Re-audit should be performed after fixes are applied and before any new feature phase is completed.*
