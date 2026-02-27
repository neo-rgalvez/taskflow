import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain an uppercase letter.")
      .regex(/[a-z]/, "Password must contain a lowercase letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine(
    (data: { newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * POST /api/settings/change-password — change password, invalidate other sessions
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message, errors: fieldErrors },
        { status: 422 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user's current hash
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          error: "Current password is incorrect.",
          errors: {
            currentPassword: ["Current password is incorrect."],
          },
        },
        { status: 403 }
      );
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all OTHER sessions (keep the current one)
    await db.session.deleteMany({
      where: {
        userId: auth.userId,
        id: { not: auth.sessionId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/settings/change-password error:", err);
    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}
