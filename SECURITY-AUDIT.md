# TaskFlow — Security Audit (Code-Level)

> Full security audit of the TaskFlow application against OWASP Top 10, multi-tenant isolation, and professional penetration testing standards.
> **Audit date:** 2026-03-10
> **Scope:** All source code in `src/`, `prisma/schema.prisma`, `next.config.mjs`, middleware, and environment configuration.
> **Methodology:** Static code analysis of every API route (31 routes), middleware, auth library, validation schema, and client-side data path.
> **Prior audit:** This replaces the previous plan-level audit. This audit examines the actual implemented code, not the design documents.

---

## Audit Framework

### OWASP Top 10 (2021)

| # | Risk | Relevance to TaskFlow |
|---|------|-----------------------|
| A01 | Broken Access Control | Multi-tenant data isolation, IDOR, missing auth on routes |
| A02 | Cryptographic Failures | Password hashing, session token storage, HTTPS enforcement |
| A03 | Injection | SQL injection, XSS, command injection via user input |
| A04 | Insecure Design | Missing rate limiting, no email verification, no CSRF tokens |
| A05 | Security Misconfiguration | Missing security headers, empty `next.config.mjs`, no CSP |
| A07 | Identification & Authentication Failures | Session management, password policy, brute-force protection |
| A09 | Security Logging & Monitoring Failures | No audit trail for auth events |

### Multi-Tenant / Auth-Specific Checklist

- Every database query filters by `userId` from the validated session
- No IDOR: manipulating URL IDs cannot cross tenant boundaries
- Session cookies: `httpOnly`, `secure`, `sameSite=strict`, proper expiry
- Sessions destroyed on logout and password change
- Password change requires current password
- Account deletion cascades completely
- Registration and login rate-limited
- Error messages are generic (no stack traces, no internal IDs)

### Penetration Tester Checklist

- Unauthenticated access to protected routes and API endpoints
- Session fixation, session hijacking surface
- Cookie configuration weaknesses
- IDOR on every CRUD endpoint
- Input validation bypass attempts
- Security header presence
- Secrets in committed code
- Information disclosure in error responses

---

## Findings Summary

| # | Finding | Severity | OWASP | File |
|---|---------|----------|-------|------|
| 1 | Invoice payment update missing `userId` filter (IDOR) | **CRITICAL** | A01 | `src/app/api/invoices/[id]/payment/route.ts:61` |
| 2 | No security headers configured | **HIGH** | A05 | `next.config.mjs` |
| 3 | Registration endpoint has no rate limiting | **HIGH** | A04 | `src/app/api/auth/register/route.ts` |
| 4 | Rate limiter is in-memory only (lost on restart/scale) | **HIGH** | A07 | `src/lib/rate-limit.ts` |
| 5 | Middleware validates cookie existence, not session validity | **MEDIUM** | A01 | `src/middleware.ts:22` |
| 6 | No email verification before account activation | **MEDIUM** | A07 | `src/app/api/auth/register/route.ts:52` |
| 7 | IP address from `x-forwarded-for` is spoofable | **MEDIUM** | A04 | `src/app/api/auth/login/route.ts` |
| 8 | No authentication audit logging | **MEDIUM** | A09 | All auth routes |
| 9 | GDPR export has no re-authentication | **MEDIUM** | A01 | `src/app/api/settings/export/route.ts` |
| 10 | No explicit CSRF token (relies on `SameSite=Strict` alone) | **LOW** | A01 | Application-wide |
| 11 | Registration name field has no server-side max length | **LOW** | A03 | `src/app/api/auth/register/route.ts:9` |
| 12 | `console.error` leaks error details in register route | **LOW** | A09 | `src/app/api/auth/register/route.ts:85` |

---

## Detailed Findings

### FINDING 1 — Invoice Payment IDOR (CRITICAL)

**File:** `src/app/api/invoices/[id]/payment/route.ts`, lines 34–68
**OWASP:** A01 — Broken Access Control

