import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations/task";

/**
 * GET /api/tasks/[id]/comments — Get comments for a task
 */
export async function GET(
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

  const comments = await db.comment.findMany({
    where: { taskId: params.id },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: comments });
}

/**
 * POST /api/tasks/[id]/comments — Add a comment to a task
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

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const comment = await db.comment.create({
    data: {
      taskId: params.id,
      userId: auth.userId,
      content: parsed.data.content,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
