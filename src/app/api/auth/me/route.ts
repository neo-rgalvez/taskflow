import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AUTH_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { user: null },
        { status: 401, headers: AUTH_HEADERS }
      );
    }

    return NextResponse.json(
      { user: session.user },
      { headers: AUTH_HEADERS }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { user: null },
      { status: 401, headers: AUTH_HEADERS }
    );
  }
}
