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

    const [activeProjectCount, totalProjects, totalHoursResult] = await Promise.all([
      db.project.count({
        where: { clientId: params.id, userId: auth.userId, status: "active" },
      }),
      db.project.count({
        where: { clientId: params.id, userId: auth.userId },
      }),
      db.timeEntry.aggregate({
        where: {
          userId: auth.userId,
          project: { clientId: params.id },
        },
        _sum: { durationMinutes: true },
      }),
    ]);

    const totalMinutes = totalHoursResult._sum.durationMinutes || 0;

    return NextResponse.json({
      activeProjectCount,
      totalProjects,
      draftInvoiceCount: 0,
      outstandingInvoiceAmount: 0,
      totalMinutes,
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
