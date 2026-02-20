# TaskFlow — Product Definition

> A project management app built for freelancers who juggle multiple clients and projects.

---

## 1. Target User

### Primary Persona: The Independent Freelancer

TaskFlow is designed for **solo freelancers and independent contractors** — designers, developers, writers, consultants, marketers — who manage 3-10 active clients simultaneously and handle every aspect of project delivery themselves.

### Demographics

- Works independently (no team to delegate to)
- Manages multiple clients with overlapping deadlines
- Handles both the work *and* the business side (invoicing, time tracking, client communication)
- Revenue is directly tied to billable hours or deliverables
- Uses a mix of disconnected tools (spreadsheets, sticky notes, calendar apps, email)

### Pain Points

1. **Context switching is expensive.** Jumping between clients means constantly re-loading mental context — what was the last thing discussed, what's the next deliverable, where did that file go.
2. **No single source of truth.** Project details are scattered across email threads, Slack channels, Google Docs, and notebooks. Finding the latest version of anything takes real effort.
3. **Time tracking is an afterthought.** Most freelancers forget to track time until invoicing day, then reconstruct hours from memory — leading to lost revenue.
4. **Deadlines sneak up.** Without a clear cross-project view, it's easy to overcommit or miss a deadline because another project consumed all available hours.
5. **Existing tools are built for teams, not individuals.** Trello, Asana, and Monday.com assume a team workflow with roles, permissions, and collaboration overhead that a solo freelancer doesn't need and finds cluttering.
6. **Invoicing and project management live in separate worlds.** Freelancers manually copy time logs into invoices, introducing errors and wasting unbillable time.
7. **No visibility into business health.** Freelancers lack a quick way to answer: How much am I earning this month? Which clients are most profitable? Am I overbooked next week?
8. **Hourly and fixed-price work don't live in the same tool.** Some projects are billed hourly, others are flat-rate. Most tools assume one or the other, forcing freelancers to track fixed-price projects in spreadsheets.
9. **No way to tell if a project is over budget.** Without tracking estimated vs. actual hours, freelancers discover they've blown past a quote only when the project is done — too late to course correct.

---

## 2. Core Value Proposition

**TaskFlow gives freelancers a single place to manage every client, track every hour, and never miss a deadline — without the overhead of tools built for teams.**

---

## 3. User Stories

### Project & Task Management

- As a freelancer, I want to **organize my work by client and project** so that I can quickly find everything related to a specific engagement.
- As a freelancer, I want to **create tasks with due dates and priorities** so that I know what to work on next.
- As a freelancer, I want to **break large deliverables into subtasks** so that complex projects feel manageable.
- As a freelancer, I want to **see all my tasks across every project in one view** so that I can plan my day without switching between client boards.
- As a freelancer, I want to **drag and drop tasks between statuses** (e.g., To Do, In Progress, Done) so that I can visually track progress.
- As a freelancer, I want to **set recurring tasks** (e.g., weekly client check-in) so that routine work doesn't fall through the cracks.
- As a freelancer, I want to **add notes and attachments to tasks** so that project context is captured where the work lives.
- As a freelancer, I want to **save a project as a template and duplicate it** so that I don't recreate the same task structure every time I take on a similar engagement.
- As a freelancer, I want to **mark tasks as "waiting on client"** so that I can instantly see what's blocked vs. what I can work on right now.
- As a freelancer, I want to **see a focused "today" view** showing only what I need to work on today across all clients so that I can start my day without planning overhead.
- As a freelancer, I want to **archive completed projects** so that my workspace stays clean but history is preserved.

### Time Tracking

- As a freelancer, I want to **start and stop a timer on any task** so that I can track time without leaving my task view.
- As a freelancer, I want to **manually log time after the fact** so that I can record hours I forgot to track in real time.
- As a freelancer, I want to **see how many hours I've logged per client this week/month** so that I can verify I'm billing accurately.
- As a freelancer, I want to **set an hourly rate per client or project** so that time logs automatically calculate earnings.
- As a freelancer, I want to **mark time entries as billable or non-billable** so that admin work and out-of-scope revisions don't inflate my invoices.
- As a freelancer, I want to **get a reminder if I haven't tracked time in a while** so that I don't lose billable hours.

### Deadlines & Scheduling

