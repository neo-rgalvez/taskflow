# TaskFlow — Security Audit

> Code-level audit performed 2026-03-02.
> Every API route handler, middleware function, database query, session flow, validation schema, and configuration file was read in full and checked.
>
> **Methodology:** OWASP Top 10 (2021), multi-tenant data-isolation testing, professional penetration-test playbook for SaaS apps with user auth + database storage.

---

## Audit Checklist (used as the framework)

### OWASP Top 10 (2021)

| #   | Risk                              | Applies? |
| --- | --------------------------------- | -------- |
| A01 | Broken Access Control             | Yes — multi-tenant, every query must scope by userId |
| A02 | Cryptographic Failures            | Yes — password hashing, session tokens, cookie flags |
| A03 | Injection                         | Yes — SQL (Prisma ORM), XSS (React) |
| A04 | Insecure Design                   | Yes — dev-mode bypass, missing re-auth for sensitive ops |
| A05 | Security Misconfiguration         | Yes — headers, default creds in seed, CSP directives |
| A06 | Vulnerable & Outdated Components  | Yes — dependency audit |
| A07 | Identification & Auth Failures    | Yes — brute force, credential stuffing, session mgmt |
| A08 | Software & Data Integrity         | Partial — unsigned cookies (no HMAC), no CI signing |
| A09 | Security Logging & Monitoring     | Yes — no audit trail, console.error leaks |
| A10 | SSRF                              | No — app never fetches user-supplied URLs |

### Multi-Tenant / Pentest Checklist

1. Can User A read/update/delete User B's data on **every** endpoint?
2. Can unauthenticated requests reach any protected resource?
3. Session: httpOnly? secure? properly destroyed on logout?
4. Input validated server-side on every write path?
5. Error messages generic — no stack traces or internal details?
6. Password hashes or internal IDs exposed in any response?
7. Security headers complete?
8. Secrets in committed code?
9. Rate limiting active and effective?
10. Password change requires current password?
11. Account deletion cascades completely?

---

## Summary

| Severity     | Count | Key theme |
| ------------ | ----- | --------- |
| **Critical** | 4     | Dev auth bypass, info-leaking error messages, zero rate limiting, broken CSRF defense-in-depth |
| **High**     | 5     | TOCTOU delete, email change without password, login timing oracle, unguarded scheduled-deletion login, missing userId on aggregation queries |
| **Medium**   | 7     | Cookie Secure flag, CSP unsafe-eval/inline, no session cap, registration enumeration, seed in prod, no Origin check, empty next.config |
| **Low**      | 4     | DB-URL fallback, console.error logging, Referrer-Policy on API, health endpoint unthrottled |
| **Total**    | **20** | |

---

## Critical

### C-1. Development-mode authentication bypass ships in production code

**Files:** `src/lib/auth.ts:57-63`, `src/middleware.ts:39-46`

The middleware lets **every protected page** through without a session when `NODE_ENV === "development"`:

```typescript
// middleware.ts:40-46
if (process.env.NODE_ENV === "development") {
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next(); // ← all protected routes pass
}
```

`getSession()` then returns the **first user in the database** as a fallback:

```typescript
// auth.ts:57-63
if (process.env.NODE_ENV === "development") {
  const devUser = await db.user.findFirst();
  if (devUser) {
    return { userId: devUser.id, sessionId: "dev-session" };
  }
}
```

**Risk:** If `NODE_ENV` is misconfigured on the host (not set, or explicitly set to `"development"` on a staging/preview deploy), every page and API route is accessible without authentication and operates as an arbitrary user. This is a full auth bypass.

**Attack:** Visit any protected page or call any API endpoint on a host where `NODE_ENV !== "production"`.

**Fix:** Delete both development fallbacks. Use the seed user's real credentials (`sarah@fletcherdesign.co / password123`) for dev testing. If a shortcut is needed, gate it on a separate `DEV_BYPASS_AUTH=true` env var that CI/CD never sets.

---

### C-2. Login 500-error handler returns raw `err.message` to the client

**File:** `src/app/api/auth/login/route.ts:78-84`

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Login error:", message, err);
  return NextResponse.json(
    { error: `Login failed: ${message}` }, // ← exposes internal detail
    { status: 500 }
  );
}
```

**Risk:** A Prisma connection error, bcrypt failure, or out-of-memory error leaks database hostnames, query text, or stack-trace fragments to the attacker. Violates OWASP A05.

**Note:** The registration handler (`register/route.ts:86-89`) does this correctly — it returns a generic message. The login handler is the exception.

**Fix:**
```typescript
return NextResponse.json(
  { error: "Login failed. Please try again." },
  { status: 500 }
);
```

---

### C-3. Zero rate limiting on any endpoint

**Files:** Every route under `src/app/api/`

The `.env.example` lists `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, but no Upstash packages are installed and no rate-limiting code exists anywhere in the codebase.

```
$ grep -r "ratelimit\|upstash\|rate.limit\|throttle" src/
(no results)
```

