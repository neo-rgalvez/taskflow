# TaskFlow — Cross-Reference Audit

> Systematic cross-reference of APPLICATION-PLAN.md, IMPLEMENTATION-PLAN.md, and QA-CHECKLIST.md.
> Every feature, test case, and QA checkpoint was checked for coverage gaps across all three documents.

---

## Summary

**48 unique issues found:** 3 Critical, 10 High, 18 Medium, 17 Low

Three directions were checked:
1. **APPLICATION-PLAN.md → IMPLEMENTATION-PLAN.md** — Does every specified feature have an implementation plan?
2. **QA-CHECKLIST.md → IMPLEMENTATION-PLAN.md** — Does the implementation plan build the feature each test case tests?
3. **IMPLEMENTATION-PLAN.md QA Checkpoints → QA-CHECKLIST.md** — Can each phase's QA checkpoint actually be run with what's been built?

---

## Critical Issues

| # | Location | Issue | Recommendation |
|---|----------|-------|----------------|
| 1 | APP §1.5, QA §5.2, IMPL C.5 | **Missing TaskNote/TaskComment entity.** Task detail page specifies "notes/comments" as a feature. QA tests adding notes, displaying timestamps, and empty states. But there is no data model, no API endpoint, and no implementation detail for task notes/comments anywhere. Search (QA §9.3) also references a "Notes" result type that cannot exist without this entity. | Add `TaskComment` model to B.1 (`id, task_id, user_id, content, created_at, updated_at`). Add API routes to B.4: `POST /api/tasks/[id]/comments`, `PATCH /api/comments/[id]`, `DELETE /api/comments/[id]`. Add to C.5 UI. Add GIN index for search in C.9. |
| 2 | IMPL Phase C checkpoint, QA §11.8 | **Phase C claims Invoice Overdue Automation (§11.8) is testable, but the scheduled job that detects overdue invoices is not built until Phase E.5.** This is a direct circular dependency — the checkpoint cannot be run. Same issue affects §11.9 (deadline reminders) which are scheduled-job-driven. | Move §11.8 and the scheduled-job portions of §11.9 from Phase C checkpoint to Phase E. Alternatively, build the trigger functions in Phase C and wire them to cron in Phase E. |
| 3 | APP §4.4, QA §12.5, IMPL E.1 | **No malware scanning service in technology stack.** APPLICATION-PLAN requires "scan for malicious content" on file uploads. QA tests polyglot file rejection. IMPL E.1 lists "malicious content scan" as a checklist item to verify, but no tool (ClamAV, VirusTotal, etc.) is chosen, no integration is planned, and no environment variable is defined. | Either add a scanning service to Technology Decisions and Phase C.5 file upload implementation, or descope to MIME type + magic bytes + extension allowlist and update QA §12.5 accordingly. |

---

## High Issues

