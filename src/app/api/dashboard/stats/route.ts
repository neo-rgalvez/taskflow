import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/stats — Dashboard summary stats
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const [totalClients, activeProjects, totalProjects] = await Promise.all([
    db.client.count({
      where: { userId: auth.userId, isArchived: false },
    }),
    db.project.count({
      where: { userId: auth.userId, status: "active" },
    }),
    db.project.count({
      where: { userId: auth.userId },
    }),
  ]);

  return NextResponse.json({
    totalClients,
    activeProjects,
    totalProjects,
  });
}
