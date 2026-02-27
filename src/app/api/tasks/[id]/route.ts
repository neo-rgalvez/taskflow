import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations/task";

/**
 * GET /api/tasks/[id] — Get a single task with all related data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const task = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      subtasks: { orderBy: { position: "asc" } },
      comments: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      timeEntries: {
        orderBy: { startTime: "desc" },
      },
      project: {
        select: { id: true, name: true, hourlyRate: true, billingType: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const totalMinutes = task.timeEntries.reduce(
    (sum, te) => sum + te.durationMinutes,
    0
  );

  return NextResponse.json({ ...task, totalMinutes });
}

/**
 * PATCH /api/tasks/[id] — Update a task (with optimistic locking)
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

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { updatedAt: clientUpdatedAt, ...updateData } = parsed.data;

  // Build update payload
  const updatePayload: Record<string, unknown> = {};
  if (updateData.title !== undefined) updatePayload.title = updateData.title;
  if (updateData.description !== undefined)
    updatePayload.description = updateData.description;
  if (updateData.status !== undefined) updatePayload.status = updateData.status;
  if (updateData.priority !== undefined)
    updatePayload.priority = updateData.priority;
  if (updateData.dueDate !== undefined)
    updatePayload.dueDate = updateData.dueDate
      ? new Date(updateData.dueDate)
      : null;
  if (updateData.position !== undefined)
    updatePayload.position = updateData.position;

  // Optimistic locking
  const result = await db.task.updateMany({
    where: {
      id: params.id,
      userId: auth.userId,
      updatedAt: new Date(clientUpdatedAt),
    },
    data: updatePayload,
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
        error:
          "Conflict: this record was modified. Please reload and try again.",
        current: exists,
      },
      { status: 409 }
    );
  }

  // Re-fetch the updated task with relations
  const updated = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      subtasks: { orderBy: { position: "asc" } },
      _count: { select: { comments: true, timeEntries: true } },
    },
  });

  // Compute total time
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

/**
 * DELETE /api/tasks/[id] — Delete a task
 * Cascades: subtasks, comments deleted.
 * Time entries preserved (task_id set to null via onDelete: SetNull).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const task = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      _count: { select: { timeEntries: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Time entries will have taskId set to null via onDelete: SetNull (preserved, not deleted)
  await db.task.delete({ where: { id: params.id } });

  return NextResponse.json({
    success: true,
    orphanedTimeEntries: task._count.timeEntries,
  });
}