**Risk:**
- **Credential stuffing:** Unlimited `POST /api/auth/login` attempts.
- **Account enumeration:** `POST /api/auth/register` reveals whether an email is registered (see H-4), and can be called at line speed.
- **Resource exhaustion:** Analytics and dashboard queries are expensive (`findMany` across multiple tables).

**Fix:** Add `@upstash/ratelimit` + `@upstash/redis`. Minimum limits:

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/auth/login` | 5 per 15 min | IP |
| `POST /api/auth/register` | 3 per hour | IP |
| `POST /api/settings/delete-account` | 3 per hour | userId |
| `POST /api/settings/change-password` | 5 per hour | userId |
| All authenticated endpoints | 100 per min | userId |
| `GET /api/health` | 10 per min | IP |

---

### C-4. No CSRF protection beyond SameSite cookie

**Files:** All state-changing routes (POST, PATCH, DELETE)

The session cookie uses `sameSite: "strict"`, which blocks cross-site request forgery in modern browsers. However:

1. No `Origin` header validation exists as defense-in-depth.
2. No CSRF token mechanism exists.
3. `SameSite` is not enforced by older browsers or certain plugins.

The QA checklist (§12.4) requires: "POST/PUT/DELETE without valid CSRF token → 403." This is unimplemented.

**Fix:** Add Origin-header verification in middleware or a shared helper for all state-changing requests:

```typescript
const origin = req.headers.get("origin");
if (origin && origin !== process.env.NEXT_PUBLIC_APP_URL) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## High

### H-1. TOCTOU race in project and task DELETE

**Files:** `src/app/api/projects/[id]/route.ts:183-194`, `src/app/api/tasks/[id]/route.ts:151-163`

Both handlers use a two-step check-then-act pattern:

```typescript
// Step 1: verify ownership
const project = await db.project.findFirst({
  where: { id: params.id, userId: auth.userId },
});
if (!project) return 404;

// Step 2: delete WITHOUT userId — uses only id
await db.project.delete({ where: { id: params.id } });
```

Compare with the client DELETE handler, which is correct:

```typescript
// clients/[id]/route.ts:153-155 — atomic check+delete
const result = await db.client.deleteMany({
  where: { id: params.id, userId: auth.userId },
});
```

**Risk:** Classical Time-of-Check-Time-of-Use. The race window is tiny and CUIDs are random, making exploitation unlikely in practice, but it violates the principle of incorporating the ownership check in the write itself.

**Fix:** Use `deleteMany` with both `id` and `userId`:
```typescript
const result = await db.project.deleteMany({
  where: { id: params.id, userId: auth.userId },
});
if (result.count === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
```

---

### H-2. Email change does not require current password

**File:** `src/app/api/settings/account/route.ts:58-135`

`PATCH /api/settings/account` allows changing name, email, and timezone with only a valid session — no password re-entry.

**Attack chain:** Stolen session → change email → use forgot-password on new email → set new password → permanent account takeover.

**Fix:** When `email` is present in the request body, require a `currentPassword` field and verify it with `bcrypt.compare()`.

---

### H-3. Login timing side-channel reveals registered emails

**File:** `src/app/api/auth/login/route.ts:28-48`

When the email is not found, the handler returns immediately (~5 ms). When it is found, `bcrypt.compare()` runs (~200-300 ms). The difference is measurable over the network.

**Fix:** Always run a bcrypt comparison:
```typescript
const DUMMY_HASH = await bcrypt.hash("x", 12); // precompute at module load

if (!user) {
  await bcrypt.compare(password, DUMMY_HASH);
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}
```

---

### H-4. Scheduled-deletion users can still log in

**File:** `src/app/api/auth/login/route.ts` (no check), `src/lib/auth.ts` (no check)

After `POST /api/settings/delete-account`, the user's `scheduledDeletionAt` is set and all sessions are destroyed. But nothing prevents the user from immediately logging in again and creating a new session, because neither `login/route.ts` nor `getSession()` checks `scheduledDeletionAt`.

Additionally, the background job to hard-delete after 30 days does not exist in the codebase.

**Fix:**
1. In `login/route.ts`, after finding the user, check `user.scheduledDeletionAt`. If set, return 403 "This account is scheduled for deletion."
2. In `getSession()`, after finding the session, fetch the user's `scheduledDeletionAt` and reject if set.
3. Implement the cleanup job or switch to immediate hard-delete with Prisma cascade.

---

### H-5. Missing userId filter on time-entry aggregation queries

**Files:**
- `src/app/api/tasks/[id]/route.ts:126-129` (PATCH response)
- `src/app/api/tasks/[id]/position/route.ts:69-72`
- `src/app/api/projects/route.ts:67-73`
- `src/app/api/tasks/route.ts:92-96`

These aggregations filter by `taskId` or `projectId` but omit `userId`:

```typescript
// tasks/[id]/route.ts:126-129
const timeAgg = await db.timeEntry.aggregate({
  where: { taskId: params.id },   // ← no userId
  _sum: { durationMinutes: true },
});
```

