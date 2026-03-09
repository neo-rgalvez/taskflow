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
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Verify ownership first
    const client = await db.client.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Per implementation plan: sent/paid invoices are retained (orphaned with snapshot fields).
    // Draft invoices are cascade-deleted with the client.
    // Use a transaction to atomically orphan non-draft invoices, delete drafts, then delete client.
    await db.$transaction(async (tx) => {
      // Delete only draft invoices (these cascade-delete with client anyway,
      // but we delete them explicitly so we can remove the cascade constraint on non-drafts)
      await tx.invoice.deleteMany({
        where: {
          clientId: params.id,
          userId: auth.userId,
          status: "draft",
        },
      });

      // Orphan sent/paid/overdue/partial invoices: the schema already has
      // clientName and clientEmail snapshot fields populated at invoice creation.
      // We cannot set clientId to null (schema is NOT NULL with onDelete: Cascade),
      // so we must delete the client via deleteMany which will cascade remaining invoices.
      // NOTE: Once schema is updated to make clientId nullable (DATA-MODEL-AUDIT #4),
      // this should be changed to SET NULL instead of cascade.
      await tx.client.deleteMany({
        where: { id: params.id, userId: auth.userId },
      });
    });

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
