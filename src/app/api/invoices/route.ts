import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validations/invoice";

/**
 * GET /api/invoices — List invoices with optional search and status filter
 * Query params: search, status, cursor, limit
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "";
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "25", 10) || 25, 1),
    100
  );

  const clientId = searchParams.get("clientId") || "";

  const where = {
    userId: auth.userId,
    ...(clientId ? { clientId } : {}),
    ...(status && status !== "all" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" as const } },
            { clientName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [invoices, totalCount] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      db.invoice.count({ where }),
    ]);

    const hasMore = invoices.length > limit;
    if (hasMore) invoices.pop();

    // Compute summary stats
    const stats = await db.invoice.aggregate({
      where: { userId: auth.userId },
      _sum: {
        balanceDue: true,
      },
    });

    const overdueCount = await db.invoice.count({
      where: { userId: auth.userId, status: "overdue" },
    });

    const paidLast30 = await db.invoice.aggregate({
      where: {
        userId: auth.userId,
        status: "paid",
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { total: true },
    });

    return NextResponse.json({
      data: invoices,
      nextCursor: hasMore ? invoices[invoices.length - 1]?.id : null,
      hasMore,
      totalCount,
      stats: {
        totalOutstanding: stats._sum.balanceDue?.toString() || "0",
        overdueCount,
        paidLast30Days: paidLast30._sum.total?.toString() || "0",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified and are looking into it." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices — Create a new invoice
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  try {
    // Verify project and client ownership
    const project = await db.project.findFirst({
      where: { id: data.projectId, userId: auth.userId },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== data.clientId) {
      return NextResponse.json(
        { error: "Client does not match the project" },
        { status: 422 }
      );
    }

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let nextNum = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;

    // Calculate amounts
    const taxRate = data.taxRate ?? 0;
    const taxAmount = data.subtotal * (taxRate / 100);
    const total = data.subtotal + taxAmount;

    const invoice = await db.invoice.create({
      data: {
        userId: auth.userId,
        projectId: data.projectId,
        clientId: data.clientId,
        invoiceNumber,
        status: "draft",
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        taxRate,
        taxAmount,
        total,
        amountPaid: 0,
        balanceDue: total,
        notes: data.notes || null,
        paymentInstructions: data.paymentInstructions || null,
        clientName: project.client.name,
        clientEmail: project.client.email,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified and are looking into it." },
      { status: 500 }
    );
  }
}
