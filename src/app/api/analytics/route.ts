import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// Stable color palette for clients/projects
const COLORS = [
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#8B5CF6",
  "#EF4444",
  "#0EA5E9",
  "#84CC16",
];

function getStartDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case "3m": {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d;
    }
    case "1y": {
      const d = new Date(now.getFullYear(), 0, 1);
      return d;
    }
    case "6m":
    default: {
      const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return d;
    }
  }
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Monday start
  const mon = new Date(now);
  mon.setDate(mon.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * GET /api/analytics?range=6m|3m|1y
 *
 * Returns all analytics data computed from real database records,
 * scoped entirely to the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const range = req.nextUrl.searchParams.get("range") || "6m";
    const rangeStart = getStartDate(range);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = getWeekStart();

    // ── Parallel queries ──────────────────────────────────────────────

    const [
      timeEntriesInRange,
      timeEntriesThisMonth,
      timeEntriesThisWeek,
      activeClientCount,
      activeProjects,
    ] = await Promise.all([
      // All billable time entries in range with project+client info
      db.timeEntry.findMany({
        where: {
          userId: auth.userId,
          startTime: { gte: rangeStart },
        },
        select: {
          durationMinutes: true,
          isBillable: true,
          startTime: true,
          project: {
            select: {
              id: true,
              name: true,
              hourlyRate: true,
              budgetHours: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),

      // Time entries this month (for summary cards)
      db.timeEntry.findMany({
        where: {
          userId: auth.userId,
          startTime: { gte: monthStart },
        },
        select: { durationMinutes: true, isBillable: true },
      }),

      // Time entries this week (for weekly hours chart)
      db.timeEntry.findMany({
        where: {
          userId: auth.userId,
          startTime: { gte: weekStart },
        },
        select: { durationMinutes: true, startTime: true },
      }),

      // Active clients count
      db.client.count({
        where: { userId: auth.userId, isArchived: false },
      }),

      // Active projects with budget info
      db.project.findMany({
        where: { userId: auth.userId, status: "active" },
        select: {
          id: true,
          name: true,
          budgetHours: true,
          hourlyRate: true,
        },
      }),
    ]);

    // ── Revenue by Month ──────────────────────────────────────────────

    const monthBuckets: Record<string, { revenue: number; hours: number }> = {};

    // Initialize all months in range
    const cursor = new Date(rangeStart);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[key] = { revenue: 0, hours: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const entry of timeEntriesInRange) {
      const d = new Date(entry.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthBuckets[key]) continue;

      const hours = entry.durationMinutes / 60;
      monthBuckets[key].hours += hours;

      if (entry.isBillable && entry.project.hourlyRate) {
        monthBuckets[key].revenue +=
          hours * Number(entry.project.hourlyRate);
      }
    }

    const revenueByMonth = Object.entries(monthBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [year, month] = key.split("-");
        const d = new Date(Number(year), Number(month) - 1, 1);
        return {
          month: getMonthLabel(d),
          revenue: Math.round(val.revenue),
          hours: Math.round(val.hours * 10) / 10,
        };
      });

    // ── Revenue by Client ─────────────────────────────────────────────

    const clientRevMap: Record<string, { name: string; value: number }> = {};
    for (const entry of timeEntriesInRange) {
      if (!entry.isBillable || !entry.project.hourlyRate) continue;
      const cId = entry.project.client.id;
      if (!clientRevMap[cId]) {
        clientRevMap[cId] = {
          name: entry.project.client.name,
          value: 0,
        };
      }
      clientRevMap[cId].value +=
        (entry.durationMinutes / 60) * Number(entry.project.hourlyRate);
    }

    const revenueByClient = Object.values(clientRevMap)
      .sort((a, b) => b.value - a.value)
      .map((c, i) => ({
        name: c.name,
        value: Math.round(c.value),
        color: COLORS[i % COLORS.length],
      }));

    // ── Summary Cards ─────────────────────────────────────────────────

    const totalRevenue = revenueByMonth.reduce((s, m) => s + m.revenue, 0);
    const nonZeroMonths = revenueByMonth.filter((m) => m.revenue > 0).length;
    const avgMonthlyRevenue =
      nonZeroMonths > 0 ? Math.round(totalRevenue / nonZeroMonths) : 0;

    const hoursThisMonth =
      Math.round(
        timeEntriesThisMonth.reduce(
          (s: number, e: { durationMinutes: number }) =>
            s + e.durationMinutes,
          0
        ) / 6
      ) / 10; // to 1 decimal
    const billableHoursThisMonth =
      Math.round(
        timeEntriesThisMonth
          .filter((e: { isBillable: boolean }) => e.isBillable)
          .reduce(
            (s: number, e: { durationMinutes: number }) =>
              s + e.durationMinutes,
            0
          ) / 6
      ) / 10;

    // ── Weekly Hours by Day ───────────────────────────────────────────

    const dayBuckets: Record<number, number> = {};
    for (let i = 0; i < 7; i++) dayBuckets[i] = 0;

    for (const entry of timeEntriesThisWeek) {
      const d = new Date(entry.startTime);
      let dayIdx = d.getDay() - 1; // Mon=0
      if (dayIdx < 0) dayIdx = 6; // Sun=6
      dayBuckets[dayIdx] += entry.durationMinutes / 60;
    }

    const weeklyHours = DAY_LABELS.map((label, i) => ({
      day: label,
      hours: Math.round(dayBuckets[i] * 10) / 10,
    }));

    // ── Project Budget Utilization ────────────────────────────────────

    // Gather actual hours per project from all time entries (not just range)
    const projectHoursUsed: Record<string, number> = {};
    for (const entry of timeEntriesInRange) {
      const pId = entry.project.id;
      if (!projectHoursUsed[pId]) projectHoursUsed[pId] = 0;
      projectHoursUsed[pId] += entry.durationMinutes / 60;
    }

    const projectBudgets = activeProjects
      .filter(
        (p: { budgetHours: number | null }) =>
          p.budgetHours && p.budgetHours > 0
      )
      .map((p: { id: string; name: string; budgetHours: number | null }) => {
        const used = Math.round((projectHoursUsed[p.id] || 0) * 10) / 10;
        const budget = p.budgetHours!;
        return {
          name: p.name,
          budget,
          used,
          percentage: Math.round((used / budget) * 100),
        };
      })
      .sort(
        (a: { percentage: number }, b: { percentage: number }) =>
          b.percentage - a.percentage
      );

    // ── Check if there's any data at all ──────────────────────────────

    const hasData = timeEntriesInRange.length > 0 || activeProjects.length > 0;

    return NextResponse.json({
      hasData,
      summary: {
        totalRevenue,
        avgMonthlyRevenue,
        hoursThisMonth,
        billableHoursThisMonth,
        activeClients: activeClientCount,
      },
      revenueByMonth,
      revenueByClient,
      weeklyHours,
      projectBudgets,
    });
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json(
      { error: "Failed to load analytics." },
      { status: 500 }
    );
  }
}