**Description:**
The invoice payment endpoint correctly verifies ownership when reading the invoice (`findFirst({ where: { id, userId } })` on line 34), but the subsequent `update()` call on line 61 uses only `{ id: params.id }` — dropping the `userId` filter.

```typescript
// Line 34 — ownership check (correct)
const invoice = await db.invoice.findFirst({
  where: { id: params.id, userId: auth.userId },
});

// Line 61 — update WITHOUT userId (VULNERABLE)
const updated = await db.invoice.update({
  where: { id: params.id },  // ← missing userId: auth.userId
  data: { amountPaid, balanceDue, status },
});
```

**Real-world risk:**
Any authenticated user can record payments on any other user's invoice by knowing or guessing the invoice ID. This corrupts billing data across tenants. In a TOCTOU race condition (or future refactor that weakens the read check), the vulnerability becomes directly exploitable without the prior ownership check as a backstop.

**Attack scenario:**
1. User A creates invoice `inv_abc123`
2. User B calls `POST /api/invoices/inv_abc123/payment` with `{ amount: 0.01 }`
3. The `findFirst` returns `null` for User B (ownership check passes correctly in current code)
4. However, this is a defense-in-depth failure — the `update` itself should also be constrained

**Note on current exploitability:** Because the `findFirst` check on line 34 correctly returns 404 for non-owners, this vulnerability is **not directly exploitable in the current code path**. However, it represents a critical defense-in-depth failure. If any future code change bypasses the read check (caching, refactoring, adding a batch payment endpoint), the write becomes immediately exploitable.

**Fix:**
```typescript
const updated = await db.invoice.update({
  where: { id: params.id, userId: auth.userId },
  data: { amountPaid, balanceDue, status },
});
```

---

### FINDING 2 — No Security Headers (HIGH)

**File:** `next.config.mjs` (entire file is 2 lines)
**OWASP:** A05 — Security Misconfiguration

**Description:**
The Next.js configuration is completely empty:
```javascript
const nextConfig = {};
export default nextConfig;
```

No security headers are set anywhere in the application — not in `next.config.mjs`, not in middleware, not in any API route.

**Missing headers and their risk:**

| Header | Purpose | Risk if Missing |
|--------|---------|-----------------|
| `Content-Security-Policy` | Prevents XSS, inline script injection | Any stored XSS in task descriptions, client notes, or comments executes arbitrary JS |
| `X-Frame-Options` | Prevents clickjacking | Attacker embeds app in iframe, tricks user into clicking actions |
| `X-Content-Type-Options` | Prevents MIME sniffing | Browser may interpret uploads/responses as executable scripts |
| `Strict-Transport-Security` | Forces HTTPS after first visit | Initial HTTP request vulnerable to downgrade; session cookie theft on public Wi-Fi |
| `Referrer-Policy` | Controls referrer leakage | URLs with IDs leaked to external sites via referrer |
| `Permissions-Policy` | Restricts browser APIs | Unnecessary access to camera, microphone, geolocation |

