import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("session_token")?.value;

    if (sessionToken) {
      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
      // Delete the session from the database
      await db.session.deleteMany({ where: { tokenHash } });
    }

    // Clear the cookie regardless
    const response = NextResponse.json({ success: true });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    // Still clear the cookie even on error
    const response = NextResponse.json({ success: true });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}
