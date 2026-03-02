import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  projectId: z.string().optional(),
  billable: z.enum(["true", "false"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /api/time-entries — All user time entries
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const params = querySchema.parse(raw);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: auth.userId };

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.billable !== undefined) {
      where.isBillable = params.billable === "true";
    }

    if (params.dateFrom || params.dateTo) {
      where.startTime = {};
      if (params.dateFrom) where.startTime.gte = new Date(params.dateFrom);
      if (params.dateTo) where.startTime.lte = new Date(params.dateTo);
    }

    const totalCount = await db.timeEntry.count({ where });

    const entries = await db.timeEntry.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            client: { select: { id: true, name: true } },
          },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { startTime: "desc" },
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = entries.length > params.limit;
    const items = hasMore ? entries.slice(0, params.limit) : entries;

    // Aggregate totals
    const totals = await db.timeEntry.aggregate({
      where,
      _sum: { durationMinutes: true },
    });

    const billableTotals = await db.timeEntry.aggregate({
      where: { ...where, isBillable: true },
      _sum: { durationMinutes: true },
    });

    return NextResponse.json({
      data: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
      totalCount,
      totalMinutes: totals._sum.durationMinutes || 0,
      billableMinutes: billableTotals._sum.durationMinutes || 0,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", errors: err.issues },
        { status: 400 }
      );
    }
    console.error("GET /api/time-entries error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}
