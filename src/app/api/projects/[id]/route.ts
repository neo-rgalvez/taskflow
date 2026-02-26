import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  updateProjectSchema,
  validateStatusTransition,
} from "@/lib/validations/project";

/**
 * GET /api/projects/[id] — Get a single project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const project = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

/**
 * PATCH /api/projects/[id] — Update a project (with optimistic locking)
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
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { updatedAt: projectUpdatedAt, ...updateData } = parsed.data;

  // Fetch current project to validate status transition
  const current = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!current) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  // Validate status transition if status is being changed
  if (updateData.status && updateData.status !== current.status) {
    const transitionError = validateStatusTransition(
      current.status,
      updateData.status
    );
    if (transitionError) {
      return NextResponse.json(
        { error: transitionError },
        { status: 422 }
      );
    }
  }

  // Build update payload — only include fields that were provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {};
  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.description !== undefined)
    updatePayload.description = updateData.description || null;
  if (updateData.status !== undefined) updatePayload.status = updateData.status;
  if (updateData.billingType !== undefined)
    updatePayload.billingType = updateData.billingType;
  if (updateData.hourlyRate !== undefined)
    updatePayload.hourlyRate = updateData.hourlyRate;
  if (updateData.fixedPrice !== undefined)
    updatePayload.fixedPrice = updateData.fixedPrice;
  if (updateData.budgetHours !== undefined)
    updatePayload.budgetHours = updateData.budgetHours;
  if (updateData.budgetAmount !== undefined)
    updatePayload.budgetAmount = updateData.budgetAmount;
  if (updateData.deadline !== undefined)
    updatePayload.deadline = updateData.deadline
      ? new Date(updateData.deadline)
      : null;
  if (updateData.color !== undefined) updatePayload.color = updateData.color;

  // Optimistic locking: only update if updatedAt matches
  const result = await db.project.updateMany({
    where: {
      id: params.id,
      userId: auth.userId,
      updatedAt: new Date(projectUpdatedAt),
    },
    data: updatePayload,
  });

  if (result.count === 0) {
    const exists = await db.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
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

  const updated = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/projects/[id] — Delete a project
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const project = await db.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  await db.project.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true }, { status: 200 });
}
