import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateClientSchema } from "@/lib/validations/client";

/**
 * GET /api/clients/[id] — Get a single client
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const client = await db.client.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. We've been notified and are looking into it.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id] — Update a client (with optimistic locking)
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

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { updatedAt: clientUpdatedAt, ...updateData } = parsed.data;

  try {
    // Optimistic locking: only update if updatedAt matches
    const result = await db.client.updateMany({
      where: {
        id: params.id,
        userId: auth.userId,
        updatedAt: new Date(clientUpdatedAt),
      },
      data: {
        ...(updateData.name !== undefined ? { name: updateData.name } : {}),
        ...(updateData.contactName !== undefined
          ? { contactName: updateData.contactName || null }
          : {}),
        ...(updateData.email !== undefined
          ? { email: updateData.email || null }
          : {}),
        ...(updateData.phone !== undefined
          ? { phone: updateData.phone || null }
          : {}),
        ...(updateData.address !== undefined
          ? { address: updateData.address || null }
          : {}),
        ...(updateData.notes !== undefined
          ? { notes: updateData.notes || null }
          : {}),
        ...(updateData.defaultHourlyRate !== undefined
          ? { defaultHourlyRate: updateData.defaultHourlyRate }
          : {}),
        ...(updateData.defaultPaymentTerms !== undefined && updateData.defaultPaymentTerms !== null
          ? { defaultPaymentTerms: updateData.defaultPaymentTerms }
          : {}),
      },
    });

    if (result.count === 0) {
      const exists = await db.client.findFirst({
        where: { id: params.id, userId: auth.userId },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "Client not found" },
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

    const updated = await db.client.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. We've been notified and are looking into it.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id] — Delete a client and cascade
 *
 * Cascade behavior (via Prisma onDelete: Cascade):
 * - Projects → Tasks → Subtasks, Comments: hard delete
 * - Time entries: cascade-deleted with project (projectId is non-nullable)
 * - Invoices: cascade-deleted (clientId is non-nullable)
 *
 * NOTE: The IMPLEMENTATION-PLAN specifies that sent/paid invoices should
 * have clientId set to null (preserving snapshot fields), and time entries
 * should be preserved as orphaned records. This requires a schema migration
 * to make Invoice.clientId and TimeEntry.projectId nullable with SetNull.
 * Until then, the UI warns about permanent data loss before deletion.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Atomic ownership check + delete (avoids TOCTOU race)
    const result = await db.client.deleteMany({
      where: { id: params.id, userId: auth.userId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. We've been notified and are looking into it.",
      },
      { status: 500 }
    );
  }
}
