import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create or update the dev user with a known password
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "sarah@fletcherdesign.co" },
    update: { passwordHash },
    create: {
      id: "dev_user_1",
      email: "sarah@fletcherdesign.co",
      name: "Sarah Fletcher",
      passwordHash,
      emailVerified: true,
      timezone: "America/New_York",
    },
  });

  console.log("Seeded dev user: sarah@fletcherdesign.co / password123");

  // Upsert clients
  const client1 = await prisma.client.upsert({
    where: { id: "cli_1" },
    update: {},
    create: {
      id: "cli_1",
      userId: user.id,
      name: "Meridian Health Partners",
      contactName: "David Chen",
      email: "david@meridianhealth.com",
      phone: "(415) 555-0182",
      defaultHourlyRate: 125,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: "cli_2" },
    update: {},
    create: {
      id: "cli_2",
      userId: user.id,
      name: "Luminance Coffee Roasters",
      contactName: "Priya Sharma",
      email: "priya@luminancecoffee.com",
      phone: "(503) 555-0219",
      defaultHourlyRate: 110,
    },
  });

  console.log(`Seeded clients: ${client1.name}, ${client2.name}`);

  // Upsert projects
  const project1 = await prisma.project.upsert({
    where: { id: "prj_1" },
    update: {},
    create: {
      id: "prj_1",
      userId: user.id,
      clientId: client1.id,
      name: "Patient Portal Redesign",
      description: "Complete redesign of the patient-facing portal with modern UX patterns.",
      status: "active",
      billingType: "hourly",
      hourlyRate: 125,
      budgetHours: 80,
      deadline: new Date("2026-04-15"),
    },
  });

  console.log(`Seeded project: ${project1.name}`);

  // Seed tasks
  const tasksData = [
    {
      id: "tsk_1",
      title: "Design appointment scheduling modal",
      description: "Create mockups for the new appointment booking flow including date picker, provider selection, and confirmation screen.",
      status: "todo",
      priority: "high",
      dueDate: new Date("2026-03-12"),
      position: 0,
    },
    {
      id: "tsk_2",
      title: "Write copy for onboarding flow",
      description: "Draft patient-friendly copy for each step of the new user onboarding experience.",
      status: "todo",
      priority: "medium",
      dueDate: new Date("2026-03-18"),
      position: 1,
    },
    {
      id: "tsk_3",
      title: "Audit existing color contrast ratios",
      description: "Run WCAG 2.1 AA contrast checks on all current portal components and document failures.",
      status: "todo",
      priority: "low",
      dueDate: null,
      position: 2,
    },
    {
      id: "tsk_4",
      title: "Build responsive navigation prototype",
      description: "Develop a working prototype of the new sidebar navigation that collapses on mobile with hamburger menu.",
      status: "in_progress",
      priority: "high",
      dueDate: new Date("2026-03-08"),
      position: 0,
    },
    {
      id: "tsk_5",
      title: "Implement patient profile cards",
      description: "Create the patient profile card component showing avatar, name, DOB, and upcoming appointment.",
      status: "in_progress",
      priority: "medium",
      dueDate: new Date("2026-03-10"),
      position: 1,
    },
    {
      id: "tsk_6",
      title: "Finalize logo placement and sizing",
      description: "Client needs to approve final logo specs for the portal header area.",
      status: "waiting_on_client",
      priority: "medium",
      dueDate: new Date("2026-03-05"),
      position: 0,
    },
    {
      id: "tsk_7",
      title: "Dashboard wireframes — v2",
      description: "Updated dashboard wireframes incorporating client feedback on data visualization priorities.",
      status: "review",
      priority: "high",
      dueDate: new Date("2026-03-06"),
      position: 0,
    },
    {
      id: "tsk_8",
      title: "Mobile-responsive table design",
      description: "Table component that collapses to card view on small screens for patient records.",
      status: "review",
      priority: "medium",
      dueDate: new Date("2026-03-09"),
      position: 1,
    },
    {
      id: "tsk_9",
      title: "Set up design system tokens",
      description: "Define color palette, typography scale, spacing, and border radius tokens for the patient portal.",
      status: "done",
      priority: "high",
      dueDate: new Date("2026-02-28"),
      position: 0,
    },
    {
      id: "tsk_10",
      title: "Competitive analysis document",
      description: "Research and document UX patterns from 5 competing patient portal platforms.",
      status: "done",
      priority: "medium",
      dueDate: new Date("2026-02-25"),
      position: 1,
    },
  ];

  for (const t of tasksData) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        projectId: project1.id,
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

  console.log(`Seeded ${tasksData.length} tasks`);

  // Seed subtasks
  const subtasksData = [
    { id: "st_1", taskId: "tsk_1", title: "Wireframe layout options", isCompleted: false, position: 0 },
    { id: "st_2", taskId: "tsk_1", title: "Design date picker component", isCompleted: false, position: 1 },
    { id: "st_3", taskId: "tsk_1", title: "Create provider card design", isCompleted: false, position: 2 },
    { id: "st_4", taskId: "tsk_3", title: "Check navigation elements", isCompleted: false, position: 0 },
    { id: "st_5", taskId: "tsk_3", title: "Check form components", isCompleted: false, position: 1 },
    { id: "st_6", taskId: "tsk_3", title: "Check status indicators", isCompleted: false, position: 2 },
    { id: "st_7", taskId: "tsk_3", title: "Document results in spreadsheet", isCompleted: false, position: 3 },
    { id: "st_8", taskId: "tsk_4", title: "Desktop sidebar layout", isCompleted: true, position: 0 },
    { id: "st_9", taskId: "tsk_4", title: "Mobile hamburger menu", isCompleted: true, position: 1 },
    { id: "st_10", taskId: "tsk_4", title: "Animation transitions", isCompleted: false, position: 2 },
    { id: "st_11", taskId: "tsk_4", title: "Accessibility testing", isCompleted: false, position: 3 },
    { id: "st_12", taskId: "tsk_5", title: "Card layout", isCompleted: true, position: 0 },
    { id: "st_13", taskId: "tsk_5", title: "Avatar component", isCompleted: true, position: 1 },
    { id: "st_14", taskId: "tsk_5", title: "Data display formatting", isCompleted: false, position: 2 },
    { id: "st_15", taskId: "tsk_7", title: "Revise stat card layout", isCompleted: true, position: 0 },
    { id: "st_16", taskId: "tsk_7", title: "Add appointment timeline", isCompleted: true, position: 1 },
    { id: "st_17", taskId: "tsk_7", title: "Include notification panel", isCompleted: true, position: 2 },
    { id: "st_18", taskId: "tsk_8", title: "Desktop table layout", isCompleted: true, position: 0 },
    { id: "st_19", taskId: "tsk_8", title: "Mobile card view", isCompleted: true, position: 1 },
    { id: "st_20", taskId: "tsk_9", title: "Color tokens", isCompleted: true, position: 0 },
    { id: "st_21", taskId: "tsk_9", title: "Typography scale", isCompleted: true, position: 1 },
    { id: "st_22", taskId: "tsk_9", title: "Spacing system", isCompleted: true, position: 2 },
    { id: "st_23", taskId: "tsk_9", title: "Border radius tokens", isCompleted: true, position: 3 },
    { id: "st_24", taskId: "tsk_9", title: "Shadow definitions", isCompleted: true, position: 4 },
  ];

  for (const s of subtasksData) {
    await prisma.subtask.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  console.log(`Seeded ${subtasksData.length} subtasks`);

  // Seed time entries
  const timeEntriesData = [
    { id: "te_1", projectId: project1.id, taskId: "tsk_4", description: "Worked on hamburger menu animation transitions", startTime: new Date("2026-02-25T09:00:00"), endTime: new Date("2026-02-25T15:30:00"), durationMinutes: 390 },
    { id: "te_2", projectId: project1.id, taskId: "tsk_5", description: "Data display formatting and avatar component polish", startTime: new Date("2026-02-24T10:00:00"), endTime: new Date("2026-02-24T13:15:00"), durationMinutes: 195 },
    { id: "te_3", projectId: project1.id, taskId: "tsk_6", description: "Initial logo specs discussion", startTime: new Date("2026-02-23T14:00:00"), endTime: new Date("2026-02-23T15:45:00"), durationMinutes: 105 },
    { id: "te_4", projectId: project1.id, taskId: "tsk_7", description: "Revised stat card layout based on client feedback", startTime: new Date("2026-02-21T09:00:00"), endTime: new Date("2026-02-21T17:20:00"), durationMinutes: 500 },
    { id: "te_5", projectId: project1.id, taskId: "tsk_8", description: "Desktop and mobile layout work", startTime: new Date("2026-02-20T10:00:00"), endTime: new Date("2026-02-20T14:10:00"), durationMinutes: 250 },
    { id: "te_6", projectId: project1.id, taskId: "tsk_9", description: "Color palette, typography, spacing, and border radius tokens", startTime: new Date("2026-02-19T09:00:00"), endTime: new Date("2026-02-19T14:00:00"), durationMinutes: 300 },
    { id: "te_7", projectId: project1.id, taskId: "tsk_10", description: "Research competing patient portal platforms", startTime: new Date("2026-02-18T09:00:00"), endTime: new Date("2026-02-18T12:45:00"), durationMinutes: 225 },
  ];

  for (const te of timeEntriesData) {
    await prisma.timeEntry.upsert({
      where: { id: te.id },
      update: {},
      create: {
        ...te,
        userId: user.id,
        isBillable: true,
      },
    });
  }

  console.log(`Seeded ${timeEntriesData.length} time entries`);

  // Seed comments
  const commentsData = [
    { id: "cmt_1", taskId: "tsk_4", content: "Client prefers the two-column layout for the dashboard. Let's go with option B from the mockups." },
    { id: "cmt_2", taskId: "tsk_4", content: "Need to check WCAG contrast ratios on the navigation before finalizing colors." },
    { id: "cmt_3", taskId: "tsk_7", content: "Dashboard wireframe v2 looks great - the appointment timeline is a nice touch." },
  ];

  for (const c of commentsData) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: {},
      create: {
        ...c,
        userId: user.id,
      },
    });
  }

  console.log(`Seeded ${commentsData.length} comments`);
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
