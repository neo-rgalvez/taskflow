import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  deadlineRemindersEnabled: z.boolean().optional(),
  deadlineReminderDays: z.number().int().min(1).max(30).optional(),
  budgetAlertsEnabled: z.boolean().optional(),
  overdueInvoiceRemindersEnabled: z.boolean().optional(),
  timeTrackingRemindersEnabled: z.boolean().optional(),
  emailChannelEnabled: z.boolean().optional(),
  inAppChannelEnabled: z.boolean().optional(),
});

/**
 * GET /api/settings/notifications — get notification preferences
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    let prefs = await db.notificationPreference.findUnique({
      where: { userId: auth.userId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await db.notificationPreference.create({
        data: { userId: auth.userId },
      });
    }

    return NextResponse.json(prefs);
  } catch (err) {
    console.error("GET /api/settings/notifications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings/notifications — update notification preferences
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const prefs = await db.notificationPreference.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId, ...data },
      update: data,
    });

    return NextResponse.json(prefs);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid preferences", errors: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("PATCH /api/settings/notifications error:", err);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