In the current data model, time entries are indirectly owned through the parent task/project, so this does not cause a real data leak today. However it breaks defense-in-depth: if shared projects are ever introduced, these queries would aggregate across users.

**Contrast:** `GET /api/tasks/[id]/time-entries` correctly includes `userId: auth.userId`.

**Fix:** Add `userId: auth.userId` to every time-entry aggregation `where` clause.

---

## Medium

### M-1. Session cookie `secure` flag is conditional on NODE_ENV

**Files:** `login/route.ts:71`, `register/route.ts:76`, `logout/route.ts:19,30`

```typescript
secure: process.env.NODE_ENV === "production",
```

On staging, preview deploys, or any HTTPS environment where `NODE_ENV` is not literally `"production"`, the cookie is sent over HTTP, exposing it to network interception.

**Fix:** `secure: process.env.NODE_ENV !== "development"` (or unconditionally `true` for any deployed env).

---

### M-2. CSP allows `unsafe-eval` and `unsafe-inline`

**File:** `netlify.toml:21`

```
script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

These directives effectively disable CSP's XSS protection. Injected `<script>` tags and `eval()` calls would execute.

**Fix:** Use nonce-based CSP. Next.js supports `nonce` in `next.config.mjs`. At minimum, remove `unsafe-eval`.

---

### M-3. No limit on sessions per user

**Files:** `login/route.ts:56-65`, `register/route.ts:61-70`

Every login creates a new session with no cap. An attacker with valid credentials could create thousands of sessions, bloating the sessions table and making "revoke all sessions" on password change slow.

**Fix:** Cap at 10 sessions per user. On new login, delete the oldest session when the cap is reached.

---

### M-4. Registration endpoint reveals email existence without throttle

**File:** `src/app/api/auth/register/route.ts:37-41`

Returns HTTP 409 with `"An account with this email already exists."` This is standard UX, but combined with C-3 (no rate limiting), enables automated email harvesting at line speed.

**Fix:** Acceptable if rate limiting (C-3) is implemented. Without it, this is exploitable for enumeration.

---

### M-5. Seed script has no production guard

**File:** `prisma/seed.ts:8`

Creates a user with password `password123`. If the seed is accidentally run against a production database, a known credential exists.

**Fix:** Add at the top:
```typescript
if (process.env.NODE_ENV === "production") {
  throw new Error("Seed script must not run in production");
}
```

---

### M-6. No Origin-header validation on any route

Duplicate of C-4 defense-in-depth layer. Listed here because even without the cookie bypass, Origin checking is a standard OWASP recommendation.

---

### M-7. `next.config.mjs` is empty — no security headers for non-Netlify deployments

**File:** `next.config.mjs`

```javascript
const nextConfig = {};
```

Security headers are in `netlify.toml` but only apply on Netlify. API route responses from Netlify Functions may not inherit `[[headers]]` blocks either. Local dev has no security headers at all.

**Fix:** Set headers via `next.config.mjs` `headers()` and disable `X-Powered-By`:
```javascript
const nextConfig = {
  poweredBy: false,
  headers: async () => [{ source: "/:path*", headers: [...] }],
};
```

---

## Low

### L-1. Database URL fallback activates when NODE_ENV is unset

**File:** `src/lib/db.ts:4`

```typescript
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
```

If `NODE_ENV` is unset (not `"production"`, not `"development"` — just undefined), the fallback activates, connecting to `postgresql://taskflow:taskflow@localhost:5432/taskflow`.

**Fix:** Only activate on explicit `=== "development"`.

---

### L-2. `console.error` logs full error objects in multiple routes

**Files:** `login/route.ts:80`, `register/route.ts:85`, `analytics/route.ts:289`, `dashboard/stats` (uncaught), `settings/account/route.ts:32,129`, `settings/change-password/route.ts:94`, `settings/delete-account/route.ts:97`, `tasks/route.ts:144`, `time-entries/route.ts:95`

In serverless environments, these land in the provider's logging dashboard. If errors contain request bodies or database queries, sensitive data could be persisted in logs.

**Fix:** Log only `err.message`, never the full error or request body. Use a structured logger with sensitive-field redaction.

---

### L-3. No Referrer-Policy on API responses

API responses from Netlify Functions do not necessarily inherit the `[[headers]]` block in `netlify.toml`, which only targets page responses. Referrer headers on API redirects could leak URL paths.

**Fix:** Set via Next.js middleware.

---

### L-4. Health endpoint has no rate limit and executes a DB query

**File:** `src/app/api/health/route.ts`

`SELECT 1` on every request. Can be used as a low-cost amplification vector.

**Fix:** Rate limit (10/min per IP) or cache for a few seconds.

---

## Authentication Deep Dive

### Session Lifecycle

