import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateInvoiceSchema } from "@/lib/validations/invoice";

/**
 * GET /api/invoices/[id] — Get a single invoice
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const invoice = await db.invoice.findFirst({
      where: { id: params.id, userId: auth.userId },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified and are looking into it." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id] — Update an invoice (with optimistic locking)
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

  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { updatedAt: clientUpdatedAt, ...updateData } = parsed.data;

  try {
    // Build update payload
    const payload: Record<string, unknown> = {};

    if (updateData.status !== undefined) {
      payload.status = updateData.status;
      if (updateData.status === "sent") {
        payload.sentAt = new Date();
        payload.issuedDate = new Date();
      }
    }
    if (updateData.dueDate !== undefined) payload.dueDate = new Date(updateData.dueDate);
    if (updateData.notes !== undefined) payload.notes = updateData.notes || null;
    if (updateData.paymentInstructions !== undefined)
      payload.paymentInstructions = updateData.paymentInstructions || null;

    // Recalculate amounts if subtotal or taxRate changed
    if (updateData.subtotal !== undefined || updateData.taxRate !== undefined) {
      const current = await db.invoice.findFirst({
        where: { id: params.id, userId: auth.userId },
      });
      if (!current) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      const subtotal = updateData.subtotal ?? Number(current.subtotal);
      const taxRate = updateData.taxRate ?? Number(current.taxRate);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const amountPaid = Number(current.amountPaid);

      payload.subtotal = subtotal;
      payload.taxRate = taxRate;
      payload.taxAmount = taxAmount;
      payload.total = total;
      payload.balanceDue = total - amountPaid;
    }

    const result = await db.invoice.updateMany({
      where: {
        id: params.id,
        userId: auth.userId,
        updatedAt: new Date(clientUpdatedAt),
      },
      data: payload,
    });

    if (result.count === 0) {
      const exists = await db.invoice.findFirst({
        where: { id: params.id, userId: auth.userId },
      });
      if (!exists) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json(
        {
          error: "Conflict: this record was modified. Please reload and try again.",
          current: exists,
        },
        { status: 409 }
      );
    }

    const updated = await db.invoice.findFirst({
      where: { id: params.id, userId: auth.userId },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified and are looking into it." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id] — Delete an invoice (only drafts)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Only allow deleting draft invoices
    const invoice = await db.invoice.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted. Use void or credit note for sent invoices." },
        { status: 422 }
      );
    }

    await db.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified and are looking into it." },
      { status: 500 }
    );
  }
}
