import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/stats — Dashboard summary stats
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const [totalClients, activeProjects] = await Promise.all([
    db.client.count({
      where: { userId: auth.userId, isArchived: false },
    }),
    db.project.count({
      where: { userId: auth.userId, status: "active" },
    }),
  ]);

  return NextResponse.json({
    totalClients,
    activeProjects,
  });
}
