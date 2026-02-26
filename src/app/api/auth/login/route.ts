import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Generic error message to prevent user enumeration
const INVALID_CREDENTIALS = "Invalid email or password.";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const ip = getClientIp(req);
    const rateLimitResult = rateLimit.login(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse and validate
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // 3. Look up user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // 4. Check if account is scheduled for deletion
    if (user.scheduledDeletionAt) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // 5. Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // 6. Create session
    const userAgent = req.headers.get("user-agent");
    await createSession(user.id, ip, userAgent);

    // 7. Return success
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