**Fix:**
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;" },
      ],
    }];
  },
};
export default nextConfig;
```

---

### FINDING 3 — No Rate Limiting on Registration (HIGH)

**File:** `src/app/api/auth/register/route.ts`
**OWASP:** A04 — Insecure Design

**Description:**
The login endpoint correctly applies rate limiting (`rateLimit("login", ip, 5, 15 * 60 * 1000)`), but the registration endpoint has no rate limiting at all. An attacker can create unlimited accounts via automated requests.

**Real-world risk:**
- **Database pollution:** Automated bot creates thousands of accounts, inflating storage costs on Neon PostgreSQL.
- **Email enumeration:** The duplicate email error (`"An account with this email already exists"`, line 39) reveals whether an email is registered. Combined with no rate limiting, an attacker can enumerate email addresses at scale.
- **Abuse staging:** Mass-created accounts used for spam, resource abuse, or testing stolen credentials.

**Fix:**
Apply the same `rateLimit()` function used in the login route:
```typescript
const limited = rateLimit("register", ip, 3, 60 * 60 * 1000); // 3 per hour per IP
if (limited.limited) {
  return NextResponse.json(
    { error: "Too many registration attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
  );
}
```

---

### FINDING 4 — In-Memory Rate Limiter (HIGH)

**File:** `src/lib/rate-limit.ts`
**OWASP:** A07 — Identification & Authentication Failures

**Description:**
The rate limiter stores request timestamps in a JavaScript `Map` object. This data:
- Is lost on every server restart or redeployment
- Does not share state across multiple server instances (horizontal scaling)
- Resets on every Vercel/serverless cold start
- Is per-process only in a Node.js cluster

**Real-world risk:**
An attacker can bypass login rate limiting by waiting for a cold start or distributing requests across serverless function instances. On Vercel (the likely deployment target), each request may hit a different function instance with its own empty `Map`. The rate limit is effectively cosmetic.

**Fix:**
The codebase already has Upstash Redis environment variables defined in `.env.example` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) but they are unused. Replace the in-memory `Map` with Upstash Redis using the `@upstash/ratelimit` package for persistent, distributed rate limiting.

---

### FINDING 5 — Middleware Does Not Validate Sessions (MEDIUM)

**File:** `src/middleware.ts`, line 22
**OWASP:** A01 — Broken Access Control

**Description:**
The middleware only checks whether the `session_token` cookie exists:
```typescript
const sessionToken = req.cookies.get("session_token")?.value;
// ...
if (isProtected && !sessionToken) {
  // redirect to login
}
```
It does not query the database to verify the session is valid, unexpired, or unrevoked. A user with a stale, expired, or deleted session cookie still reaches protected page shells.

**Real-world risk:**
- After logout, a user who preserved their cookie (e.g., browser extension, manual cookie editing) sees the authenticated UI shell before API calls return 401.
- After password change (which invalidates other sessions), other devices with stale cookies briefly render protected pages.
- The `requireAuth()` function on every API route provides the actual security boundary, so this is a **UX issue more than a security issue**.

**Mitigating factor:** Every API route calls `requireAuth()` which validates the session against the database. The page shell without data is not a security breach but creates a confusing user experience.

**Fix:**
Add server-side session validation in `src/app/(authenticated)/layout.tsx`:
```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthenticatedLayout({ children }) {
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) redirect("/login");
  // Optionally validate against DB here for stronger guarantee
  return <>{children}</>;
}
```

---

### FINDING 6 — No Email Verification (MEDIUM)

**File:** `src/app/api/auth/register/route.ts`, line 52
**OWASP:** A07 — Identification & Authentication Failures

**Description:**
Users are auto-logged-in immediately after registration. The `emailVerified` field is set to `false` (line 52) but is never checked anywhere in the codebase. The schema has an `EmailVerificationToken` model, but no verification routes, email sending, or verification UI exists (confirmed as a known deferral in QA-CHECKLIST.md).

**Real-world risk:**
- Attacker registers with victim's email, preventing victim from using it later.
- No proof of email ownership — password reset (when implemented) targets unverified addresses.
- Spam/abuse accounts have zero accountability.

**Fix:**
Implement the email verification flow. At minimum, gate sensitive operations (data export, email change) behind `emailVerified: true`. This is already tracked as a deferred item.

---

### FINDING 7 — Untrusted IP from x-forwarded-for (MEDIUM)

**Files:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`
**OWASP:** A04 — Insecure Design

**Description:**
Both auth routes extract client IP via:
```typescript
req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
```
The `X-Forwarded-For` header is client-controllable unless the reverse proxy strips/overwrites it. An attacker can send requests with random `X-Forwarded-For` values to get a fresh rate-limit window on each request.

**Real-world risk:**
Rate limiting keyed by IP becomes bypassable. Each request with a new fake `X-Forwarded-For` value gets its own counter.