| Feature | Status |
| ------- | ------ |
| Token: `nanoid(32)` — 192 bits of entropy | **PASS** |
| Storage: SHA-256 hash of token in DB (raw never stored) | **PASS** |
| Cookie: `httpOnly: true` | **PASS** |
| Cookie: `sameSite: "strict"` | **PASS** |
| Cookie: `secure` in production | **PASS** (conditional — see M-1) |
| Cookie: `path: "/"` | **PASS** |
| Cookie: `maxAge: 30 days` (matches DB `expiresAt`) | **PASS** |
| Absolute expiry: 30 days (`expiresAt`) | **PASS** |
| Idle timeout: 7 days (`lastActiveAt`) | **PASS** |
| Touch `lastActiveAt` on each authenticated request | **PASS** |
| Logout: server session deleted (`deleteMany`) | **PASS** |
| Logout: cookie cleared (`maxAge: 0`) | **PASS** |
| Password change: all other sessions deleted | **PASS** |
| Account deletion: all sessions deleted + cookie cleared | **PASS** |
| Dev-mode bypass | **FAIL — C-1** |
| Scheduled-deletion users blocked from login | **FAIL — H-4** |

### Pages accessible without login

| Route | Auth required? | Actually enforced? | Verdict |
| ----- | -------------- | ------------------ | ------- |
| `GET /` (landing) | No | No | PASS |
| `GET /login` | No | No | PASS |
| `GET /signup` | No | No | PASS |
| `GET /api/health` | No | No | PASS |
| `POST /api/auth/login` | No | No | PASS |
| `POST /api/auth/register` | No | No | PASS |
| `POST /api/auth/logout` | No (graceful) | No | PASS |
| All `/dashboard`, `/clients/*`, `/projects/*`, etc. | Yes | Middleware redirects to login (prod). Dev bypass — **C-1**. | PASS in prod, FAIL in dev |
| All `/api/clients/*`, `/api/projects/*`, etc. | Yes | `requireAuth()` in each handler (middleware **skips** API routes). | PASS |

**Note on middleware architecture:** The middleware explicitly skips `/api/` paths (`pathname.startsWith("/api/")`). This means API-route protection relies entirely on `requireAuth()` being called at the top of every handler. All implemented handlers do call it. Future handlers must follow this pattern.

---

## Data Isolation (IDOR) — Exhaustive Route-by-Route Check

### Method

For every API route, I traced the Prisma query to check whether `userId: auth.userId` appears in the `where` clause (reads) or `data` payload (creates).

| Route | Method | userId in query? | IDOR safe? | Notes |
| ----- | ------ | ---------------- | ---------- | ----- |
| `/api/clients` | GET | `where: { userId: auth.userId }` | **PASS** | |
| `/api/clients` | POST | `data: { userId: auth.userId }` | **PASS** | |
| `/api/clients/[id]` | GET | `findFirst({ where: { id, userId } })` | **PASS** | |
| `/api/clients/[id]` | PATCH | `updateMany({ where: { id, userId, updatedAt } })` | **PASS** | Atomic |
| `/api/clients/[id]` | DELETE | `deleteMany({ where: { id, userId } })` | **PASS** | Atomic |
| `/api/clients/[id]/archive` | PATCH | `updateMany({ where: { id, userId } })` | **PASS** | Atomic |
| `/api/clients/[id]/summary` | GET | `findFirst({ where: { id, userId } })` + sub-queries scoped | **PASS** | |
| `/api/projects` | GET | `where: { userId }` | **PASS** | |
| `/api/projects` | POST | `data: { userId }` + client ownership verified | **PASS** | |
| `/api/projects/[id]` | GET | `findFirst({ where: { id, userId } })` | **PASS** | |
| `/api/projects/[id]` | PATCH | `updateMany({ where: { id, userId, updatedAt } })` | **PASS** | Client-change also verified |
| `/api/projects/[id]` | DELETE | `findFirst` then `delete({ where: { id } })` | **FAIL — H-1** | TOCTOU — `delete` has no userId |
| `/api/projects/[id]/tasks` | GET | Project ownership verified + tasks `where: { userId }` | **PASS** | |
| `/api/projects/[id]/tasks` | POST | Project ownership verified + `data: { userId }` | **PASS** | |
| `/api/tasks` | GET | `where: { userId }` | **PASS** | |
| `/api/tasks/[id]` | GET | `findFirst({ where: { id, userId } })` | **PASS** | |
| `/api/tasks/[id]` | PATCH | `updateMany({ where: { id, userId, updatedAt } })` | **PASS** | |
| `/api/tasks/[id]` | DELETE | `findFirst` then `delete({ where: { id } })` | **FAIL — H-1** | TOCTOU — `delete` has no userId |
| `/api/tasks/[id]/position` | PATCH | `updateMany({ where: { id, userId, updatedAt } })` | **PASS** | |
| `/api/tasks/[id]/comments` | GET | Task ownership verified first | **PASS** | |
| `/api/tasks/[id]/comments` | POST | Task ownership verified + `data: { userId }` | **PASS** | |
| `/api/tasks/[id]/subtasks` | POST | Task ownership verified | **PASS** | |
| `/api/tasks/[id]/time-entries` | GET | Task ownership + `where: { userId }` | **PASS** | |
| `/api/tasks/[id]/time-entries` | POST | Task ownership + `data: { userId }` | **PASS** | |
| `/api/subtasks/[id]` | PATCH | Join: subtask→task→userId | **PASS** | |
| `/api/subtasks/[id]` | DELETE | Join: subtask→task→userId | **PASS** | |
| `/api/time-entries` | GET | `where: { userId }` | **PASS** | |
| `/api/dashboard/stats` | GET | All queries `where: { userId }` | **PASS** | |
| `/api/analytics` | GET | All queries `where: { userId }` | **PASS** | |
| `/api/settings/account` | GET | `where: { id: auth.userId }` | **PASS** | |
| `/api/settings/account` | PATCH | `where: { id: auth.userId }` | **PASS** | |
| `/api/settings/change-password` | POST | `where: { id: auth.userId }` | **PASS** | |
| `/api/settings/delete-account` | POST | `where: { id: auth.userId }` | **PASS** | |

