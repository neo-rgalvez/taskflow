import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { signupSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const ip = getClientIp(req);
    const rateLimitResult = rateLimit.signup(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse and validate
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    // 3. Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // Generic message to prevent email enumeration
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // 5. Create session
    const userAgent = req.headers.get("user-agent");
    await createSession(user.id, ip, userAgent);

    // 6. Return success (no sensitive data)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