**Fix:**
On Vercel: Use the `x-real-ip` header which Vercel sets from the actual client connection and cannot be spoofed. On other platforms: Use the last (rightmost) entry in `X-Forwarded-For` added by the trusted proxy, not the first entry.

---

### FINDING 8 — No Authentication Audit Logging (MEDIUM)

**OWASP:** A09 — Security Logging & Monitoring Failures

**Description:**
No authentication events are logged to a persistent store. Only `console.error` is used for error conditions, which is ephemeral in serverless environments. The following events are not logged:
- Failed login attempts (IP, email attempted)
- Successful logins (IP, user agent)
- Password changes
- Account deletions
- Session invalidations

**Real-world risk:**
- Cannot detect brute-force attacks after the fact
- Cannot investigate account compromise ("when did someone log in?")
- Cannot provide users with "recent login activity"
- No forensic capability for security incidents

**Fix:**
Create an `AuditLog` table or integrate with an external logging service. Log: event type, userId (if known), IP, user agent, timestamp, success/failure.

---

### FINDING 9 — GDPR Export Has No Re-Authentication (MEDIUM)

**File:** `src/app/api/settings/export/route.ts`
**OWASP:** A01 — Broken Access Control

**Description:**
The data export endpoint returns all user data (clients, projects, tasks, time entries, invoices, comments) as a JSON archive. It only requires a valid session — no password re-entry or additional verification.

**Real-world risk:**
If a session is stolen (e.g., via physical device access, Sentry cookie leakage, or XSS in a hypothetical future vulnerability), the attacker gets a complete dump of all user data including client emails, financial records, and business details — in a single request.

**Fix:**
Require password re-entry before initiating export. Apply a dedicated rate limit (1 export per hour). Consider generating the export asynchronously with a download link sent via email.

---

### FINDING 10 — No Explicit CSRF Token (LOW)

**OWASP:** A01 — Broken Access Control

**Description:**
The application relies solely on `SameSite=Strict` cookies for CSRF protection. No explicit CSRF tokens are generated or validated on any form.

**Real-world risk:**
`SameSite=Strict` is effective in all modern browsers. Risk is limited to:
- Very old browsers (IE11, early Safari) that don't support `SameSite`
- Hypothetical subdomain compromise (`*.taskflow.com`)

**Fix:**
Low priority. For defense-in-depth, add `Origin` header verification in API routes to complement `SameSite=Strict`.

---

### FINDING 11 — Registration Name Field Unbounded (LOW)

**File:** `src/app/api/auth/register/route.ts`, line 9
**OWASP:** A03 — Injection

**Description:**
The registration Zod schema enforces `min(1)` but no `max()` on the name field:
```typescript
name: z.string().trim().min(1, "Full name is required."),
```
All other validation schemas in the codebase properly enforce maximum lengths (e.g., client name has `max(200)`).

**Real-world risk:**
An attacker could submit a multi-megabyte name. PostgreSQL `text` columns accept up to 1GB. This inflates storage, slows queries returning the name, and could cause UI rendering issues.

**Fix:**
Add `.max(200)` to match the convention used in other schemas.

---

### FINDING 12 — Error Detail Leak in Console Log (LOW)

**File:** `src/app/api/auth/register/route.ts`, line 85
**OWASP:** A09 — Logging Failures

**Description:**
```typescript
console.error("Registration error:", message, err);
```
The full error object including stack trace and Prisma error details is logged. While this doesn't reach the client response (which is generic), in serverless environments these logs are visible in the deployment dashboard and could expose database table names, constraint names, or connection details.

**Real-world risk:**
Low — only visible to those with deployment log access. But could leak internal database schema details in Prisma error messages.

**Fix:**
Log only the error message, not the full error object. Use structured logging.

---

## Route-by-Route Data Isolation Audit

Every API route was individually reviewed for multi-tenant data isolation.

### Secure Routes (30 of 31)