**URL manipulation test:** Guessing or changing `[id]` parameters in routes returns 404 (not 403), which prevents existence-enumeration of other users' resource IDs.

---

## Input Validation Audit

### Server-side validation coverage

Every write endpoint validates via Zod schemas before touching the database.

| Endpoint | Schema | Max-length enforced? | Notes |
| -------- | ------ | -------------------- | ----- |
| `POST /api/auth/register` | `registerSchema` | name: **no max**, email: Zod email, password: 8+ with complexity | Missing max on `name` |
| `POST /api/auth/login` | `loginSchema` | email: Zod email, password: min 1 | OK |
| `POST /api/clients` | `createClientSchema` | name: 200, contactName: 200, email: 254, phone: 50, address: 1000, notes: 50000 | OK |
| `PATCH /api/clients/[id]` | `updateClientSchema` | Same + updatedAt | OK |
| `PATCH /api/clients/[id]/archive` | `archiveClientSchema` | boolean | OK |
| `POST /api/projects` | `createProjectSchema` | name: 200, desc: 2000, rates: max 99999999.99, budgetHours: max 99999 | OK |
| `PATCH /api/projects/[id]` | `updateProjectSchema` | Same + updatedAt | OK |
| `POST /api/projects/[id]/tasks` | `createTaskSchema` | title: 500, desc: 10000 | OK |
| `PATCH /api/tasks/[id]` | `updateTaskSchema` | Same + updatedAt | OK |
| `PATCH /api/tasks/[id]/position` | `updateTaskPositionSchema` | status: enum, position: int ≥ 0, updatedAt | OK |
| `POST /api/tasks/[id]/comments` | `createCommentSchema` | content: 5000 | OK |
| `POST /api/tasks/[id]/subtasks` | `createSubtaskSchema` | title: 500 | OK |
| `PATCH /api/subtasks/[id]` | `updateSubtaskSchema` | title: 500 | OK |
| `POST /api/tasks/[id]/time-entries` | `createTimeEntrySchema` | duration: 1-1440, desc: 2000 | OK |
| `PATCH /api/settings/account` | inline Zod | name: 100, email: Zod email | OK |
| `POST /api/settings/change-password` | `changePasswordSchema` | complexity rules + confirm match | OK |
| `POST /api/settings/delete-account` | `deleteSchema` | password: min 1 | OK |

**Gap:** `registerSchema` has no `.max()` on `name`. An attacker could submit a multi-megabyte name. Low severity because Prisma/Postgres will accept it but it wastes memory.

### SQL Injection

All queries use Prisma's parameterized query builder. The only raw SQL is `SELECT 1` in the health check (no user input). **No injection risk.**

### XSS

- React auto-escapes all rendered content.
- `dangerouslySetInnerHTML` is never used in any component.
- CSP headers are configured (weakened by `unsafe-inline` — M-2).
- All user content (comments, descriptions, notes) is stored and rendered as plain text.
- **No XSS risk in current implementation.**

### Error messages — information leakage

| Endpoint | 500 error message | Safe? |
| -------- | ----------------- | ----- |
| `POST /api/auth/login` | `"Login failed: ${err.message}"` | **NO — C-2** |
| `POST /api/auth/register` | `"Registration failed. Please try again."` | Yes |
| Client CRUD | `"Something went wrong on our end…"` | Yes |
| Project/Task CRUD | Generic or Zod field errors | Yes |
| Settings routes | `"Failed to load/update account settings."` | Yes |
| Analytics | `"Failed to load analytics."` | Yes |
| Time entries | `"Something went wrong on our end."` | Yes |
| Tasks list | `"Something went wrong on our end."` | Yes |

### Password hash exposure

The `GET /api/settings/account` handler uses explicit `select` that returns only `id, name, email, timezone, emailVerified, createdAt`. `passwordHash` is never included. No other route returns user data to the client. **PASS.**

---

## Infrastructure Audit

### Security headers (netlify.toml)