| # | Location | Issue | Recommendation |
|---|----------|-------|----------------|
| 4 | APP §1.3/§2.2, QA §3.2/§3.3, IMPL B.1 | **Client model missing `phone`, `address`, and `notes` fields.** APPLICATION-PLAN §2.2 defines these fields. QA tests creation with them and display on client detail. The Prisma Client model in IMPL B.1 omits all three. | Add `phone` (optional string), `address` (optional text), `notes` (optional text) to the Client model in B.1 and corresponding Zod validation in B.2. |
| 5 | APP §3.3/§3.4, QA §6.2, IMPL B.4/C.6 | **Timer "pause" vs "stop" semantics mismatch.** APPLICATION-PLAN §3.3 says starting a new timer "auto-pauses" the running one (implying resumability). QA §6.2 tests a Pause button. But IMPL only has start/stop/discard — no pause/resume API. "Stop" creates a time entry, "discard" deletes it. There is no way to pause and resume later. | Either add `POST /api/timer/pause` and `POST /api/timer/resume` endpoints with a `paused_at` field, or clarify that "auto-pause" means "auto-stop" (saves partial entry) and update APPLICATION-PLAN and QA accordingly. |
| 6 | APP §4.4, QA §12.4, IMPL A.3/E.1 | **CSRF protection mechanism never defined.** APPLICATION-PLAN requires "CSRF tokens on all state-changing requests." QA tests rejection of requests without valid CSRF tokens. IMPL mentions CSRF in Phase A and E.1 checklist but never specifies the mechanism (token-based? SameSite cookie? Origin header?). | Add explicit CSRF strategy to Phase A.3. Recommended: `SameSite=Strict` cookie + `Origin` header verification on state-changing requests. If this is sufficient, update QA §12.4 to test Origin-header-based CSRF protection rather than token-based. |
| 7 | APP §3.7, QA §1.6, IMPL C.10 | **No toggle for portal file uploads.** APPLICATION-PLAN says portal file upload is available "if enabled by freelancer." QA tests the toggle. But there is no `portal_file_upload_enabled` field on the Project entity and no UI to control it. | Add `portal_file_upload_enabled` boolean (default false) to Project model in B.1. Add toggle in project settings UI (C.4). Check flag in portal file upload endpoint (C.10). |
| 8 | APP §6.4, IMPL C.7 | **Missing "send invoice without business profile" guard.** APPLICATION-PLAN §6.4 explicitly requires blocking invoice send when business profile is incomplete (no name or payment instructions). IMPL C.7 does not mention this pre-send validation. | Add pre-send check to `POST /api/invoices/[id]/send`: verify BusinessProfile has `business_name` and `payment_instructions` populated. Return 422 with descriptive error if not. |
| 9 | APP §2.2 TaskDependency, IMPL B.2 | **No circular dependency chain detection.** APPLICATION-PLAN validates self-dependency and same-project constraint. IMPL B.2 covers these. But multi-hop circular chains (A blocks B, B blocks C, C blocks A) are not addressed anywhere. | Add graph traversal check in the task dependency creation endpoint. Before allowing a new dependency, walk the blocking chain to ensure no cycle exists. |
| 10 | QA §13.6, IMPL C.9/E.5 | **Account deletion doesn't block login during 30-day grace period.** IMPL sets `scheduled_deletion_at` and hard-deletes 30 days later. But during that window the user record still exists with valid credentials. QA tests "User cannot log back in with same credentials" immediately. | Add login guard in A.3: if `User.scheduled_deletion_at` is set, reject login. Consider adding a "cancel deletion" flow if user logs in during grace period. |
| 11 | IMPL Phase B checkpoint, QA §12.2 | **Phase B claims file IDOR testing, but Uploadthing isn't configured until Phase C.** File upload integration requires `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` which are Phase C environment variables. File IDOR cannot be tested in Phase B. | Remove file IDOR from Phase B checkpoint. Add it explicitly to Phase C checkpoint. |
| 12 | IMPL Phase B checkpoint, QA §13.6 | **Phase B claims full account deletion cascade testing, but the scheduled hard-delete job is Phase E.5.** Phase B can test setting `scheduled_deletion_at` and immediate logout, but not the actual 30-day cascade. | Split: Phase B tests the soft-delete trigger and immediate session invalidation. Full cascade verification deferred to Phase E. |
| 13 | IMPL Phase C checkpoint, QA §11.10 | **Phase C claims session expiry form preservation is testable, but localStorage form save is Phase D.9.** The form data preservation mechanism is explicitly a Phase D deliverable. | Move localStorage form preservation portion of §11.10 to Phase D checkpoint. Phase C can test redirect-to-login and return-URL. |

---

## Medium Issues

