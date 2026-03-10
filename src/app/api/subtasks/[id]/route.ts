import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubtaskSchema } from "@/lib/validations/task";

/**
 * PATCH /api/subtasks/[id] — Toggle or update a subtask
 * Uses atomic ownership verification to prevent TOCTOU race conditions.
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

  // Atomic: verify ownership via task.userId in a single query
  const result = await db.subtask.updateMany({
    where: {
      id: params.id,
      task: { userId: auth.userId },
    },
    data: updatePayload,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  const updated = await db.subtask.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

/**
 * DELETE /api/subtasks/[id] — Delete a subtask
 * Uses atomic ownership verification to prevent TOCTOU race conditions.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Atomic: deleteMany with ownership constraint
  const result = await db.subtask.deleteMany({
    where: {
      id: params.id,
      task: { userId: auth.userId },
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