| Header | Value | Status |
| ------ | ----- | ------ |
| `X-Frame-Options` | `DENY` | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `X-XSS-Protection` | `1; mode=block` | PASS (deprecated but harmless) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | PASS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | PASS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | PASS |
| `Content-Security-Policy` | `script-src 'self' 'unsafe-eval' 'unsafe-inline'` | **WARN — M-2** |

**Missing:** `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`.

### Secrets in committed code

| File | Content | Status |
| ---- | ------- | ------ |
| `.env.example` | Placeholder values only | PASS |
| `.gitignore` | `.env` and `.env*.local` excluded | PASS |
| `prisma/seed.ts` | Hardcoded password `password123` | WARN — M-5 |
| `src/lib/db.ts` | Fallback DB URL `postgresql://taskflow:taskflow@localhost:5432/taskflow` | WARN — L-1 |
| All source files | No API keys, tokens, or secrets | PASS |

### SESSION_SECRET declared in .env.example but never used in code

The `.env.example` defines `SESSION_SECRET` and the IMPLEMENTATION-PLAN.md describes using it for HMAC-signing session cookies. However, the actual implementation uses SHA-256 hashing of the token (not HMAC signing). The `SESSION_SECRET` env var is never read in any source file. This is technically acceptable — the session token is a random `nanoid(32)`, hashed with SHA-256, and looked up by hash. The cookie value itself is the raw token; there's no signing step. Security depends on the token's entropy (192 bits), which is sufficient.

### Password hashing

| Aspect | Implementation | Status |
| ------ | -------------- | ------ |
| Algorithm | bcrypt (bcryptjs) | PASS |
| Cost factor | 12 rounds | PASS |
| Storage | `passwordHash` column, never in API responses | PASS |

---

## Account Management Audit

### Password change (`POST /api/settings/change-password`)

| Check | Implemented? |
| ----- | ------------ |
| Requires current password | Yes — `bcrypt.compare(currentPassword, user.passwordHash)` |
| Validates new password complexity | Yes — 8+ chars, uppercase, lowercase, digit |
| Confirms new === confirm | Yes — Zod `.refine()` |
| Hashes with bcrypt cost 12 | Yes |
| Invalidates all other sessions | Yes — `deleteMany({ where: { userId, id: { not: sessionId } } })` |
| Keeps current session valid | Yes |

**Verdict: PASS**

### Account deletion (`POST /api/settings/delete-account`)

| Check | Implemented? |
| ----- | ------------ |
| Requires password | Yes |
| Sets `scheduledDeletionAt` | Yes |
| Destroys all sessions | Yes |
| Clears cookie | Yes |
| Blocks re-login | **No — H-4** |
| Background job hard-deletes after 30 days | **No — not implemented** |
| Cascade configured in Prisma schema | Yes — all FKs have `onDelete: Cascade` |

### Cascade completeness (Prisma schema)

When a `User` is deleted, Prisma cascades to:

| Entity | onDelete | Effect |
| ------ | -------- | ------ |
| Session | Cascade | All sessions deleted |
| PasswordResetToken | Cascade | All tokens deleted |
| EmailVerificationToken | Cascade | All tokens deleted |
| Client | Cascade | → also cascades to Project → Task, TimeEntry, Subtask, Comment |
| Project | Cascade | → also cascades to Task, TimeEntry |
| Task | Cascade | → Subtask (Cascade), Comment (Cascade), TimeEntry (SetNull — preserves) |
| TimeEntry | Cascade | Deleted |
| Comment | Cascade | Deleted |

**The cascade is complete.** The only orphan case is `TimeEntry.taskId → SetNull` when a Task is deleted (time entries are preserved with null taskId), which is intentional.

---

## Prioritized Fix List

### Before Production (Critical + High)

| # | Sev | Issue | Fix |
| - | --- | ----- | --- |
| C-1 | Critical | Dev auth bypass | Delete dev fallbacks in `auth.ts` and `middleware.ts` |
| C-2 | Critical | Login error leaks `err.message` | Return generic message |
| C-3 | Critical | No rate limiting | Add Upstash rate limiter |
| C-4 | Critical | No CSRF Origin check | Add Origin header validation |
| H-1 | High | TOCTOU in project/task delete | Use `deleteMany` with userId |
| H-2 | High | Email change without password | Require password when changing email |
| H-3 | High | Login timing oracle | Always run bcrypt.compare with dummy hash |
| H-4 | High | Deleted users can re-login | Block login when `scheduledDeletionAt` is set |
| H-5 | High | Missing userId on time aggregations | Add userId to every aggregation where clause |

### Before GA (Medium)

| # | Sev | Issue | Fix |
| - | --- | ----- | --- |
| M-1 | Medium | Cookie not Secure outside prod | `secure: NODE_ENV !== "development"` |
| M-2 | Medium | CSP unsafe-eval/unsafe-inline | Nonce-based CSP |
| M-3 | Medium | No session cap per user | Limit to 10 sessions |
| M-4 | Medium | Registration enumeration + no throttle | Fix via C-3 |
| M-5 | Medium | Seed script runs in prod | Guard with NODE_ENV check |
| M-6 | Medium | No Origin validation | Fix via C-4 |
| M-7 | Medium | next.config.mjs empty | Add security headers |