| # | Location | Issue | Recommendation |
|---|----------|-------|----------------|
| 14 | APP §1.2, QA §2.2, IMPL C.2 | **Today View "reschedule to tomorrow" action not planned.** APPLICATION-PLAN specifies it. QA tests it. IMPL C.2 only describes data fetching and timer start — no inline rescheduling UI. | Add to C.2: "Reschedule action: inline date bump (today → tomorrow) via `PATCH /api/tasks/[id]` with updated `due_date`." |
| 15 | QA §2.2, IMPL C.2 | **Timezone handling for "today" not specified.** User.timezone is stored but IMPL never describes how the Today View API resolves "today" relative to the user's timezone vs UTC. | Add to C.2: `/api/tasks` must resolve "today" using `User.timezone`, not server time or UTC. |
| 16 | APP §1.7, IMPL C.7 | **No endpoint for manually marking invoice as "sent" without emailing.** APP §5.3 says "User clicks Send (email) or manually marks as sent." IMPL only has `POST /api/invoices/[id]/send` which triggers email. | Add `POST /api/invoices/[id]/mark-sent` endpoint for manual status change without sending email. |
| 17 | APP §1.6, IMPL B.4/C.6 | **Time entry export endpoint missing from API route list.** C.6 references `GET /api/time-entries/export?format=csv` but it's not listed in the authoritative B.4 API route table. | Add `GET /api/time-entries/export` to B.4 with format parameter, date range filters, and authentication. |
| 18 | APP §3.1, IMPL C.2 | **Onboarding flow is flat, not sequential.** APPLICATION-PLAN describes a guided sequential flow: create client → prompted to create project → prompted to add task. IMPL C.2 only mentions "empty state: onboarding prompts" without describing the sequential experience. | Specify whether onboarding is sequential guided prompts (contextual after each step) or static empty state CTAs. Detail the progression. |
| 19 | APP §3.6, QA §6.1, IMPL C.6 | **Time entry grouping modes underspecified.** APPLICATION-PLAN specifies "Group by: day, client, project" with summary totals. QA tests specific grouping with subtotals. IMPL C.6 says "filters + grouping" in one word. | Add to C.6: "Group-by modes: `group_by=day|client|project`. Each group shows header with subtotals (hours, billable amount). Summary bar shows total hours and total billable amount." |
| 20 | APP §3.6, QA §7.1, IMPL C.7 | **Invoice list summary statistics not planned.** APPLICATION-PLAN shows "Summary: total outstanding, total paid this month." QA tests these. IMPL C.7 only describes list with filters. | Add summary stats to `GET /api/invoices` response or a separate endpoint. |
| 21 | APP §4.1, IMPL A.3/B.2 | **Password complexity rules not explicit in Zod schemas.** APPLICATION-PLAN requires "one uppercase, one lowercase, one number, min 8 chars." IMPL mentions password hashing but never defines the validation regex. | Add explicit password regex to B.2 Zod schema: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/` |
| 22 | APP §4.1, IMPL A.3/C.1 | **Unverified user restrictions undefined.** APPLICATION-PLAN says email verification is "required before full access." IMPL adds a verification banner but never defines what "full access" means — what can't unverified users do? | Define specific restrictions (e.g., cannot send invoices, use portal, or export data). Or specify that the banner is informational-only with no feature restrictions. |
| 23 | APP §4.2, IMPL C.5 | **File access privacy not enforced at storage level.** APPLICATION-PLAN requires files "served through authenticated endpoints." IMPL uses Uploadthing with `GET /api/files/[id]/download` for signed URLs, but doesn't describe making Uploadthing storage private (preventing direct URL guessing). | Configure Uploadthing for private-only access. Document that all file URLs are time-limited signed URLs, never permanent public URLs. |
| 24 | APP §4.5, IMPL C.9 | **GDPR data export underspecified.** APPLICATION-PLAN requires data export. IMPL C.9 mentions `GET /api/settings/export` that generates a JSON archive, but no detail on format, completeness, delivery mechanism, or timeout handling for large accounts. | Specify: export format (JSON ZIP), delivery (background job + download link or email), included entities (exhaustive list), and serverless timeout strategy. |
| 25 | APP §5.1, IMPL C.4 | **Timer-stopping on project status changes not specified.** APPLICATION-PLAN requires "all running timers stopped" on Active → On Hold and Active → Cancelled. IMPL B.5 mentions timer stopping for client deletion but not for project status transitions. | Add timer-stopping logic to `PATCH /api/projects/[id]` for On Hold and Cancelled transitions. |
| 26 | APP §5.3, IMPL C.7 | **Missing guards for invoice status transitions.** APPLICATION-PLAN prohibits Sent/Paid/Overdue → Draft and Paid → any. IMPL says "draft-only editing" but no explicit guard rejects invalid transitions. | Add status transition validation in `PATCH /api/invoices/[id]`: reject Draft from non-Draft, reject any change from Paid. |
| 27 | APP §5.5, IMPL B.5 | **Soft delete vs hard delete distinction not in implementation.** APPLICATION-PLAN specifies archive (soft delete) as default for clients, with hard delete requiring extra confirmation. IMPL B.5 focuses on hard delete cascades without describing the soft/hard distinction. | Clarify: client deletion defaults to archive. Hard delete only available from archived state. Projects: hard delete only from cancelled/completed. |
| 28 | APP §6.2, IMPL D.8 | **Automatic timeout retry not described.** APPLICATION-PLAN specifies "Retry request once after 3 seconds" on network timeout. IMPL D.8 covers offline banner but not automatic retry. | Add retry logic to API client wrapper: on timeout, wait 3s, retry once, then show error toast. |
| 29 | APP §6.4, IMPL C.4/C.6 | **Timer start on completed/cancelled project not guarded.** APPLICATION-PLAN blocks timer start on completed projects. IMPL C.6 timer start doesn't mention project status check. | Add project status check to `POST /api/timer/start`: reject if project status is completed, cancelled, or on_hold. |
| 30 | APP §6.4, IMPL C.3 | **Double confirmation for client deletion not specified.** APPLICATION-PLAN requires "double confirmation" when deleting a client with active projects. IMPL C.3 mentions "cascade warning" but not the two-step confirmation UX. | Specify double confirmation: first dialog shows cascade warning, second requires typing client name or checking a confirmation box. |
| 31 | QA §9.1, IMPL C.9 | **Email change verification workflow undetailed.** IMPL C.9 says "email change requires verification" but provides no mechanism — no `pending_email` field, no workflow description. | Add to C.9: store `pending_email` on User, send verification to new address, swap `email` ← `pending_email` on verification. Or reuse EmailVerificationToken with a `new_email` field. |

---

## Low Issues

| # | Location | Issue | Recommendation |
|---|----------|-------|----------------|
| 32 | APP §1.1, IMPL C.1 | Landing page pricing section not mentioned in implementation (static mockup content, but never acknowledged). | Note in C.1 that pricing is static HTML from mockup, no dynamic data source needed. |
| 33 | APP §1.1, QA §1.1, IMPL A/C | Authenticated user redirect from `/` to `/dashboard` not explicitly planned (auth page redirects are, but landing page is separate). | Add root route auth check in Phase A or C.1. |
| 34 | APP §1.3, QA §3.2, IMPL C.3 | Client detail "total hours tracked" and "total revenue" aggregate stats not mentioned in C.3. | Add aggregated stats to `GET /api/clients/[id]` response. |
| 35 | APP §1.4, IMPL C.4 | Budget progress bar on project list page not specified (data model supports it, but API/UI silent). | Ensure `GET /api/projects` returns budget data for progress bar rendering. |
| 36 | APP §1.5, IMPL C.5 | Blocked-by info display on task detail — data model and APIs exist but no UI rendering detail. | Add UI specification to C.5 for dependency visualization. |
| 37 | APP §1.6, IMPL C.6 | Time entry hourly rate and amount display — TimeEntry has no rate/amount field; must be derived from project. | Document that `GET /api/time-entries` includes computed `hourly_rate` (from project) and `amount` (duration × rate). |
| 38 | APP §1.7, IMPL C.7 | Invoice creation wizard step navigation (back/forward) has no UI component detail. | Add wizard component specification to C.7. |
| 39 | APP §3.4, IMPL C.6 | Long-running timer handling (overnight, multi-day) not addressed. | Add stale timer detection: notification after 8+ hours, or configurable max duration. |
| 40 | QA §4.3, IMPL C.4/D | Cross-tab sync mechanism missing — QA tests two-tab stale state but IMPL has no polling or WebSocket. | Add SWR `refreshInterval` polling on board view, or document that cross-tab sync is out of scope and requires manual refresh. |
| 41 | QA §8.1, IMPL C.8 | Weekly calendar view not mentioned. QA says "if available" (optional). | Add note to C.8: weekly view is a stretch goal or out of scope. |
| 42 | QA §14.2, IMPL C.9 | Search results pagination not described. QA tests 500+ results. | Add to C.9: search results paginated (limit 20, load more). |
| 43 | QA §17.6, IMPL C.7 | Currency formatting utility not described. `default_currency` stored but no `Intl.NumberFormat` usage specified. | Add shared utility using `Intl.NumberFormat` with user's currency code. |
| 44 | IMPL Phase A §10.3 | Phase A checkpoint claims HTTP error codes 401/404/500 testable, but 403 requires entities (Phase B). | Narrow Phase A to 401, 404, 429, 500 only. |
| 45 | IMPL Phase B checkpoint | Phase B checkpoint references full QA sections (§3.3, §4.1a, §5.2, etc.) but only API validation subsets are testable — many test cases are UI-specific. | Add blanket note: "API validation subsets only; UI-specific test cases deferred to Phase C." |
| 46 | IMPL Phase C checkpoint | Phase C claims "full section" for many QA sections, but Loading State and Mobile sub-sections within each section are Phase D deliverables. | Add blanket note: "Loading State and Mobile sub-sections excluded from Phase C; deferred to Phase D." |
| 47 | IMPL Phase C/D §4.3 | Phase C claims full Board View testing, but keyboard-accessible drag-and-drop (via @dnd-kit keyboard sensor) is a Phase D.6 addition. | Note that keyboard DnD is Phase D; Phase C tests mouse-only. |
| 48 | IMPL Phase E §14.1/§14.2 | Performance testing requires large seed data (50 clients, 200 tasks, 1000 entries) but no data seeding script is planned. | Add test data seeding script to Phase E (or Phase B). |

---

## Coverage Matrix

### APPLICATION-PLAN.md → IMPLEMENTATION-PLAN.md

| APP Section | Fully Covered | Gaps Found |
|-------------|:---:|:---:|
| §1.1 Public Pages | Mostly | Landing redirect, pricing note |
| §1.2 Dashboard / Today | Mostly | Reschedule action, timezone |
| §1.3 Clients | Mostly | Aggregate stats, phone/address/notes fields |
| §1.4 Projects | Mostly | Budget progress bar on list, portal upload toggle |
| §1.5 Tasks | **Gap** | TaskComment entity entirely missing |
| §1.6 Time Tracking | Mostly | Export endpoint, grouping, rate/amount, pause |
| §1.7 Invoicing | Mostly | Mark-as-sent, wizard UX, summary stats, pre-send guard |
| §1.8 Calendar | Yes | — |
| §1.9 Settings / Search | Mostly | Email change flow, quiet hours UI, search grouping |
| §2 Data Model | Yes | TaskComment missing; all audit fixes applied |
| §3 User Flows | Mostly | Onboarding sequential flow, timer pause, stale timer |
| §4 Security | **Gaps** | CSRF mechanism, file scanning, file privacy, unverified restrictions |
| §5 State Transitions | Mostly | Timer-stop on status change, invoice guards, soft/hard delete flow |
| §6 Error Handling | Mostly | Timeout retry, 409 reload, 413 inline, double confirmation |

### QA-CHECKLIST.md → IMPLEMENTATION-PLAN.md

| QA Section | Fully Covered | Gaps Found |
|------------|:---:|:---:|
| §1 Public Pages | Yes | — |
| §2 Dashboard / Today | Mostly | Reschedule, timezone |
| §3 Clients | Mostly | Phone/address/notes, aggregate stats |
| §4 Projects | Mostly | Cross-tab sync, keyboard DnD |
| §5 Tasks | **Gap** | TaskComment missing |
| §6 Time Tracking | Mostly | Pause, grouping, export, timer resilience |
| §7 Invoicing | Mostly | Mark-as-sent |
| §8 Calendar | Mostly | Weekly view |
| §9 Settings / Search | Mostly | Email change flow, search pagination, Notes type |
| §10 Global Components | Mostly | Loading states (Phase D), mobile nav (Phase D) |
| §11 Cross-Page Flows | **Gaps** | Overdue automation (needs Phase E), notification triggers (needs Phase E), session form save (needs Phase D) |
| §12 Security | **Gaps** | CSRF mechanism, malware scanning, file IDOR timing |
| §13 Destructive Actions | Mostly | Login block during grace period, cascade timing |
| §14 Performance | Mostly | Seed data script, search pagination |
| §15 Accessibility | Yes | — |
| §16 Cross-Browser | Mostly | No browser testing strategy |
| §17 Real-User Behavior | Mostly | Locale handling, cross-tab sync |

### Phase QA Checkpoint Accuracy

| Phase | Checkpoint Status | Issues |
|-------|------------------|--------|
| **A** | Mostly accurate | Overstates HTTP error code coverage; 403 needs Phase B entities |
| **B** | Overstated | References full QA sections but only API subsets testable; file IDOR needs Phase C; full cascade needs Phase E |
| **C** | Significantly overstated | Claims §11.8 (overdue automation) but needs Phase E scheduled job; claims §11.10 form save but needs Phase D; Loading/Mobile sub-sections need Phase D |
| **D** | Accurate | Correctly scoped to polish features |
| **E** | Mostly accurate | Malware scanning has no tooling; CSRF mechanism undefined; needs seed data script |

---

## Top 10 Action Items (Priority Order)

1. **Add TaskComment entity** — model, API routes, UI, search index (Critical)
2. **Fix Phase C checkpoint** — move §11.8 overdue automation and §11.9 scheduled triggers to Phase E (Critical)
3. **Choose malware scanning approach** — add to tech stack or descope and update QA (Critical)
4. **Add Client phone/address/notes fields** — missing from Prisma schema (High)
5. **Resolve timer pause vs stop** — add pause API or clarify semantics across all docs (High)
6. **Define CSRF mechanism** — explicit strategy in Phase A.3 (High)
7. **Add portal_file_upload_enabled** — field on Project, toggle in settings, guard in portal endpoint (High)
8. **Add business profile send guard** — pre-send validation on invoice (High)
9. **Add circular dependency detection** — graph traversal on dependency creation (High)
10. **Block login for pending-deletion accounts** — guard in auth check (High)

---

*This audit should be resolved before implementation begins. All Critical issues must be fixed in IMPLEMENTATION-PLAN.md. High issues should be addressed before the phase that introduces them.*
