import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubtaskSchema } from "@/lib/validations/task";

/**
 * PATCH /api/subtasks/[id] — Toggle or update a subtask
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Verify subtask belongs to user's task
  const subtask = await db.subtask.findFirst({
    where: { id: params.id },
    include: { task: { select: { userId: true } } },
  });

  if (!subtask || subtask.task.userId !== auth.userId) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSubtaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title;
  if (parsed.data.isCompleted !== undefined)
    updatePayload.isCompleted = parsed.data.isCompleted;

  const updated = await db.subtask.update({
    where: { id: params.id },
    data: updatePayload,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/subtasks/[id] — Delete a subtask
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const subtask = await db.subtask.findFirst({
    where: { id: params.id },
    include: { task: { select: { userId: true } } },
  });

  if (!subtask || subtask.task.userId !== auth.userId) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  await db.subtask.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
