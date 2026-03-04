import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/settings/export — GDPR data export
 *
 * Returns a JSON archive of all user-owned data:
 * clients, projects, tasks (with subtasks), time entries, comments,
 * notifications, and notification preferences.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;

    const [
      user,
      clients,
      projects,
      tasks,
      timeEntries,
      comments,
      notifications,
      notificationPreference,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          timezone: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.client.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      db.project.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      db.task.findMany({
        where: { userId },
        include: { subtasks: true },
        orderBy: { createdAt: "asc" },
      }),
      db.timeEntry.findMany({
        where: { userId },
        orderBy: { startTime: "asc" },
      }),
      db.comment.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      db.notificationPreference.findUnique({
        where: { userId },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      clients,
      projects,
      tasks,
      timeEntries,
      comments,
      notifications,
      notificationPreference,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="taskflow-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("GET /api/settings/export error:", err);
    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 }
    );
  }
}
