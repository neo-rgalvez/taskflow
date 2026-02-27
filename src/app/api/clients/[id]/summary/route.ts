import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/clients/[id]/summary — Get project/invoice counts for cascade warnings
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
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // TODO: When Project and Invoice models are added, replace with real counts:
    // const [activeProjects, draftInvoices, outstandingAmount] = await Promise.all([
    //   db.project.count({ where: { clientId: params.id, status: 'active' } }),
    //   db.invoice.count({ where: { clientId: params.id, status: 'draft' } }),
    //   db.invoice.aggregate({ where: { clientId: params.id, balanceDue: { gt: 0 } }, _sum: { balanceDue: true } }),
    // ]);

    return NextResponse.json({
      activeProjectCount: 0,
      draftInvoiceCount: 0,
      outstandingInvoiceAmount: 0,
    });
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
