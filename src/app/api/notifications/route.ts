import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z.enum(["true", "false"]).optional(),
});

/**
 * GET /api/notifications — list notifications (unread first, then recent)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const params = querySchema.parse(raw);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: auth.userId };

    if (params.unread === "true") {
      where.isRead = false;
    } else if (params.unread === "false") {
      where.isRead = true;
    }

    const take = params.limit + 1;

    const notifications = await db.notification.findMany({
      where,
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
    });

    const hasMore = notifications.length > params.limit;
    const items = hasMore ? notifications.slice(0, params.limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const unreadCount = await db.notification.count({
      where: { userId: auth.userId, isRead: false },
    });

    return NextResponse.json({
      items,
      nextCursor,
      unreadCount,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", errors: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
