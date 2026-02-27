import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSubtaskSchema } from "@/lib/validations/task";

/**
 * POST /api/tasks/[id]/subtasks — Add a subtask to a task
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
    select: { id: true },
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

  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Get highest position
  const maxPos = await db.subtask.findFirst({
    where: { taskId: params.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const subtask = await db.subtask.create({
    data: {
      taskId: params.id,
      title: parsed.data.title,
      position: maxPos ? maxPos.position + 1 : 0,
    },
  });

  return NextResponse.json(subtask, { status: 201 });
}
