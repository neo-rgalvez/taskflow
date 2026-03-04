import { db } from "@/lib/db";

/**
 * Create an in-app notification for a user, respecting their preferences.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  referenceType,
  referenceId,
}: {
  userId: string;
  type: "deadline_reminder" | "budget_alert" | "overdue_invoice" | "time_tracking_reminder";
  title: string;
  message: string;
  referenceType?: "task" | "project" | "invoice";
  referenceId?: string;
}) {
  // Check user preferences
  const prefs = await db.notificationPreference.findUnique({
    where: { userId },
  });

  // If preferences exist, check if this type is enabled
  if (prefs) {
    if (!prefs.inAppChannelEnabled) return null;
    if (type === "deadline_reminder" && !prefs.deadlineRemindersEnabled) return null;
    if (type === "budget_alert" && !prefs.budgetAlertsEnabled) return null;
    if (type === "overdue_invoice" && !prefs.overdueInvoiceRemindersEnabled) return null;
    if (type === "time_tracking_reminder" && !prefs.timeTrackingRemindersEnabled) return null;
  }

  return db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      channel: "in_app",
    },
  });
}

/**
 * Check if a project has exceeded its budget threshold and create an alert.
 * Call this after a time entry is created/updated.
 */
export async function checkBudgetAlert(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true } },
      timeEntries: {
        select: { durationMinutes: true },
      },
    },
  });

  if (!project || !project.budgetHours) return;

  const totalMinutes = project.timeEntries.reduce(
    (sum, te) => sum + te.durationMinutes,
    0
  );
  const totalHours = totalMinutes / 60;
  const budgetUsedRatio = totalHours / project.budgetHours;
  const threshold = Number(project.budgetAlertThreshold);

  if (budgetUsedRatio >= threshold) {
    const percentUsed = Math.round(budgetUsedRatio * 100);

    // Avoid duplicate alerts — check if we already sent one for this threshold level
    const existing = await db.notification.findFirst({
      where: {
        userId: project.userId,
        type: "budget_alert",
        referenceType: "project",
        referenceId: project.id,
        createdAt: {
          // Only check within the last 24 hours
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!existing) {
      await createNotification({
        userId: project.userId,
        type: "budget_alert",
        title: "Budget alert",
        message: `${project.name}${project.client ? ` for ${project.client.name}` : ""} is at ${percentUsed}% of its hourly budget.`,
        referenceType: "project",
        referenceId: project.id,
      });
    }
  }
}

/**
 * Check for approaching deadlines on tasks and projects.
 * Intended to be called periodically (e.g., daily cron job or on page load).
 */
export async function checkDeadlineReminders(userId: string) {
  const prefs = await db.notificationPreference.findUnique({
    where: { userId },
  });

  if (prefs && !prefs.deadlineRemindersEnabled) return;

  const reminderDays = prefs?.deadlineReminderDays ?? 3;
  const now = new Date();
  const deadlineThreshold = new Date(
    now.getTime() + reminderDays * 24 * 60 * 60 * 1000
  );

  // Check tasks with approaching due dates
  const tasks = await db.task.findMany({
    where: {
      userId,
      dueDate: {
        gte: now,
        lte: deadlineThreshold,
      },
      status: { notIn: ["done"] },
    },
    include: {
      project: {
        select: { name: true, client: { select: { name: true } } },
      },
    },
  });

  for (const task of tasks) {
    // Avoid duplicates within last 24h
    const existing = await db.notification.findFirst({
      where: {
        userId,
        type: "deadline_reminder",
        referenceType: "task",
        referenceId: task.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing && task.dueDate) {
      const daysLeft = Math.ceil(
        (task.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      const clientInfo = task.project.client?.name
        ? ` for ${task.project.client.name}`
        : "";

      await createNotification({
        userId,
        type: "deadline_reminder",
        title: "Deadline approaching",
        message: `${task.title}${clientInfo} is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
        referenceType: "task",
        referenceId: task.id,
      });
    }
  }

  // Check projects with approaching deadlines
  const projects = await db.project.findMany({
    where: {
      userId,
      deadline: {
        gte: now,
        lte: deadlineThreshold,
      },
      status: { notIn: ["completed", "cancelled"] },
    },
    include: {
      client: { select: { name: true } },
    },
  });

  for (const project of projects) {
    const existing = await db.notification.findFirst({
      where: {
        userId,
        type: "deadline_reminder",
        referenceType: "project",
        referenceId: project.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing && project.deadline) {
      const daysLeft = Math.ceil(
        (project.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      const clientInfo = project.client?.name
        ? ` for ${project.client.name}`
        : "";

      await createNotification({
        userId,
        type: "deadline_reminder",
        title: "Deadline approaching",
        message: `${project.name}${clientInfo} is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
        referenceType: "project",
        referenceId: project.id,
      });
    }
  }
}
