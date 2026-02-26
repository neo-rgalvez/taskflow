import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // Clean existing data (in dependency order)
  await prisma.activityLog.deleteMany();
  await prisma.calendarBlockedTime.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.projectTemplate.deleteMany();
  await prisma.fileAttachment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ─── User (Sarah Fletcher — matches mock-data.ts) ──────────────────────────

  const user = await prisma.user.create({
    data: {
      id: "usr_1",
      email: "sarah@fletcherdesign.co",
      // "password123" — placeholder hash (bcrypt in real auth)
      passwordHash: "$2b$12$placeholder.hash.for.seed.data.only.not.real",
      name: "Sarah Fletcher",
      emailVerified: true,
      timezone: "America/New_York",
    },
  });
  console.log(`  User: ${user.name} (${user.email})`);

  // ─── Business Profile ─────────────────────────────────────────────────────

  const businessProfile = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      businessName: "Fletcher Design Co.",
      address: "412 Elm Street, Suite 200\nBrooklyn, NY 11201",
      paymentInstructions:
        "Payment via bank transfer or PayPal.\nBank: Chase Business\nAccount: XXXX-4821\nRouting: 021000021\nPayPal: sarah@fletcherdesign.co",
      defaultTaxRate: 0.0,
      defaultCurrency: "USD",
      invoiceNumberPrefix: "INV-",
      nextInvoiceNumber: 42,
    },
  });
  console.log(`  Business Profile: ${businessProfile.businessName}`);

  // ─── Notification Preference ──────────────────────────────────────────────

  await prisma.notificationPreference.create({
    data: {
      userId: user.id,
      deadlineRemindersEnabled: true,
      deadlineReminderDays: 2,
      budgetAlertsEnabled: true,
      overdueInvoiceRemindersEnabled: true,
      timeTrackingRemindersEnabled: false,
      emailChannelEnabled: true,
      inAppChannelEnabled: true,
    },
  });
  console.log("  Notification Preferences: created");

  // ─── Clients ──────────────────────────────────────────────────────────────

  const clientsData = [
    {
      id: "cli_1",
      name: "Meridian Health Partners",
      contactName: "David Chen",
      email: "david@meridianhealth.com",
      phone: "(415) 555-0182",
      address: "1200 Bay Street, Suite 400\nSan Francisco, CA 94133",
      notes: "Healthcare technology company. Primary contact prefers email. Board meetings Tuesdays.",
      defaultHourlyRate: 125,
      defaultPaymentTerms: 30,
      color: "#6366F1",
    },
    {
      id: "cli_2",
      name: "Luminance Coffee Roasters",
      contactName: "Priya Sharma",
      email: "priya@luminancecoffee.com",
      phone: "(503) 555-0219",
      address: "850 NW Flanders St\nPortland, OR 97209",
      notes: "Specialty coffee brand expanding to e-commerce. Very responsive, quick turnaround.",
      defaultHourlyRate: 110,
      defaultPaymentTerms: 15,
      color: "#EC4899",
    },
    {
      id: "cli_3",
      name: "Northstar Financial Group",
      contactName: "James Whitfield",
      email: "j.whitfield@northstarfg.com",
      phone: "(212) 555-0347",
      address: "One Financial Plaza, 38th Floor\nNew York, NY 10004",
      notes: "Financial services firm. Annual report is recurring work. Strict brand guidelines.",
      defaultHourlyRate: 150,
      defaultPaymentTerms: 30,
      color: "#14B8A6",
    },
    {
      id: "cli_4",
      name: "Verde Landscape Architecture",
      contactName: "Maria Santos",
      email: "maria@verdelandscape.com",
      phone: "(310) 555-0456",
      address: "2200 Pacific Coast Highway\nMalibu, CA 90265",
      notes: "Landscape architecture firm. Portfolio website completed. May need maintenance work.",
      defaultHourlyRate: 100,
      defaultPaymentTerms: 30,
      color: "#F97316",
    },
    {
      id: "cli_5",
      name: "Atlas Education Initiative",
      contactName: "Robert Kimura",
      email: "rkimura@atlasedu.org",
      phone: "(617) 555-0593",
      address: "75 Federal Street\nBoston, MA 02110",
      notes: "Non-profit education platform. Completed branding project. Archived — project wrapped Q4 2025.",
      defaultHourlyRate: 95,
      defaultPaymentTerms: 45,
      isArchived: true,
      color: "#8B5CF6",
    },
  ] as const;

  const clients: Record<string, Awaited<ReturnType<typeof prisma.client.create>>> = {};
  for (const c of clientsData) {
    clients[c.id] = await prisma.client.create({
      data: {
        id: c.id,
        userId: user.id,
        name: c.name,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
        address: c.address,
        notes: c.notes,
        defaultHourlyRate: c.defaultHourlyRate,
        defaultPaymentTerms: c.defaultPaymentTerms,
        isArchived: "isArchived" in c ? c.isArchived : false,
        color: c.color,
      },
    });
  }
  console.log(`  Clients: ${Object.keys(clients).length} created`);

  // ─── Projects ─────────────────────────────────────────────────────────────

  const projectsData = [
    {
      id: "prj_1",
      clientId: "cli_1",
      name: "Patient Portal Redesign",
      description:
        "Complete UX/UI redesign of the patient-facing web portal including appointment scheduling, medical records access, and messaging features.",
      status: "active" as const,
      billingType: "hourly" as const,
      hourlyRate: 125,
      budgetHours: 80,
      budgetAmount: 10000,
      deadline: new Date("2026-04-15"),
      color: "#6366F1",
    },
    {
      id: "prj_2",
      clientId: "cli_2",
      name: "E-Commerce Store Build",
      description:
        "Design and build a complete e-commerce platform for specialty coffee products including subscription management and wholesale ordering.",
      status: "active" as const,
      billingType: "fixed_price" as const,
      fixedPrice: 15000,
      budgetHours: 120,
      budgetAmount: 15000,
      deadline: new Date("2026-05-01"),
      color: "#EC4899",
    },
    {
      id: "prj_3",
      clientId: "cli_1",
      name: "Brand Identity Refresh",
      description:
        "Modernize the Meridian Health Partners brand identity including logo refinement, color palette update, and brand guidelines document.",
      status: "on_hold" as const,
      billingType: "hourly" as const,
      hourlyRate: 125,
      budgetHours: 40,
      budgetAmount: 5000,
      deadline: new Date("2026-06-30"),
      color: "#6366F1",
    },
    {
      id: "prj_4",
      clientId: "cli_3",
      name: "Annual Report Design",
      description:
        "Design the 2025 annual report for Northstar Financial Group including data visualization, infographics, and print-ready layout.",
      status: "active" as const,
      billingType: "fixed_price" as const,
      fixedPrice: 8500,
      budgetHours: 60,
      budgetAmount: 8500,
      deadline: new Date("2026-03-20"),
      color: "#14B8A6",
    },
  ];

  const projects: Record<string, Awaited<ReturnType<typeof prisma.project.create>>> = {};
  for (const p of projectsData) {
    projects[p.id] = await prisma.project.create({
      data: {
        id: p.id,
        clientId: p.clientId,
        userId: user.id,
        name: p.name,
        description: p.description,
        status: p.status,
        billingType: p.billingType,
        hourlyRate: p.hourlyRate ?? null,
        fixedPrice: "fixedPrice" in p ? p.fixedPrice : null,
        budgetHours: p.budgetHours,
        budgetAmount: p.budgetAmount,
        deadline: p.deadline,
        color: p.color,
      },
    });
  }
  console.log(`  Projects: ${Object.keys(projects).length} created`);

  // ─── Milestones (for fixed-price projects) ────────────────────────────────

  const milestonesData = [
    // E-Commerce Store Build
    { id: "mst_1", projectId: "prj_2", name: "Discovery & Wireframes", amount: 3000, dueDate: new Date("2026-03-01"), status: "completed" as const, position: 0 },
    { id: "mst_2", projectId: "prj_2", name: "Visual Design & Prototyping", amount: 4500, dueDate: new Date("2026-03-20"), status: "pending" as const, position: 1 },
    { id: "mst_3", projectId: "prj_2", name: "Development & Integration", amount: 5000, dueDate: new Date("2026-04-15"), status: "pending" as const, position: 2 },
    { id: "mst_4", projectId: "prj_2", name: "Testing & Launch", amount: 2500, dueDate: new Date("2026-05-01"), status: "pending" as const, position: 3 },
    // Annual Report Design
    { id: "mst_5", projectId: "prj_4", name: "Content Layout & Structure", amount: 2500, dueDate: new Date("2026-02-28"), status: "completed" as const, position: 0 },
    { id: "mst_6", projectId: "prj_4", name: "Data Visualization Design", amount: 3000, dueDate: new Date("2026-03-10"), status: "pending" as const, position: 1 },
    { id: "mst_7", projectId: "prj_4", name: "Final Delivery & Print Files", amount: 3000, dueDate: new Date("2026-03-20"), status: "pending" as const, position: 2 },
  ];

  for (const m of milestonesData) {
    await prisma.milestone.create({ data: m });
  }
  console.log(`  Milestones: ${milestonesData.length} created`);

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const tasksData = [
    // Patient Portal Redesign (prj_1)
    {
      id: "tsk_1", projectId: "prj_1", title: "Design appointment scheduling modal",
      description: "Create mockups for the new appointment booking flow including date picker, provider selection, and confirmation screen.",
      status: "todo" as const, priority: "high" as const, dueDate: new Date("2026-03-12"), position: 0,
    },
    {
      id: "tsk_2", projectId: "prj_1", title: "Write copy for onboarding flow",
      description: "Draft patient-friendly copy for each step of the new user onboarding experience.",
      status: "todo" as const, priority: "medium" as const, dueDate: new Date("2026-03-18"), position: 1,
    },
    {
      id: "tsk_3", projectId: "prj_1", title: "Audit existing color contrast ratios",
      description: "Run WCAG 2.1 AA contrast checks on all current portal components and document failures.",
      status: "todo" as const, priority: "low" as const, dueDate: null, position: 2,
    },
    {
      id: "tsk_4", projectId: "prj_1", title: "Build responsive navigation prototype",
      description: "Develop a working prototype of the new sidebar navigation that collapses on mobile with hamburger menu.",
      status: "in_progress" as const, priority: "high" as const, dueDate: new Date("2026-03-08"), position: 0,
    },
    {
      id: "tsk_5", projectId: "prj_1", title: "Implement patient profile cards",
      description: "Create the patient profile card component showing avatar, name, DOB, and upcoming appointment.",
      status: "in_progress" as const, priority: "medium" as const, dueDate: new Date("2026-03-10"), position: 1,
    },
    {
      id: "tsk_6", projectId: "prj_1", title: "Finalize logo placement and sizing",
      description: "Client needs to approve final logo specs for the portal header area.",
      status: "waiting_on_client" as const, priority: "medium" as const, dueDate: new Date("2026-03-05"), position: 0,
    },
    {
      id: "tsk_7", projectId: "prj_1", title: "Dashboard wireframes — v2",
      description: "Updated dashboard wireframes incorporating client feedback on data visualization priorities.",
      status: "review" as const, priority: "high" as const, dueDate: new Date("2026-03-06"), position: 0,
    },
    {
      id: "tsk_8", projectId: "prj_1", title: "Mobile-responsive table design",
      description: "Table component that collapses to card view on small screens for patient records.",
      status: "review" as const, priority: "medium" as const, dueDate: new Date("2026-03-09"), position: 1,
    },
    {
      id: "tsk_9", projectId: "prj_1", title: "Set up design system tokens",
      description: "Define color palette, typography scale, spacing, and border radius tokens for the patient portal.",
      status: "done" as const, priority: "high" as const, dueDate: new Date("2026-02-28"), position: 0,
    },
    {
      id: "tsk_10", projectId: "prj_1", title: "Competitive analysis document",
      description: "Research and document UX patterns from 5 competing patient portal platforms.",
      status: "done" as const, priority: "medium" as const, dueDate: new Date("2026-02-25"), position: 1,
    },
    // E-Commerce Store Build (prj_2)
    {
      id: "tsk_11", projectId: "prj_2", title: "Product catalog wireframes",
      description: "Design grid and list view layouts for the coffee product catalog with filter sidebar.",
      status: "in_progress" as const, priority: "high" as const, dueDate: new Date("2026-03-05"), position: 0,
    },
    {
      id: "tsk_12", projectId: "prj_2", title: "Shopping cart flow",
      description: "Design the cart summary, quantity adjustment, and checkout CTA flow.",
      status: "in_progress" as const, priority: "high" as const, dueDate: new Date("2026-03-10"), position: 1,
    },
    {
      id: "tsk_13", projectId: "prj_2", title: "Subscription management UI",
      description: "Design the subscription selection, frequency management, and pause/cancel flows.",
      status: "todo" as const, priority: "medium" as const, dueDate: new Date("2026-03-20"), position: 2,
    },
    {
      id: "tsk_14", projectId: "prj_2", title: "Wholesale ordering portal",
      description: "Design the B2B ordering experience for restaurant and cafe accounts.",
      status: "todo" as const, priority: "medium" as const, dueDate: new Date("2026-04-01"), position: 3,
    },
    {
      id: "tsk_15", projectId: "prj_2", title: "Homepage hero and navigation",
      description: "Design the landing page hero section with product highlights and main navigation.",
      status: "done" as const, priority: "high" as const, dueDate: new Date("2026-02-20"), position: 4,
    },
    // Brand Identity Refresh (prj_3 — on hold)
    {
      id: "tsk_16", projectId: "prj_3", title: "Logo refinement concepts",
      description: "Explore 3-5 logo evolution concepts maintaining brand recognition while modernizing.",
      status: "todo" as const, priority: "high" as const, dueDate: null, position: 0,
    },
    {
      id: "tsk_17", projectId: "prj_3", title: "Color palette exploration",
      description: "Develop updated color palettes that work across digital and print applications.",
      status: "in_progress" as const, priority: "medium" as const, dueDate: null, position: 1,
    },
    // Annual Report Design (prj_4)
    {
      id: "tsk_18", projectId: "prj_4", title: "Cover page design",
      description: "Design three cover concepts with brand photography and modern typography.",
      status: "review" as const, priority: "high" as const, dueDate: new Date("2026-03-01"), position: 0,
    },
    {
      id: "tsk_19", projectId: "prj_4", title: "Finalize chart layouts",
      description: "Revenue chart and pie chart adjustments for the financial summary section.",
      status: "in_progress" as const, priority: "high" as const, dueDate: new Date("2026-03-08"), position: 1,
    },
    {
      id: "tsk_20", projectId: "prj_4", title: "Typography and layout review",
      description: "Full pass on section headers, body text styling, and grid alignment.",
      status: "done" as const, priority: "medium" as const, dueDate: new Date("2026-02-23"), position: 2,
    },
    {
      id: "tsk_21", projectId: "prj_4", title: "Infographic design — key metrics",
      description: "Create infographics for AUM growth, client retention, and performance highlights.",
      status: "todo" as const, priority: "high" as const, dueDate: new Date("2026-03-12"), position: 3,
    },
    {
      id: "tsk_22", projectId: "prj_4", title: "Print production files",
      description: "Prepare final print-ready PDFs with bleeds, crop marks, and color profiles.",
      status: "todo" as const, priority: "medium" as const, dueDate: new Date("2026-03-18"), position: 4,
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        id: t.id,
        projectId: t.projectId,
        userId: user.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        position: t.position,
      },
    });
  }
  console.log(`  Tasks: ${tasksData.length} created`);

  // ─── Subtasks ─────────────────────────────────────────────────────────────

  const subtasksData = [
    // tsk_1 — Design appointment scheduling modal
    { taskId: "tsk_1", title: "Wireframe layout options", isCompleted: false, position: 0 },
    { taskId: "tsk_1", title: "Design date picker component", isCompleted: false, position: 1 },
    { taskId: "tsk_1", title: "Create provider card design", isCompleted: false, position: 2 },
    // tsk_3 — Audit existing color contrast ratios
    { taskId: "tsk_3", title: "Check navigation elements", isCompleted: false, position: 0 },
    { taskId: "tsk_3", title: "Check form components", isCompleted: false, position: 1 },
    { taskId: "tsk_3", title: "Check status indicators", isCompleted: false, position: 2 },
    { taskId: "tsk_3", title: "Document results in spreadsheet", isCompleted: false, position: 3 },
    // tsk_4 — Build responsive navigation prototype
    { taskId: "tsk_4", title: "Desktop sidebar layout", isCompleted: true, position: 0 },
    { taskId: "tsk_4", title: "Mobile hamburger menu", isCompleted: true, position: 1 },
    { taskId: "tsk_4", title: "Animation transitions", isCompleted: false, position: 2 },
    { taskId: "tsk_4", title: "Accessibility testing", isCompleted: false, position: 3 },
    // tsk_5 — Implement patient profile cards
    { taskId: "tsk_5", title: "Card layout", isCompleted: true, position: 0 },
    { taskId: "tsk_5", title: "Avatar component", isCompleted: true, position: 1 },
    { taskId: "tsk_5", title: "Data display formatting", isCompleted: false, position: 2 },
    // tsk_7 — Dashboard wireframes v2
    { taskId: "tsk_7", title: "Revise stat card layout", isCompleted: true, position: 0 },
    { taskId: "tsk_7", title: "Add appointment timeline", isCompleted: true, position: 1 },
    { taskId: "tsk_7", title: "Include notification panel", isCompleted: true, position: 2 },
    // tsk_8 — Mobile-responsive table design
    { taskId: "tsk_8", title: "Desktop table layout", isCompleted: true, position: 0 },
    { taskId: "tsk_8", title: "Mobile card view", isCompleted: true, position: 1 },
    // tsk_9 — Set up design system tokens
    { taskId: "tsk_9", title: "Color tokens", isCompleted: true, position: 0 },
    { taskId: "tsk_9", title: "Typography scale", isCompleted: true, position: 1 },
    { taskId: "tsk_9", title: "Spacing system", isCompleted: true, position: 2 },
    { taskId: "tsk_9", title: "Border radius tokens", isCompleted: true, position: 3 },
    { taskId: "tsk_9", title: "Shadow definitions", isCompleted: true, position: 4 },
    // tsk_12 — Shopping cart flow
    { taskId: "tsk_12", title: "Cart summary layout", isCompleted: true, position: 0 },
    { taskId: "tsk_12", title: "Quantity adjustment controls", isCompleted: false, position: 1 },
    { taskId: "tsk_12", title: "Checkout CTA section", isCompleted: false, position: 2 },
    // tsk_18 — Cover page design
    { taskId: "tsk_18", title: "Concept A — Minimalist", isCompleted: true, position: 0 },
    { taskId: "tsk_18", title: "Concept B — Photography-led", isCompleted: true, position: 1 },
    { taskId: "tsk_18", title: "Concept C — Data-driven", isCompleted: true, position: 2 },
  ];

  for (const s of subtasksData) {
    await prisma.subtask.create({ data: s });
  }
  console.log(`  Subtasks: ${subtasksData.length} created`);

  // ─── Task Dependencies ────────────────────────────────────────────────────

  // tsk_2 (onboarding copy) blocked by tsk_9 (design system tokens — done)
  await prisma.taskDependency.create({
    data: { taskId: "tsk_2", blockedByTaskId: "tsk_9" },
  });
  // tsk_22 (print files) blocked by tsk_18 (cover design — in review)
  await prisma.taskDependency.create({
    data: { taskId: "tsk_22", blockedByTaskId: "tsk_18" },
  });
  console.log("  Task Dependencies: 2 created");

  // ─── Time Entries ─────────────────────────────────────────────────────────

  function timeEntry(
    id: string,
    date: string,
    projectId: string,
    taskId: string | null,
    description: string,
    hours: number,
    isBillable: boolean
  ) {
    const startTime = new Date(`${date}T09:00:00-05:00`);
    const durationMinutes = Math.round(hours * 60);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    return {
      id,
      projectId,
      taskId,
      userId: user.id,
      description,
      startTime,
      endTime,
      durationMinutes,
      isBillable,
    };
  }

  const timeEntriesData = [
    timeEntry("te_1", "2026-02-25", "prj_1", "tsk_4", "Worked on hamburger menu animation transitions", 2.25, true),
    timeEntry("te_2", "2026-02-25", "prj_4", "tsk_19", "Revenue chart and pie chart adjustments", 1.5, true),
    timeEntry("te_3", "2026-02-24", "prj_1", "tsk_5", "Data display formatting and avatar component polish", 3.25, true),
    timeEntry("te_4", "2026-02-24", "prj_2", "tsk_11", "Grid layout and filter sidebar design", 2.0, true),
    timeEntry("te_5", "2026-02-24", "prj_1", null, "Weekly sync with development team", 0.5, false),
    timeEntry("te_6", "2026-02-23", "prj_4", "tsk_20", "Full pass on section headers and body text styling", 4.0, true),
    timeEntry("te_7", "2026-02-23", "prj_2", "tsk_12", "Cart summary, quantity adjustment, and checkout CTA", 2.5, true),
    timeEntry("te_8", "2026-02-21", "prj_1", "tsk_7", "Revised stat card layout based on client feedback", 3.0, true),
    timeEntry("te_9", "2026-02-21", "prj_4", "tsk_18", "Three cover concepts with brand photography", 2.75, true),
    timeEntry("te_10", "2026-02-20", "prj_1", "tsk_9", "Color palette, typography, spacing, and border radius tokens", 5.0, true),
    // Additional time entries for fuller history
    timeEntry("te_11", "2026-02-19", "prj_1", "tsk_10", "Competitor analysis — MyChart, FollowMyHealth, Healow", 3.75, true),
    timeEntry("te_12", "2026-02-19", "prj_2", "tsk_15", "Homepage hero section layout and navigation design", 4.0, true),
    timeEntry("te_13", "2026-02-18", "prj_1", "tsk_7", "Initial dashboard wireframes — first pass", 5.0, true),
    timeEntry("te_14", "2026-02-18", "prj_4", "tsk_20", "Typography selection and heading hierarchy", 2.5, true),
    timeEntry("te_15", "2026-02-17", "prj_1", "tsk_4", "Desktop sidebar layout implementation", 4.25, true),
    timeEntry("te_16", "2026-02-17", "prj_3", "tsk_17", "Color palette exploration — moodboard and swatches", 2.0, true),
    timeEntry("te_17", "2026-02-14", "prj_2", "tsk_15", "Navigation patterns research and sketches", 3.0, true),
    timeEntry("te_18", "2026-02-14", "prj_4", "tsk_18", "Cover page concepts — initial sketches", 3.5, true),
    timeEntry("te_19", "2026-02-13", "prj_1", "tsk_6", "Logo sizing options for portal header", 1.75, true),
    timeEntry("te_20", "2026-02-13", "prj_1", null, "Client kickoff meeting — project scope review", 1.0, false),
  ];

  for (const te of timeEntriesData) {
    await prisma.timeEntry.create({ data: te });
  }
  console.log(`  Time Entries: ${timeEntriesData.length} created`);

  // ─── Invoices ─────────────────────────────────────────────────────────────

  // INV-041: Sent to Northstar (Annual Report progress)
  const inv1 = await prisma.invoice.create({
    data: {
      id: "inv_1",
      userId: user.id,
      projectId: "prj_4",
      clientId: "cli_3",
      invoiceNumber: "INV-041",
      status: "sent",
      issuedDate: new Date("2026-02-15"),
      dueDate: new Date("2026-03-17"),
      subtotal: 8500.0,
      taxRate: 0,
      taxAmount: 0,
      total: 8500.0,
      amountPaid: 0,
      balanceDue: 8500.0,
      currency: "USD",
      notes: "Annual report design — progress billing for content layout milestone.",
      paymentInstructions: "Bank transfer to Chase Business XXXX-4821",
      sentAt: new Date("2026-02-15T10:30:00Z"),
      clientName: "Northstar Financial Group",
      clientEmail: "j.whitfield@northstarfg.com",
      clientAddress: "One Financial Plaza, 38th Floor\nNew York, NY 10004",
      projectName: "Annual Report Design",
      fromBusinessName: "Fletcher Design Co.",
      fromAddress: "412 Elm Street, Suite 200\nBrooklyn, NY 11201",
    },
  });

  // INV-040: Overdue from Verde (portfolio website)
  const inv2 = await prisma.invoice.create({
    data: {
      id: "inv_2",
      userId: user.id,
      projectId: null,
      clientId: "cli_4",
      invoiceNumber: "INV-040",
      status: "overdue",
      issuedDate: new Date("2026-02-01"),
      dueDate: new Date("2026-03-03"),
      subtotal: 1800.0,
      taxRate: 0,
      taxAmount: 0,
      total: 1800.0,
      amountPaid: 0,
      balanceDue: 1800.0,
      currency: "USD",
      notes: "Final payment for portfolio website.",
      paymentInstructions: "Bank transfer to Chase Business XXXX-4821",
      sentAt: new Date("2026-02-01T14:00:00Z"),
      clientName: "Verde Landscape Architecture",
      clientEmail: "maria@verdelandscape.com",
      clientAddress: "2200 Pacific Coast Highway\nMalibu, CA 90265",
      projectName: "Portfolio Website",
      fromBusinessName: "Fletcher Design Co.",
      fromAddress: "412 Elm Street, Suite 200\nBrooklyn, NY 11201",
    },
  });

  // INV-039: Partial payment from Meridian
  const inv3 = await prisma.invoice.create({
    data: {
      id: "inv_3",
      userId: user.id,
      projectId: "prj_1",
      clientId: "cli_1",
      invoiceNumber: "INV-039",
      status: "partial",
      issuedDate: new Date("2026-01-28"),
      dueDate: new Date("2026-02-27"),
      subtotal: 4200.0,
      taxRate: 0,
      taxAmount: 0,
      total: 4200.0,
      amountPaid: 2100.0,
      balanceDue: 2100.0,
      currency: "USD",
      notes: "Patient Portal Redesign — January time tracking.",
      paymentInstructions: "Bank transfer to Chase Business XXXX-4821",
      sentAt: new Date("2026-01-28T09:00:00Z"),
      clientName: "Meridian Health Partners",
      clientEmail: "david@meridianhealth.com",
      clientAddress: "1200 Bay Street, Suite 400\nSan Francisco, CA 94133",
      projectName: "Patient Portal Redesign",
      fromBusinessName: "Fletcher Design Co.",
      fromAddress: "412 Elm Street, Suite 200\nBrooklyn, NY 11201",
    },
  });

  // INV-038: Paid by Luminance
  const inv4 = await prisma.invoice.create({
    data: {
      id: "inv_4",
      userId: user.id,
      projectId: "prj_2",
      clientId: "cli_2",
      invoiceNumber: "INV-038",
      status: "paid",
      issuedDate: new Date("2026-01-15"),
      dueDate: new Date("2026-02-14"),
      subtotal: 4800.0,
      taxRate: 0,
      taxAmount: 0,
      total: 4800.0,
      amountPaid: 4800.0,
      balanceDue: 0,
      currency: "USD",
      notes: "E-Commerce Store Build — Discovery & Wireframes milestone + initial design hours.",
      paymentInstructions: "Bank transfer to Chase Business XXXX-4821",
      sentAt: new Date("2026-01-15T11:00:00Z"),
      clientName: "Luminance Coffee Roasters",
      clientEmail: "priya@luminancecoffee.com",
      clientAddress: "850 NW Flanders St\nPortland, OR 97209",
      projectName: "E-Commerce Store Build",
      fromBusinessName: "Fletcher Design Co.",
      fromAddress: "412 Elm Street, Suite 200\nBrooklyn, NY 11201",
    },
  });

  console.log("  Invoices: 4 created");

  // ─── Invoice Line Items ───────────────────────────────────────────────────

  const lineItemsData = [
    // INV-041 line items
    { invoiceId: "inv_1", description: "Content Layout & Structure milestone", quantity: 1, unitPrice: 2500, amount: 2500, type: "milestone" as const, milestoneId: "mst_5", position: 0 },
    { invoiceId: "inv_1", description: "Data visualization design — 40 hours @ $150/hr", quantity: 40, unitPrice: 150, amount: 6000, type: "custom" as const, position: 1 },
    // INV-040 line items
    { invoiceId: "inv_2", description: "Portfolio website — final deliverables", quantity: 1, unitPrice: 1800, amount: 1800, type: "custom" as const, position: 0 },
    // INV-039 line items
    { invoiceId: "inv_3", description: "Patient Portal Redesign — January design hours (33.6h @ $125/hr)", quantity: 33.6, unitPrice: 125, amount: 4200, type: "time_entry" as const, position: 0 },
    // INV-038 line items
    { invoiceId: "inv_4", description: "Discovery & Wireframes milestone", quantity: 1, unitPrice: 3000, amount: 3000, type: "milestone" as const, milestoneId: "mst_1", position: 0 },
    { invoiceId: "inv_4", description: "Initial design hours (15h @ $120/hr)", quantity: 15, unitPrice: 120, amount: 1800, type: "time_entry" as const, position: 1 },
  ];

  for (const li of lineItemsData) {
    await prisma.invoiceLineItem.create({ data: li });
  }
  console.log(`  Invoice Line Items: ${lineItemsData.length} created`);

  // ─── Payments ─────────────────────────────────────────────────────────────

  const paymentsData = [
    // Partial payment on INV-039
    { invoiceId: "inv_3", amount: 2100.0, paymentDate: new Date("2026-02-10"), method: "Bank Transfer", notes: "50% deposit received" },
    // Full payment on INV-038
    { invoiceId: "inv_4", amount: 4800.0, paymentDate: new Date("2026-02-12"), method: "Bank Transfer", notes: "Payment received in full" },
  ];

  for (const p of paymentsData) {
    await prisma.payment.create({ data: p });
  }
  console.log(`  Payments: ${paymentsData.length} created`);

  // ─── File Attachments ─────────────────────────────────────────────────────

  const attachmentsData = [
    { userId: user.id, projectId: "prj_1", taskId: "tsk_1", fileName: "scheduling-modal-reference.png", fileUrl: "/uploads/prj_1/scheduling-modal-reference.png", fileSize: 284000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_4", fileName: "nav-prototype-v1.fig", fileUrl: "/uploads/prj_1/nav-prototype-v1.fig", fileSize: 1520000, mimeType: "application/octet-stream" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_4", fileName: "mobile-nav-recording.mp4", fileUrl: "/uploads/prj_1/mobile-nav-recording.mp4", fileSize: 8400000, mimeType: "video/mp4" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_4", fileName: "sidebar-states.png", fileUrl: "/uploads/prj_1/sidebar-states.png", fileSize: 340000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_5", fileName: "profile-card-mockup.png", fileUrl: "/uploads/prj_1/profile-card-mockup.png", fileSize: 195000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_5", fileName: "avatar-component-spec.pdf", fileUrl: "/uploads/prj_1/avatar-component-spec.pdf", fileSize: 450000, mimeType: "application/pdf" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_6", fileName: "logo-options-v3.png", fileUrl: "/uploads/prj_1/logo-options-v3.png", fileSize: 520000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_6", fileName: "header-measurements.pdf", fileUrl: "/uploads/prj_1/header-measurements.pdf", fileSize: 180000, mimeType: "application/pdf" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_6", fileName: "client-logo-files.zip", fileUrl: "/uploads/prj_1/client-logo-files.zip", fileSize: 2300000, mimeType: "application/zip" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_6", fileName: "brand-guide-excerpt.pdf", fileUrl: "/uploads/prj_1/brand-guide-excerpt.pdf", fileSize: 890000, mimeType: "application/pdf" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_7", fileName: "dashboard-v2-desktop.png", fileUrl: "/uploads/prj_1/dashboard-v2-desktop.png", fileSize: 680000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_7", fileName: "dashboard-v2-mobile.png", fileUrl: "/uploads/prj_1/dashboard-v2-mobile.png", fileSize: 420000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_7", fileName: "dashboard-v2-tablet.png", fileUrl: "/uploads/prj_1/dashboard-v2-tablet.png", fileSize: 510000, mimeType: "image/png" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_7", fileName: "stat-card-iterations.fig", fileUrl: "/uploads/prj_1/stat-card-iterations.fig", fileSize: 780000, mimeType: "application/octet-stream" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_7", fileName: "notification-panel-spec.pdf", fileUrl: "/uploads/prj_1/notification-panel-spec.pdf", fileSize: 290000, mimeType: "application/pdf" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_8", fileName: "responsive-table-demo.mp4", fileUrl: "/uploads/prj_1/responsive-table-demo.mp4", fileSize: 4200000, mimeType: "video/mp4" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_9", fileName: "design-tokens.json", fileUrl: "/uploads/prj_1/design-tokens.json", fileSize: 12000, mimeType: "application/json" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_9", fileName: "color-palette-poster.pdf", fileUrl: "/uploads/prj_1/color-palette-poster.pdf", fileSize: 350000, mimeType: "application/pdf" },
    { userId: user.id, projectId: "prj_1", taskId: "tsk_10", fileName: "competitive-analysis.pdf", fileUrl: "/uploads/prj_1/competitive-analysis.pdf", fileSize: 1800000, mimeType: "application/pdf" },
  ];

  for (const a of attachmentsData) {
    await prisma.fileAttachment.create({ data: a });
  }
  console.log(`  File Attachments: ${attachmentsData.length} created`);

  // ─── Calendar Blocked Times ───────────────────────────────────────────────

  const blockedTimesData = [
    { userId: user.id, title: "Spring Break — Kids off school", startDate: new Date("2026-04-06"), endDate: new Date("2026-04-10") },
    { userId: user.id, title: "Dentist appointment", startDate: new Date("2026-03-12"), endDate: new Date("2026-03-12") },
  ];

  for (const bt of blockedTimesData) {
    await prisma.calendarBlockedTime.create({ data: bt });
  }
  console.log(`  Calendar Blocked Times: ${blockedTimesData.length} created`);

  // ─── Activity Log ─────────────────────────────────────────────────────────

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const activityData = [
    { userId: user.id, entityType: "task", entityId: "tsk_9", action: "status_changed" as const, metadata: { from: "review", to: "done", title: "Set up design system tokens" }, createdAt: hoursAgo(2) },
    { userId: user.id, entityType: "time_entry", entityId: "te_1", action: "created" as const, metadata: { description: "Build responsive navigation prototype", hours: 2.25, project: "Patient Portal Redesign" }, createdAt: hoursAgo(3) },
    { userId: user.id, entityType: "invoice", entityId: "inv_1", action: "status_changed" as const, metadata: { from: "draft", to: "sent", invoiceNumber: "INV-041", client: "Northstar Financial Group" }, createdAt: hoursAgo(24) },
    { userId: user.id, entityType: "task", entityId: "tsk_1", action: "created" as const, metadata: { title: "Design appointment scheduling modal", project: "Patient Portal Redesign" }, createdAt: hoursAgo(26) },
    { userId: user.id, entityType: "invoice", entityId: "inv_4", action: "status_changed" as const, metadata: { from: "sent", to: "paid", invoiceNumber: "INV-038", amount: 4800 }, createdAt: hoursAgo(48) },
    { userId: user.id, entityType: "project", entityId: "prj_3", action: "status_changed" as const, metadata: { from: "active", to: "on_hold", name: "Brand Identity Refresh" }, createdAt: hoursAgo(72) },
    { userId: user.id, entityType: "client", entityId: "cli_5", action: "updated" as const, metadata: { field: "is_archived", value: true, name: "Atlas Education Initiative" }, createdAt: hoursAgo(168) },
    { userId: user.id, entityType: "project", entityId: "prj_2", action: "created" as const, metadata: { name: "E-Commerce Store Build", client: "Luminance Coffee Roasters" }, createdAt: hoursAgo(240) },
    { userId: user.id, entityType: "project", entityId: "prj_4", action: "created" as const, metadata: { name: "Annual Report Design", client: "Northstar Financial Group" }, createdAt: hoursAgo(336) },
    { userId: user.id, entityType: "client", entityId: "cli_4", action: "created" as const, metadata: { name: "Verde Landscape Architecture" }, createdAt: hoursAgo(480) },
  ];

  for (const a of activityData) {
    await prisma.activityLog.create({ data: a });
  }
  console.log(`  Activity Logs: ${activityData.length} created`);

  // ─── Notifications ────────────────────────────────────────────────────────

  const notificationsData = [
    {
      userId: user.id, type: "deadline_reminder" as const, title: "Deadline approaching",
      message: "Annual Report Design deadline is in 3 weeks (Mar 20).",
      referenceType: "project" as const, referenceId: "prj_4",
      isRead: false, channel: "in_app" as const, createdAt: hoursAgo(4),
    },
    {
      userId: user.id, type: "overdue_invoice" as const, title: "Invoice overdue",
      message: "INV-040 to Verde Landscape Architecture is past due ($1,800.00).",
      referenceType: "invoice" as const, referenceId: "inv_2",
      isRead: false, channel: "in_app" as const, createdAt: hoursAgo(12),
    },
    {
      userId: user.id, type: "budget_alert" as const, title: "Budget alert",
      message: "Annual Report Design has used 80% of budgeted hours (48 of 60 hours).",
      referenceType: "project" as const, referenceId: "prj_4",
      isRead: true, channel: "in_app" as const, createdAt: hoursAgo(48),
    },
    {
      userId: user.id, type: "deadline_reminder" as const, title: "Task due soon",
      message: "\"Finalize logo placement and sizing\" is due tomorrow (Mar 5).",
      referenceType: "task" as const, referenceId: "tsk_6",
      isRead: false, channel: "in_app" as const, createdAt: hoursAgo(6),
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  Notifications: ${notificationsData.length} created`);

  // ─── Project Template ─────────────────────────────────────────────────────

  await prisma.projectTemplate.create({
    data: {
      userId: user.id,
      name: "Standard Website Redesign",
      description: "Template for typical client website redesign projects",
      templateData: {
        tasks: [
          { title: "Discovery & Research", status: "todo", priority: "high", subtasks: ["Stakeholder interviews", "Competitive analysis", "User research synthesis"] },
          { title: "Information Architecture", status: "todo", priority: "high", subtasks: ["Sitemap", "User flows", "Content audit"] },
          { title: "Wireframes", status: "todo", priority: "high", subtasks: ["Low-fidelity wireframes", "Mid-fidelity wireframes", "Client review"] },
          { title: "Visual Design", status: "todo", priority: "medium", subtasks: ["Moodboard", "Style tiles", "High-fidelity mockups"] },
          { title: "Prototyping", status: "todo", priority: "medium", subtasks: ["Interactive prototype", "Usability testing"] },
          { title: "Development Handoff", status: "todo", priority: "medium", subtasks: ["Design specs", "Asset export", "Developer walkthrough"] },
          { title: "QA & Launch", status: "todo", priority: "high", subtasks: ["Cross-browser testing", "Accessibility audit", "Final sign-off"] },
        ],
      },
    },
  });
  console.log("  Project Templates: 1 created");

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log("\nSeed complete! Summary:");
  console.log("  1 user (Sarah Fletcher)");
  console.log("  1 business profile");
  console.log("  5 clients (4 active, 1 archived)");
  console.log("  4 projects (2 active, 1 on_hold, 1 active — close to deadline)");
  console.log("  7 milestones");
  console.log("  22 tasks across all statuses");
  console.log("  30 subtasks");
  console.log("  2 task dependencies");
  console.log("  20 time entries");
  console.log("  4 invoices (sent, overdue, partial, paid)");
  console.log("  6 invoice line items");
  console.log("  2 payments");
  console.log("  19 file attachments");
  console.log("  2 calendar blocked times");
  console.log("  10 activity log entries");
  console.log("  4 notifications");
  console.log("  1 project template");
  console.log("  1 notification preference\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