### Nice-to-Have (Low)

| # | Sev | Issue | Fix |
| - | --- | ----- | --- |
| L-1 | Low | DB URL fallback on NODE_ENV unset | Use `=== "development"` |
| L-2 | Low | console.error logs full errors | Structured logging |
| L-3 | Low | No Referrer-Policy on API | Set in middleware |
| L-4 | Low | Health endpoint unthrottled | Add per-IP rate limit |

---

---

## Red-Team Pass — Adversarial Findings

> A second pass through every file with an attacker mindset.
> These are issues the structured audit missed or under-weighted.

### RT-1 (High). Subtask PATCH and DELETE have the same TOCTOU as H-1

**Files:** `src/app/api/subtasks/[id]/route.ts:46-48`, `src/app/api/subtasks/[id]/route.ts:73`

H-1 flagged project and task DELETE. But subtask PATCH and DELETE have the exact same pattern and were marked "PASS" in the IDOR table:

```typescript
// Step 1: check ownership via join
const subtask = await db.subtask.findFirst({
  where: { id: params.id },
  include: { task: { select: { userId: true } } },
});
if (!subtask || subtask.task.userId !== auth.userId) return 404;

// Step 2: write WITHOUT any ownership in the where clause
await db.subtask.update({ where: { id: params.id }, data: updatePayload });
await db.subtask.delete({ where: { id: params.id } });
```

Between the check and the write, the subtask could theoretically be reassigned (e.g., if its parent task were moved to a different project via a concurrent request). The race window is tiny and requires an unlikely concurrent mutation, but the principle is violated.

**Fix:** Wrap the check+write in a `db.$transaction()`:
```typescript
await db.$transaction(async (tx) => {
  const subtask = await tx.subtask.findFirst({
    where: { id: params.id },
    include: { task: { select: { userId: true } } },
  });
  if (!subtask || subtask.task.userId !== auth.userId) throw new Error("not found");
  await tx.subtask.delete({ where: { id: params.id } });
});
```

---

### RT-2 (High). Registration race condition — duplicate email returns raw 500

**File:** `src/app/api/auth/register/route.ts:32-54`

The handler checks email uniqueness with `findFirst`, then creates the user. These are two separate queries — not atomic.

```
Request A: findFirst("alice@test.com") → null     ← no user exists
Request B: findFirst("alice@test.com") → null     ← still no user (A hasn't created yet)
Request A: db.user.create("alice@test.com") → OK
Request B: db.user.create("alice@test.com") → Prisma P2002 unique constraint error
```

The `P2002` error is not caught. It falls into the generic catch block and returns:

```json
{ "error": "Registration failed. Please try again." }
```

The user sees a confusing error instead of "email already exists." More importantly, the `console.error` on line 85 logs `err.message`, which for P2002 looks like:

```
Unique constraint failed on the fields: (`email`)
```

This isn't returned to the client (the response is generic), but it confirms that **no Prisma error code is handled anywhere in the codebase**. Every unique-constraint, foreign-key, or not-found error falls through to a generic 500.

**Fix:** Catch `P2002` errors in registration (and ideally in a shared error handler):
```typescript
import { Prisma } from "@prisma/client";

} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }
  // generic 500
}
```

---

### RT-3 (Medium). `X-Forwarded-For` is attacker-controlled — future rate-limit bypass

**Files:** `src/app/api/auth/login/route.ts:61`, `src/app/api/auth/register/route.ts:66`

```typescript
ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
```

Currently this is only stored as session metadata (no security decisions depend on it). But when rate limiting is implemented (C-3), the natural instinct is to key IP-based rate limits on this same header. **An attacker can rotate `X-Forwarded-For` on every request to get unlimited attempts.**

On Netlify, the real client IP is in `x-nf-client-connection-ip`. On Cloudflare, it's `cf-connecting-ip`. On Vercel, `x-real-ip`. Using the raw `X-Forwarded-For` without trusting only the last hop from a known proxy is trivially spoofable.

**Fix:** When implementing rate limiting, use the platform's trusted IP header — NOT `x-forwarded-for` directly. Document which header to use per deployment target.

---

### RT-4 (Medium). Relation includes on task detail fetch child records without userId

**File:** `src/app/api/tasks/[id]/route.ts:18-28`

The task is correctly fetched with `userId` in the `where` clause. But the `include` for child records has no userId filter:

```typescript
include: {
  subtasks: { orderBy: { position: "asc" } },       // no userId filter
  comments: {                                         // no userId filter
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  },
  timeEntries: { orderBy: { startTime: "desc" } },   // no userId filter
  project: { select: { id: true, name: true, hourlyRate: true, billingType: true } },
}
```

