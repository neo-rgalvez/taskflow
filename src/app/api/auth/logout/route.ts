import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    console.error("Logout error:", error);
    // If destroySession threw before clearing the cookie, force-clear it here
    try {
      const cookieStore = await cookies();
      cookieStore.set("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    } catch {
      // Cookie API itself failed — nothing more we can do server-side
    }
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
