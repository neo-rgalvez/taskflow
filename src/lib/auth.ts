import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export interface AuthSession {
  userId: string;
  sessionId: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Get the current session from the request cookie.
 * Returns null if no valid session found.
 */
export async function getSession(
  req: NextRequest
): Promise<AuthSession | null> {
  const sessionToken = req.cookies.get("session_token")?.value;

  if (!sessionToken) {
    // Development fallback: use first user in DB when no session cookie present
    if (process.env.NODE_ENV === "development") {
      const devUser = await db.user.findFirst();
      if (devUser) {
        return { userId: devUser.id, sessionId: "dev-session" };
      }
    }
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const session = await db.session.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, lastActiveAt: true },
  });

  if (!session) return null;

  // Check absolute expiry
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check idle timeout (7 days)
  const idleLimit = new Date(
    session.lastActiveAt.getTime() + 7 * 24 * 60 * 60 * 1000
  );
  if (idleLimit < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Touch last_active_at
  await db.session
    .update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});

  return { userId: session.userId, sessionId: session.id };
}

/**
 * Require authentication. Returns session or responds with 401.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthSession | NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/**
 * Check if the current user owns the resource. Returns 403 if mismatch.
 */
export function requireOwnership(
  sessionUserId: string,
  resourceUserId: string
): NextResponse | null {
  if (sessionUserId !== resourceUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
