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
- As a freelancer, I want to **archive completed projects** so that my workspace stays clean but history is preserved.

### Time Tracking

- As a freelancer, I want to **start and stop a timer on any task** so that I can track time without leaving my task view.
- As a freelancer, I want to **manually log time after the fact** so that I can record hours I forgot to track in real time.
- As a freelancer, I want to **see how many hours I've logged per client this week/month** so that I can verify I'm billing accurately.
- As a freelancer, I want to **set an hourly rate per client or project** so that time logs automatically calculate earnings.
- As a freelancer, I want to **get a reminder if I haven't tracked time in a while** so that I don't lose billable hours.

### Deadlines & Scheduling

- As a freelancer, I want to **see a calendar view of all deadlines across clients** so that I can spot conflicts early.
- As a freelancer, I want to **receive notifications before a deadline approaches** so that I have time to deliver or renegotiate.
- As a freelancer, I want to **see my workload for the week at a glance** so that I know if I can take on more work.
- As a freelancer, I want to **block out unavailable time** (vacation, personal days) so that deadlines account for my real availability.

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

### Insights & Business Health

- As a freelancer, I want to **see a dashboard showing this month's revenue, hours worked, and active projects** so that I have a pulse on my business.
- As a freelancer, I want to **compare earnings across clients** so that I can identify my most and least profitable work.
- As a freelancer, I want to **review past months' data** so that I can spot trends in workload and income.
- As a freelancer, I want to **see my effective hourly rate per project** (total earned / total hours) so that I know if a fixed-price project was worth it.

---

## 4. Feature List

### MVP — Must Have for First Usable Version

These features represent the minimum set needed for a freelancer to replace their current patchwork of tools.

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Client profiles** | Create, edit, and archive clients with name, contact info, and notes |
| 2 | **Project management** | Create projects under clients; set status, description, and deadline |
| 3 | **Task board (Kanban)** | Create tasks within projects; drag between columns (To Do / In Progress / Review / Done) |
| 4 | **Task details** | Due dates, priority levels, descriptions, subtasks, and file attachments |
| 5 | **Cross-project task list** | A single filterable/sortable view of all tasks across every project |
| 6 | **Built-in time tracker** | Start/stop timer on any task; manual time entry; per-client hourly rate |
| 7 | **Deadline calendar** | Calendar view showing all due dates across projects |
| 8 | **Deadline reminders** | Configurable notifications (email or in-app) before tasks/projects are due |
| 9 | **Basic dashboard** | Overview showing active projects, upcoming deadlines, and hours tracked this week |
| 10 | **Search** | Full-text search across clients, projects, tasks, and notes |

### Nice to Have — Improves Experience but Not Essential

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Invoice generation** | Create invoices from tracked time entries; export as PDF |
| 2 | **Invoice status tracking** | Mark invoices as draft, sent, paid, overdue |
| 3 | **Earnings dashboard** | Monthly revenue, outstanding invoices, earnings by client |
| 4 | **Recurring tasks** | Auto-create tasks on a schedule (weekly, biweekly, monthly) |
| 5 | **Client portal** | Read-only shareable link so clients can see project status |
| 6 | **Workload heatmap** | Visual showing how booked you are over the next 2-4 weeks |
| 7 | **Tags and labels** | Categorize tasks by type (design, dev, meeting, admin) across projects |
| 8 | **Activity log** | Per-project timeline of changes, decisions, and communications |
| 9 | **Dark mode** | System-matched and manual theme toggle |
| 10 | **Mobile responsive** | Full functionality on tablet and phone browsers |

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

---

## 5. Competitive Context

| Dimension | Trello | Asana | Toggl | **TaskFlow** |
|-----------|--------|-------|-------|-------------|
| **Primary audience** | Teams | Teams | Anyone tracking time | Solo freelancers |
| **Project structure** | Flat boards | Nested projects & portfolios | Projects for time grouping | Client > Project > Task hierarchy |
| **Time tracking** | Requires Power-Up | Requires integration | Core feature, no task management | Built-in, attached to tasks |
| **Invoicing** | No | No | Separate product (Toggl Track + external) | Integrated, generated from time logs |
| **Cross-project view** | No (board-per-project) | Yes, but complex | Limited to time reports | Single task list + calendar across all clients |
| **Client management** | No concept of "client" | No concept of "client" | Client tags only | First-class client profiles with history |
| **Complexity** | Simple but unstructured | Powerful but team-oriented overhead | Focused only on time | Purpose-built for freelancer workflow |
| **Pricing model** | Free tier, then per-user team plans | Free tier, then per-user team plans | Free tier, then per-user | Flat fee for individual (no per-seat cost) |

### How TaskFlow Is Different

1. **Client-centric, not team-centric.** Everything is organized around clients, because that's how freelancers think about their work — not around "workspaces" or "organizations."
2. **Time tracking lives inside project management.** No switching between a task app and a time app. Start a timer from the task you're working on.
3. **Invoicing closes the loop.** Track time, generate an invoice, mark it paid — all without leaving TaskFlow. Competitors require separate tools or paid add-ons.
4. **Zero collaboration overhead.** No user roles, no permissions matrices, no team onboarding flows. Every feature is optimized for a single user managing multiple clients.
5. **Business health at a glance.** A freelancer's dashboard shouldn't show team velocity — it should show revenue, utilization, and upcoming deadlines.

---

## 6. Success Metrics

### Activation

| Metric | Target | Rationale |
|--------|--------|-----------|
| Creates first client + project within first session | > 70% of signups | Indicates the setup flow is fast and intuitive |
| Tracks time at least once in first week | > 50% of signups | Core value realized early |

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
