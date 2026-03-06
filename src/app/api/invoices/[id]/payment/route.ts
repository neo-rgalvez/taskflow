import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordPaymentSchema } from "@/lib/validations/invoice";

/**
 * POST /api/invoices/[id]/payment — Record a payment against an invoice
 */
export async function POST(
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

  const parsed = recordPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  try {
    const invoice = await db.invoice.findFirst({
      where: { id: params.id, userId: auth.userId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "draft") {
      return NextResponse.json(
        { error: "Cannot record payment on a draft invoice. Send the invoice first." },
        { status: 422 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "This invoice is already fully paid." },
        { status: 422 }
      );
    }

    const newAmountPaid = Number(invoice.amountPaid) + data.amount;
    const total = Number(invoice.total);
    const newBalanceDue = Math.max(0, total - newAmountPaid);
    const newStatus = newBalanceDue <= 0 ? "paid" : "partial";

    const updated = await db.invoice.update({
      where: { id: params.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
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