| Route | Methods | Isolation Technique | Status |
|-------|---------|-------------------|--------|
| `/api/clients` | GET, POST | `userId` in WHERE and CREATE | SECURE |
| `/api/clients/[id]` | GET, PATCH, DELETE | `findFirst`/`updateMany`/`deleteMany` with `userId` | SECURE |
| `/api/clients/[id]/archive` | PATCH | `updateMany` with `userId` | SECURE |
| `/api/clients/[id]/summary` | GET | Ownership check + `userId` on all aggregations | SECURE |
| `/api/projects` | GET, POST | `userId` filter; client ownership verified before create | SECURE |
| `/api/projects/[id]` | GET, PATCH, DELETE | All ops include `userId`; optimistic locking | SECURE |
| `/api/projects/[id]/tasks` | GET, POST | Project ownership verified first | SECURE |
| `/api/tasks` | GET | `userId` filter; archived clients excluded | SECURE |
| `/api/tasks/[id]` | GET, PATCH, DELETE | `userId` on all ops; optimistic locking; atomic deletes | SECURE |
| `/api/tasks/[id]/comments` | GET, POST | Task ownership verified; `userId` on create | SECURE |
| `/api/tasks/[id]/position` | PATCH | `userId` + optimistic locking for drag-and-drop | SECURE |
| `/api/tasks/[id]/subtasks` | POST | Task ownership verified before subtask creation | SECURE |
| `/api/tasks/[id]/time-entries` | GET, POST | `userId` filter; server overrides `projectId`/`taskId` | SECURE |
| `/api/time-entries` | GET, POST | `userId` on all queries; project/task ownership verified | SECURE |
| `/api/time-entries/[id]` | GET, PUT, DELETE | `userId` filter; invoiced status check prevents modification | SECURE |
| `/api/invoices` | GET, POST | `userId` filter; project/client ownership verified | SECURE |
| `/api/invoices/[id]` | GET, PATCH, DELETE | `userId` on all ops; draft-only deletion; optimistic locking | SECURE |
| `/api/notifications` | GET | `userId` filter | SECURE |
| `/api/notifications/[id]/read` | PATCH | Explicit `notification.userId !== auth.userId` → 403 | SECURE |
| `/api/notifications/mark-all-read` | POST | `updateMany` scoped to `userId` | SECURE |
| `/api/dashboard/stats` | GET | All aggregations scoped to `userId` | SECURE |
| `/api/analytics` | GET | All 8 parallel queries scoped to `userId` | SECURE |
| `/api/settings/account` | GET, PATCH | `findUnique`/`update` by `auth.userId`; email dedup check | SECURE |
| `/api/settings/avatar` | POST, DELETE | Update by `auth.userId`; file type/size validated | SECURE |
| `/api/settings/change-password` | POST | Current password verified via bcrypt; other sessions invalidated | SECURE |
| `/api/settings/delete-account` | POST | Password verified; soft delete; all sessions cleared | SECURE |
| `/api/settings/export` | GET | All GDPR export queries filtered by `userId` | SECURE |
| `/api/settings/notifications` | GET, PATCH | Scoped to `userId` | SECURE |
| `/api/subtasks/[id]` | PATCH, DELETE | Ownership via `task: { userId }` relation join | SECURE |
| `/api/health` | GET | Public (intentionally unauthenticated) | N/A |

### Vulnerable Route (1 of 31)

