import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/stats — Dashboard summary stats
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Calculate start of current week (Monday)
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const [totalClients, activeProjects, hoursThisWeekResult, totalTasks, upcomingDeadlines] = await Promise.all([
    db.client.count({
      where: { userId: auth.userId, isArchived: false },
    }),
    db.project.count({
      where: { userId: auth.userId, status: "active" },
    }),
    db.timeEntry.aggregate({
      where: {
        userId: auth.userId,
        startTime: { gte: weekStart },
      },
      _sum: { durationMinutes: true },
    }),
    db.task.count({
      where: { userId: auth.userId },
    }),
    db.task.count({
      where: {
        userId: auth.userId,
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { not: "done" },
      },
    }),
  ]);

  const totalMinutesThisWeek = hoursThisWeekResult._sum.durationMinutes || 0;
  const hoursThisWeek = Math.round((totalMinutesThisWeek / 60) * 10) / 10;

  // Also get billable hours this week
  const billableResult = await db.timeEntry.aggregate({
    where: {
      userId: auth.userId,
      startTime: { gte: weekStart },
      isBillable: true,
    },
    _sum: { durationMinutes: true },
  });

  const billableMinutes = billableResult._sum.durationMinutes || 0;
  const billableHours = Math.round((billableMinutes / 60) * 10) / 10;

  return NextResponse.json({
    totalClients,
    activeProjects,
    hoursThisWeek,
    billableHours,
    totalTasks,
    upcomingDeadlines,
  });
}
