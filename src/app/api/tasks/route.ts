import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
  priority: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  sort: z.enum(["dueDate", "priority", "status", "project", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * GET /api/tasks — Cross-project task list
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

    if (params.search) {
      where.title = { contains: params.search, mode: "insensitive" };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.dueBefore || params.dueAfter) {
      where.dueDate = {};
      if (params.dueBefore) where.dueDate.lte = new Date(params.dueBefore);
      if (params.dueAfter) where.dueDate.gte = new Date(params.dueAfter);
    }

    // Determine sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: params.order };
    if (params.sort === "dueDate") {
      orderBy = { dueDate: params.order };
    } else if (params.sort === "status") {
      orderBy = { status: params.order };
    } else if (params.sort === "project") {
      orderBy = { project: { name: params.order } };
    }

    const totalCount = await db.task.count({ where });

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
        subtasks: { select: { id: true, isCompleted: true } },
        _count: { select: { comments: true, timeEntries: true } },
      },
      orderBy,
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    // Get total minutes per task
    const taskIds = tasks.map((t) => t.id);
    const timeAgg = await db.timeEntry.groupBy({
      by: ["taskId"],
      where: { taskId: { in: taskIds } },
      _sum: { durationMinutes: true },
    });
    const minutesByTask = new Map(
      timeAgg.map((a) => [a.taskId, a._sum.durationMinutes || 0])
    );

    const hasMore = tasks.length > params.limit;
    const items = hasMore ? tasks.slice(0, params.limit) : tasks;

    // Sort by priority if requested (since Prisma doesn't support custom enum ordering)
    let enriched = items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      position: t.position,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      projectId: t.projectId,
      project: t.project,
      subtasks: t.subtasks,
      totalMinutes: minutesByTask.get(t.id) || 0,
      commentCount: t._count.comments,
      timeEntryCount: t._count.timeEntries,
    }));

    if (params.sort === "priority") {
      enriched = enriched.sort((a, b) => {
        const aOrd = priorityOrder[a.priority] ?? 99;
        const bOrd = priorityOrder[b.priority] ?? 99;
        return params.order === "asc" ? aOrd - bOrd : bOrd - aOrd;
      });
    }

    return NextResponse.json({
      data: enriched,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
      totalCount,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", errors: err.issues },
        { status: 400 }
      );
    }
    console.error("GET /api/tasks error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}
