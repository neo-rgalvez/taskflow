import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/stats — Dashboard summary stats
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const totalClients = await db.client.count({
    where: { userId: auth.userId, isArchived: false },
  });

  return NextResponse.json({
    totalClients,
  });
}
