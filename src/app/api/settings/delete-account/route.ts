import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const deleteSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account."),
});

/**
 * POST /api/settings/delete-account — schedule account for deletion (30-day grace period)
 *
 * Per implementation plan fix #9:
 * - Sets `scheduled_deletion_at = now()`
 * - Immediate logout (all sessions deleted, cookie cleared)
 * - Daily job hard-deletes 30 days later (cascade all owned data)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 422 }
      );
    }

    const { password } = parsed.data;

    // Verify password before allowing deletion
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 403 }
      );
    }

    // Gather cascade counts for the confirmation response
    const [clientCount, projectCount, taskCount, timeEntryCount] =
      await Promise.all([
        db.client.count({ where: { userId: auth.userId } }),
        db.project.count({ where: { userId: auth.userId } }),
        db.task.count({ where: { userId: auth.userId } }),
        db.timeEntry.count({ where: { userId: auth.userId } }),
      ]);

    // Set scheduled deletion date (fix #9)
    await db.user.update({
      where: { id: auth.userId },
      data: { scheduledDeletionAt: new Date() },
    });

    // Invalidate ALL sessions (immediate logout)
    await db.session.deleteMany({
      where: { userId: auth.userId },
    });

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message:
        "Your account has been scheduled for deletion. All data will be permanently removed in 30 days.",
      deletedCounts: {
        clients: clientCount,
        projects: projectCount,
        tasks: taskCount,
        timeEntries: timeEntryCount,
      },
    });

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("POST /api/settings/delete-account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  }
}
