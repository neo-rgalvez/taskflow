import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskPositionSchema } from "@/lib/validations/task";

/**
 * PATCH /api/tasks/[id]/position — Reorder a task (drag-and-drop)
 * Updates both status and position atomically.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTaskPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { status, position, updatedAt: clientUpdatedAt } = parsed.data;

  // Optimistic locking: only update if updatedAt matches
  const result = await db.task.updateMany({
    where: {
      id: params.id,
      userId: auth.userId,
      updatedAt: new Date(clientUpdatedAt),
    },
    data: { status, position },
  });

  if (result.count === 0) {
    const exists = await db.task.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: "Conflict: this record was modified. Please reload and try again.",
        current: exists,
      },
      { status: 409 }
    );
  }

  const updated = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      subtasks: { orderBy: { position: "asc" } },
      _count: { select: { comments: true, timeEntries: true } },
    },
  });

  // Compute total time so board cards show correct duration
  const timeAgg = await db.timeEntry.aggregate({
    where: { taskId: params.id },
    _sum: { durationMinutes: true },
  });

  return NextResponse.json({
    ...updated,
    totalMinutes: timeAgg._sum.durationMinutes || 0,
    commentCount: updated?._count.comments || 0,
    timeEntryCount: updated?._count.timeEntries || 0,
  });
}