H-5 flagged missing `userId` on time-entry *aggregation* queries. This is different: the `include` clause fetches **all child records for the task regardless of who created them**. In the current single-user data model, all children belong to the same user. But this is a latent IDOR — if shared-project features are ever added, `GET /api/tasks/[id]` would return other users' comments, time entries, and subtasks.

The same pattern appears in `GET /api/tasks/[id]/comments` (line 26-32): `db.comment.findMany({ where: { taskId } })` — no `userId`.

**Fix:** Add `userId` filters to relation includes where the child entity has a `userId` column:
```typescript
timeEntries: { where: { userId: auth.userId }, orderBy: { startTime: "desc" } },
comments: { where: { userId: auth.userId }, ... },
```

Subtasks don't have a `userId` column, so they must be scoped through the parent task (which is already scoped).

---

### RT-5 (Medium). Password change allows no-op — session-invalidation as a weapon

**File:** `src/app/api/settings/change-password/route.ts:7-24`

The Zod schema validates `newPassword` for complexity and checks `newPassword === confirmPassword`, but never checks `newPassword !== currentPassword`. An attacker who knows the victim's password can:

1. Log in
2. "Change" the password to the same value
3. All OTHER sessions are invalidated (`deleteMany({ id: { not: sessionId } })`)
4. The victim is logged out everywhere while the attacker keeps their session

This is a nuisance/denial-of-service attack against specific users. The attacker doesn't gain new access (they already had the password), but they can repeatedly kick the legitimate user off all their devices.

**Fix:** Add a refine:
```typescript
.refine(data => data.newPassword !== data.currentPassword, {
  message: "New password must be different from current password.",
  path: ["newPassword"],
})
```

---

### RT-6 (Medium). Middleware auth bypass via dot in URL path

**File:** `src/middleware.ts:29`

```typescript
pathname.includes(".")
```

Any URL with a dot anywhere in the path skips the middleware entirely. The intent is to exclude static files (`.css`, `.js`, `.ico`). But this is an overly broad check. If a future route segment ever contains a dot — e.g., `/projects/v2.0/overview` — the middleware's auth redirect would be silently skipped.

Currently, no route segments contain dots, so this isn't exploitable today. But it's a fragile pattern that violates the principle of secure-by-default. The `config.matcher` regex at line 64 already excludes `_next/static`, `_next/image`, and `favicon.ico` — the `includes(".")` check is redundant defense that could become a hole.

**Fix:** Remove the `pathname.includes(".")` check. The matcher regex and the explicit `pathname.startsWith` checks are sufficient. If static-file exclusion is needed, check for a file extension at the end: `pathname.match(/\.\w+$/)`.

---

### RT-7 (Low). `GET /api/clients/[id]` returns full Prisma model — no field selection

**File:** `src/app/api/clients/[id]/route.ts:17-19`

```typescript
const client = await db.client.findFirst({
  where: { id: params.id, userId: auth.userId },
  // ← no select clause
});
return NextResponse.json(client);
```

This returns every column on the Client model to the API response, including `userId` (the internal foreign key). Compare with `GET /api/settings/account` which uses explicit `select` to exclude `passwordHash`.

Currently the Client model has no secret fields, so this is not exploitable. But if a field like `stripeCustomerId`, `apiKey`, or `internalNotes` is ever added to the model, it would automatically be exposed to the API consumer.

The same pattern appears in:
- `PATCH /api/clients/[id]` response (line 124-126)
- `PATCH /api/clients/[id]/archive` response (line 48-50)
- `GET /api/projects/[id]` response (line 16-23)
- `PATCH /api/projects/[id]` response (line 161-168)

**Fix:** Add explicit `select` clauses to all responses, or create a `sanitize()` helper per model that strips internal fields before serialization.

---

### Updated Summary

| Severity | Prior count | New findings | Total |
| -------- | ----------- | ------------ | ----- |
| Critical | 4 | 0 | 4 |
| High | 5 | +2 (RT-1, RT-2) | 7 |
| Medium | 7 | +4 (RT-3, RT-4, RT-5, RT-6) | 11 |
| Low | 4 | +1 (RT-7) | 5 |
| **Total** | **20** | **+7** | **27** |

---

### Updated Fix List — Red-Team Additions

| # | Sev | Issue | Fix |
| - | --- | ----- | --- |
| RT-1 | High | Subtask TOCTOU (same class as H-1) | Wrap check+write in `$transaction` |
| RT-2 | High | Registration race → generic 500 on P2002 | Catch Prisma P2002, return 409 |
| RT-3 | Medium | `X-Forwarded-For` spoofable for rate limits | Use platform trusted-IP header |
| RT-4 | Medium | Relation includes unscoped by userId | Add userId to `include` where clauses |
| RT-5 | Medium | Password change allows same password | Add `new !== current` refine |
| RT-6 | Medium | Middleware dot-bypass pattern fragile | Remove `pathname.includes(".")`, rely on matcher |
| RT-7 | Low | Client/project GETs return full model | Add explicit `select` to all responses |

---

*Red-team pass complete. 27 total findings. Re-audit after fixes.*