- As a freelancer, I want to **see a calendar view of all deadlines across clients** so that I can spot conflicts early.
- As a freelancer, I want to **receive notifications before a deadline approaches** so that I have time to deliver or renegotiate.
- As a freelancer, I want to **see my workload for the week at a glance** so that I know if I can take on more work.
- As a freelancer, I want to **block out unavailable time** (vacation, personal days) so that deadlines account for my real availability.

### Budgets & Pricing

- As a freelancer, I want to **set a project budget in hours or dollars** so that I can see at a glance whether a project is on track or over scope.
- As a freelancer, I want to **get an alert when a project reaches 80% of its budget** so that I can renegotiate scope before I'm underwater.
- As a freelancer, I want to **manage fixed-price projects with payment milestones** so that TaskFlow works for project-based pricing, not just hourly billing.
- As a freelancer, I want to **see estimated vs. actual hours on any project** so that I can quote more accurately next time.

### Client Management

- As a freelancer, I want to **store client contact info and notes in one place** so that I don't have to dig through emails.
- As a freelancer, I want to **track which projects belong to which client** so that I can see the full history of a relationship.
- As a freelancer, I want to **log key decisions and communications per project** so that I have a reference when disputes arise.
- As a freelancer, I want to **share a read-only project status page with a client** so that they can check progress without emailing me.

### Invoicing & Earnings

- As a freelancer, I want to **generate an invoice from tracked time** so that billing day is fast and accurate.
- As a freelancer, I want to **see my total earnings and outstanding invoices** so that I understand my cash flow.
- As a freelancer, I want to **mark invoices as sent, paid, or overdue** so that I can follow up on late payments.
- As a freelancer, I want to **export invoices as PDF** so that I can send them through any channel.
- As a freelancer, I want to **get automatic reminders about overdue invoices** so that I follow up on late payments without manually tracking them.
- As a freelancer, I want to **create invoices for fixed-price milestones** (not just time-based) so that all my billing lives in one place.

### Insights & Business Health

- As a freelancer, I want to **see a dashboard showing this month's revenue, hours worked, and active projects** so that I have a pulse on my business.
- As a freelancer, I want to **compare earnings across clients** so that I can identify my most and least profitable work.
- As a freelancer, I want to **review past months' data** so that I can spot trends in workload and income.
- As a freelancer, I want to **see my effective hourly rate per project** (total earned / total hours) so that I know if a fixed-price project was worth it.

---

## 4. Feature List

### MVP — Must Have for First Usable Version

These features represent the minimum set needed for a freelancer to actually replace their current patchwork of tools. The litmus test: if it's missing, does the freelancer still need a second app to get through the week?

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Client profiles** | Create, edit, and archive clients with name, contact info, and notes |
| 2 | **Project management** | Create projects under clients; set status, description, deadline, and billing type (hourly or fixed-price) |
| 3 | **Project templates** | Save a project's task structure as a template; duplicate it for new engagements of the same type |
| 4 | **Task board (Kanban)** | Create tasks within projects; drag between columns (To Do / In Progress / Waiting on Client / Review / Done) |
| 5 | **Task details** | Due dates, priority levels, descriptions, subtasks, and file attachments |
| 6 | **Cross-project task list** | A single filterable/sortable view of all tasks across every project, including a "Today" focus mode |
| 7 | **Built-in time tracker** | Start/stop timer on any task; manual time entry; per-client hourly rate; billable/non-billable toggle |
| 8 | **Deadline calendar** | Calendar view showing all due dates across projects |
| 9 | **Deadline reminders** | Configurable notifications (email or in-app) before tasks/projects are due |
| 10 | **Invoice generation** | Create invoices from tracked time or fixed-price milestones; export as PDF |
| 11 | **Invoice status tracking** | Mark invoices as draft, sent, paid, overdue; filter to see what's outstanding |
| 12 | **Basic dashboard** | Overview showing active projects, upcoming deadlines, hours tracked this week, and outstanding invoices |
| 13 | **Mobile responsive** | Full functionality on tablet and phone browsers — freelancers don't work exclusively from desks |
| 14 | **Search** | Full-text search across clients, projects, tasks, and notes |