| Route | Methods | Issue |
|-------|---------|-------|
| **`/api/invoices/[id]/payment`** | POST | `update()` on line 61 missing `userId` filter (Finding #1) |

---

## Authentication & Session Audit

| Check | Result | Details |
|-------|--------|---------|
| Unauthenticated page access blocked | **PASS** | Middleware redirects all protected paths to `/login` |
| Unauthenticated API access blocked | **PASS** | `requireAuth()` on every authenticated API route returns 401 |
| Only public routes accessible without login | **PASS** | Landing (`/`), `/login`, `/signup`, `/api/health` only |
| Session cookie `httpOnly` | **PASS** | Set in login, register, logout, and requireAuth cookie clear |
| Session cookie `secure` | **PASS** | `true` when `NODE_ENV === "production"` |
| Session cookie `sameSite` | **PASS** | `"strict"` on all cookie operations |
| Session cookie `path` | **PASS** | `"/"` |
| Session absolute expiry | **PASS** | 30 days, checked on every `getSession()` call in `auth.ts:32` |
| Session idle timeout | **PASS** | 7 days of inactivity triggers deletion in `auth.ts:36-42` |
| `lastActiveAt` updated on use | **PASS** | Touched on every valid session access in `auth.ts:46-50` |
| Session destroyed on logout | **PASS** | `deleteMany` removes session from DB; cookie cleared with `maxAge: 0` |
| Sessions invalidated on password change | **PASS** | All sessions except current deleted in `change-password/route.ts` |
| Token stored as hash (not plaintext) | **PASS** | SHA-256 hash in DB via `auth.ts:10-12`; raw token only in cookie |
| Token entropy sufficient | **PASS** | `nanoid(32)` = 192 bits of entropy |
| Login rate limiting | **PASS** | 5 attempts / 15 min per IP via `rate-limit.ts` |
| Registration rate limiting | **FAIL** | No rate limiting (Finding #3) |
| Password hashing | **PASS** | bcrypt with 12 salt rounds |
| Password complexity enforced | **PASS** | 8+ chars, uppercase, lowercase, digit via Zod regex |
| Generic error on login failure | **PASS** | Same "Invalid email or password" for wrong email and wrong password |

---

## Input/Output Audit

| Check | Result | Details |
|-------|--------|---------|
| All mutation inputs validated server-side | **PASS** | Zod schemas on every POST, PATCH, PUT, DELETE endpoint |
| SQL injection prevented | **PASS** | Prisma parameterized queries used exclusively; no raw SQL |
| XSS via stored data | **PASS** | React escapes output by default; no `dangerouslySetInnerHTML` found |
| CSP header for XSS defense-in-depth | **FAIL** | No CSP configured (Finding #2) |
| Error messages generic (500 responses) | **PASS** | All catch blocks return "Something went wrong..." messages |
| Stack traces in responses | **PASS** | Never exposed to client |
| Password hash in API responses | **PASS** | Never included in Prisma `select` clauses |
| Internal IDs format | **PASS** | UUIDs used (non-sequential, non-guessable via `cuid2`) |
| Input length limits on all fields | **PARTIAL** | All schemas except register name have `max()` bounds (Finding #11) |
| Validation error format | **PASS** | Returns field-level errors via `errors.flatten().fieldErrors` (422) |

---

## Infrastructure Audit

| Check | Result | Details |
|-------|--------|---------|
| Security headers configured | **FAIL** | None configured anywhere (Finding #2) |
| Secrets in committed code | **PASS** | No `.env` committed; only `.env.example` with placeholder values |
| Hardcoded API keys/passwords | **PASS** | All secrets loaded from environment variables |
| Rate limiting active and effective | **PARTIAL** | Login only; in-memory only (Findings #3, #4) |
| HTTPS enforcement | **FAIL** | No HSTS header; `secure` cookie only in production mode |
| CSP configured | **FAIL** | No Content-Security-Policy header |
| Prisma query safety | **PASS** | No raw SQL; all queries parameterized through Prisma client |
| Database connection pooling | **PASS** | Neon connection pooler via `DATABASE_URL`; direct for migrations |

---

## Account Management Audit

| Check | Result | Details |
|-------|--------|---------|
| Password change requires current password | **PASS** | `bcrypt.compare()` in `change-password/route.ts` |
| Password change invalidates other sessions | **PASS** | `deleteMany` with `id: { not: auth.sessionId }` |
| New password meets complexity requirements | **PASS** | Same Zod schema as registration |
| Password confirmation match validated | **PASS** | Zod `.refine()` checks `newPassword === confirmPassword` |
| Account deletion requires password | **PASS** | `bcrypt.compare()` in `delete-account/route.ts` |
| Account deletion is soft delete | **PASS** | Sets `scheduledDeletionAt` for 30-day grace period |
| Account deletion cascades via Prisma | **PASS** | `onDelete: Cascade` on all user-owned relations |
| Account deletion clears all sessions | **PASS** | `deleteMany` on sessions; cookie cleared with `maxAge: 0` |
| Deletion response includes data counts | **PASS** | Returns counts of clients, projects, tasks, time entries, invoices |

---

## Positive Security Practices Found

The codebase demonstrates several strong security patterns that should be maintained:

1. **Consistent userId filtering** — 30 of 31 routes correctly include `userId: auth.userId` in every database query
2. **Atomic operations** — Uses `updateMany`/`deleteMany` with ownership constraints instead of `findFirst` → `update` (TOCTOU-safe)
3. **Optimistic locking** — Multiple endpoints check `updatedAt` timestamp to prevent concurrent modification
4. **Generic error messages** — All 500 responses use the same generic message
5. **Bcrypt with cost 12** — Strong password hashing
6. **Session token hashing** — Only SHA-256 hash stored in database; raw token only in httpOnly cookie
7. **Session cleanup on auth events** — Password change and account deletion invalidate all other sessions
8. **Server-side field override** — Time entry creation overrides client-provided `projectId`/`taskId` with server-verified values
9. **Invoiced entry protection** — Cannot modify or delete time entries that have been invoiced
10. **Draft-only invoice deletion** — Cannot delete sent/paid invoices

---

## Recommendations by Priority

### Immediate — Fix Before Production

| # | Action | Finding |
|---|--------|---------|
| 1 | Add `userId: auth.userId` to invoice payment update WHERE clause | Finding #1 |
| 2 | Configure security headers in `next.config.mjs` (CSP, HSTS, X-Frame-Options, etc.) | Finding #2 |
| 3 | Add rate limiting to registration endpoint (3/hour per IP) | Finding #3 |
| 4 | Replace in-memory rate limiter with Upstash Redis (env vars already configured) | Finding #4 |

### Short-Term — Before Public Launch

| # | Action | Finding |
|---|--------|---------|
| 5 | Add session validation in `(authenticated)/layout.tsx` server component | Finding #5 |
| 6 | Implement email verification flow (gate sensitive ops behind `emailVerified`) | Finding #6 |
| 7 | Use `req.ip` or `x-real-ip` instead of `x-forwarded-for` for rate limiting | Finding #7 |
| 8 | Add audit logging for login, password change, and deletion events | Finding #8 |
| 9 | Require password re-entry for GDPR data export | Finding #9 |

### Long-Term — Hardening

| # | Action | Finding |
|---|--------|---------|
| 10 | Add `Origin` header verification for defense-in-depth CSRF protection | Finding #10 |
| 11 | Add `.max(200)` to registration name field | Finding #11 |
| 12 | Sanitize `console.error` to log messages only, not full error objects | Finding #12 |
| 13 | Implement 2FA/MFA (TOTP or WebAuthn) | Best practice |
| 14 | Add automated security integration tests (cross-user data access attempts) | Best practice |

---

## Conclusion

**Overall assessment: GOOD with targeted fixes needed.**

The application demonstrates strong security fundamentals — consistent multi-tenant data isolation, proper session management, comprehensive input validation, and safe error handling. Out of 31 API routes audited, 30 have correct data isolation. The one IDOR finding (invoice payment) is mitigated by a prior ownership check but should be fixed for defense-in-depth.

The most impactful improvements are: (1) fixing the invoice payment IDOR, (2) adding security headers, and (3) making the rate limiter production-ready with Redis. These three changes would significantly improve the application's security posture with minimal code changes.

---

*Audit performed by static code analysis of all 31 API routes, middleware, auth library, 4 validation schemas, Prisma schema, Next.js configuration, and environment files. Total codebase surface: ~3,000 lines of API route code, ~100 lines of auth library, ~200 lines of validation schemas.*
