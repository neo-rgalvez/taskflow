import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

/**
 * GET /api/settings/account — return current user profile
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/settings/account error:", err);
    return NextResponse.json(
      { error: "Failed to load account settings." },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer.")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional(),
  timezone: z.string().trim().min(1).optional(),
});

/**
 * PATCH /api/settings/account — update name, email, or timezone
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

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

    const { name, email, timezone } = parsed.data;

    // If email is changing, check for duplicates
    if (email) {
      const existing = await db.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          id: { not: auth.userId },
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "This email is already registered.",
            errors: { email: ["This email is already registered."] },
          },
          { status: 409 }
        );
      }
    }

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (timezone !== undefined) data.timezone = timezone;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 422 }
      );
    }

    const updated = await db.user.update({
      where: { id: auth.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/settings/account error:", err);
    return NextResponse.json(
      { error: "Failed to update account settings." },
      { status: 500 }
    );
  }
}