**What changed vs. v1 of this document and why:**
- *Invoice generation* and *invoice status tracking* moved up from Nice to Have. Without invoicing, the time tracker is a stopwatch that doesn't pay rent. The value prop promises "a single place" — that means closing the loop through to billing.
- *Mobile responsive* moved up from Nice to Have. Freelancers check tasks from phones constantly. If they can't, they'll keep Trello.
- *Project templates* added. Recreating the same 15 tasks for every branding project would drive users away within a month.
- *"Waiting on Client" column* added to Kanban. Half a freelancer's tasks are blocked on client feedback — "In Progress" doesn't capture this and leads to wasted context switching.
- *Billable/non-billable toggle* added to time tracker. Admin time, out-of-scope revisions, and internal exploration shouldn't appear on invoices. Harvest, Toggl, and every serious time tool has this.
- *"Today" focus mode* added to cross-project list. Freelancers need a daily starting point, not just a wall of everything.
- *Fixed-price billing type* added to projects. Many freelancers charge per project, not per hour. The original doc assumed hourly throughout.

### Nice to Have — Improves Experience but Not Essential

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Project budgets** | Set an estimated budget (hours or dollars) per project; see actual vs. estimated; alert at 80% |
| 2 | **Late payment reminders** | Automatic email nudge when an invoice goes past due (configurable frequency) |
| 3 | **Earnings dashboard** | Monthly revenue, outstanding invoices, effective hourly rate, earnings by client |
| 4 | **Recurring tasks** | Auto-create tasks on a schedule (weekly, biweekly, monthly) |
| 5 | **Client portal** | Read-only shareable link so clients can see project status |
| 6 | **Workload heatmap** | Visual showing how booked you are over the next 2-4 weeks |
| 7 | **Tags and labels** | Categorize tasks by type (design, dev, meeting, admin) across projects |
| 8 | **Activity log** | Per-project timeline of changes, decisions, and communications |
| 9 | **Keyboard shortcuts** | Power-user shortcuts for common actions (new task, start timer, switch project) |

**What changed vs. v1 and why:**
- *Project budgets* added. Freelancers need to know they're at 18 of 20 quoted hours before they blow the estimate. Not MVP because freelancers can survive without it — but the first feature request will be "why can't I see if I'm over budget?"
- *Late payment reminders* added. Chasing invoices is universally hated. FreshBooks and Harvest both offer this. Not MVP because freelancers can set their own calendar reminders, but it's high-value automation.
- *Dark mode* removed (moved to Future). It's visual polish, not workflow functionality.
- *Mobile responsive* removed (promoted to MVP).
- *Invoice generation/tracking* removed (promoted to MVP).

### Future — Good Ideas for Later

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Payment integration** | Connect with Stripe/PayPal so clients can pay invoices directly |
| 2 | **Contract/proposal templates** | Generate project proposals and contracts from templates |
| 3 | **Expense tracking** | Log project-related expenses alongside time for accurate profitability |
| 4 | **Email integration** | BCC an address to capture emails as project notes automatically |
| 5 | **Calendar sync** | Two-way sync with Google Calendar / Outlook |
| 6 | **Native mobile app** | iOS and Android apps with offline support |
| 7 | **AI project estimation** | Suggest time/cost estimates based on historical data from similar projects |
| 8 | **Multi-currency support** | Handle international clients with different billing currencies |
| 9 | **Tax reporting** | Quarterly/annual earnings summaries formatted for tax prep |
| 10 | **API & integrations** | REST API and integrations with tools like Slack, Notion, and QuickBooks |
| 11 | **Dark mode** | System-matched and manual theme toggle |
| 12 | **Client approval workflow** | Clients can approve/reject deliverables directly from the client portal |

---

## 5. Competitive Context

