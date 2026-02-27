import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations/task";

/**
 * GET /api/projects/[id]/tasks — Get all tasks for a project (board view)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tasks = await db.task.findMany({
    where: { projectId: params.id, userId: auth.userId },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          comments: true,
          timeEntries: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  // Compute aggregate time per task
  const timeByTask = await db.timeEntry.groupBy({
    by: ["taskId"],
    where: { projectId: params.id, userId: auth.userId, taskId: { not: null } },
    _sum: { durationMinutes: true },
  });

  const timeMap = new Map(
    timeByTask.map((t) => [t.taskId, t._sum.durationMinutes || 0])
  );

  const enrichedTasks = tasks.map((task) => ({
    ...task,
    totalMinutes: timeMap.get(task.id) || 0,
    commentCount: task._count.comments,
    timeEntryCount: task._count.timeEntries,
  }));

  return NextResponse.json({ data: enrichedTasks, totalCount: tasks.length });
}

/**
 * POST /api/projects/[id]/tasks — Create a task in a project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Get highest position for the target status column
  const maxPosition = await db.task.findFirst({
    where: { projectId: params.id, status: parsed.data.status },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = parsed.data.position ?? (maxPosition ? maxPosition.position + 1 : 0);

  const task = await db.task.create({
    data: {
      projectId: params.id,
      userId: auth.userId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      position,
    },
    include: {
      subtasks: true,
      _count: {
        select: { comments: true, timeEntries: true },
      },
    },
  });

  return NextResponse.json(
    { ...task, totalMinutes: 0, commentCount: 0, timeEntryCount: 0 },
    { status: 201 }
  );
}
