import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTimeEntrySchema } from "@/lib/validations/task";

/**
 * GET /api/tasks/[id]/time-entries — Get time entries for a task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const task = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    select: { id: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const entries = await db.timeEntry.findMany({
    where: { taskId: params.id, userId: auth.userId },
    orderBy: { startTime: "desc" },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

  return NextResponse.json({ data: entries, totalMinutes });
}

/**
 * POST /api/tasks/[id]/time-entries — Log a time entry for a task
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Verify task ownership
  const task = await db.task.findFirst({
    where: { id: params.id, userId: auth.userId },
    select: { id: true, projectId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Override projectId with the task's project to ensure consistency
  const bodyObj = body as Record<string, unknown>;
  const parsed = createTimeEntrySchema.safeParse({
    ...bodyObj,
    projectId: task.projectId,
    taskId: params.id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const now = new Date();
  const startTime = new Date(now.getTime() - parsed.data.durationMinutes * 60 * 1000);

  const entry = await db.timeEntry.create({
    data: {
      projectId: task.projectId,
      taskId: params.id,
      userId: auth.userId,
      description: parsed.data.description || null,
      startTime,
      endTime: now,
      durationMinutes: parsed.data.durationMinutes,
      isBillable: parsed.data.isBillable,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