| Dimension | Trello | Asana | Toggl | Harvest | FreshBooks | **TaskFlow** |
|-----------|--------|-------|-------|---------|------------|-------------|
| **Primary audience** | Teams | Teams | Anyone tracking time | Teams & freelancers | Small businesses | Solo freelancers |
| **Project structure** | Flat boards | Nested projects & portfolios | Projects for time grouping | Projects for time grouping | Projects tied to invoices | Client > Project > Task hierarchy |
| **Task management** | Kanban boards | Full-featured (lists, boards, timelines) | None | None | None | Kanban with "Waiting on Client" + cross-project list |
| **Time tracking** | Requires Power-Up | Requires integration | Core feature | Core feature | Basic (start/stop) | Built-in, attached to tasks, billable/non-billable |
| **Invoicing** | No | No | No (separate product) | Yes, from time entries | Yes, core feature | Yes, from time entries or fixed-price milestones |
| **Fixed-price projects** | N/A | N/A | No | No | Yes (estimates) | Yes, with milestone billing |
| **Client management** | No concept of "client" | No concept of "client" | Client tags only | Client records | Full client profiles | First-class client profiles with project history |
| **Project templates** | Board templates (generic) | Project templates | No | No | No | Yes, save and duplicate any project structure |
| **Budget tracking** | No | Portfolio-level only | No | Yes, with alerts | Yes (estimates vs. actuals) | Yes, per-project with alerts |
| **Complexity** | Simple but unstructured | Powerful but team-oriented | Focused only on time | Time + invoicing only | Accounting-first, limited PM | Purpose-built for freelancer workflow |
| **Pricing model** | Free tier, then per-user | Free tier, then per-user | Free tier, then per-user | $11/user/month, no free tier | $19+/month, no free tier | Flat fee for individual (no per-seat cost) |

### How TaskFlow Is Different

**vs. Trello / Asana** (project management tools): They have task management but no time tracking, no invoicing, no concept of "client," and every feature assumes a team. A freelancer gets collaboration overhead they don't need and has to bolt on 2-3 other tools.

**vs. Toggl** (time tracking tool): Excellent timer, but no task management and no invoicing. Freelancers track time in Toggl, manage tasks in Trello, and invoice in FreshBooks — three tools for one workflow.

**vs. Harvest** (time + invoicing): Closest competitor. Strong time tracking with invoicing, but no task management, no Kanban board, no subtasks, no cross-project planning. Freelancers using Harvest still need a separate task tool.

**vs. FreshBooks** (accounting + invoicing): Powerful invoicing and accounting, but project management is an afterthought — no Kanban, no task dependencies, no "waiting on client" visibility. Better for invoicing than managing work.

**TaskFlow's position**: The only tool that covers task management, time tracking, and invoicing in a single app designed for one person managing multiple clients. Competitors either do project management without billing (Trello, Asana), billing without project management (FreshBooks), or time tracking without either (Toggl). Harvest comes closest but lacks real task management. TaskFlow closes every gap.

---

## 6. Success Metrics

### Activation

| Metric | Target | Rationale |
|--------|--------|-----------|
| Creates first client + project within first session | > 70% of signups | Indicates the setup flow is fast and intuitive |
| Tracks time at least once in first week | > 50% of signups | Core value realized early |
| Creates first invoice within first month | > 30% of signups | Full workflow loop completed (tasks → time → invoice) |

### Engagement (Weekly Active Users)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Opens TaskFlow 4+ days per week | > 40% of active users | Indicates it's becoming a daily work tool, not a novelty |
| Logs time entries 3+ days per week | > 30% of active users | Time tracking is sticky and habitual |
| Uses cross-project task view weekly | > 50% of active users | Validates the multi-client workflow value |

### Retention

| Metric | Target | Rationale |
|--------|--------|-----------|
| 30-day retention | > 40% | Users who survive the first month are likely long-term |
| 90-day retention | > 25% | Strong signal that TaskFlow replaced their old workflow |

### Outcome (Value Delivered)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Average hours tracked per user per week | > 15 hours | Freelancers trust TaskFlow enough to track most of their work |
| Invoices generated per user per month | > 1 | Invoicing feature is actually being used, not ignored |
| Self-reported reduction in "time finding information" | > 50% (via survey) | Validates the single-source-of-truth promise |
| Self-reported missed deadlines per quarter | < 1 (via survey) | Validates the deadline visibility promise |

### Business

| Metric | Target | Rationale |
|--------|--------|-----------|
| NPS (Net Promoter Score) | > 50 | Freelancers would recommend TaskFlow to peers |
| Conversion from free trial to paid | > 5% | Value is clear enough to justify paying |
| Monthly churn rate | < 5% | Users aren't leaving for alternatives |

---

*This document is a living artifact. It should be revisited as user research, feedback, and usage data reveal what freelancers actually need versus what we assumed.*
