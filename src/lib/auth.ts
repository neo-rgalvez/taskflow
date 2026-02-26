import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import crypto from "crypto";

// ─── Constants ──────────────────────────────────────────────────────────────────

const SESSION_COOKIE_NAME = "session_token";
const BCRYPT_COST = 12;
const SESSION_IDLE_TIMEOUT_DAYS = 7;
const SESSION_ABSOLUTE_MAX_DAYS = 30;

// ─── Password Hashing ───────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Token Utilities ────────────────────────────────────────────────────────────

function generateToken(): string {
  return nanoid(32);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signToken(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const hmac = crypto.createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${hmac}`;
}

function verifySignedToken(signedToken: string): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");

  const parts = signedToken.split(".");
  if (parts.length !== 2) return null;

  const [token, signature] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(token)
    .digest("hex");

  // Timing-safe comparison
  if (signature.length !== expected.length) return null;
  const sigBuffer = Buffer.from(signature, "hex");
  const expBuffer = Buffer.from(expected, "hex");
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;

  return token;
}

// ─── Session Management ─────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const signedToken = signToken(token);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_ABSOLUTE_MAX_DAYS * 24 * 60 * 60 * 1000
  );

  await db.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 512) : null,
      lastActiveAt: now,
      expiresAt,
    },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_ABSOLUTE_MAX_DAYS * 24 * 60 * 60,
  });

  return signedToken;
}

export async function getSession(): Promise<{
  userId: string;
  sessionId: string;
  user: { id: string; name: string; email: string; emailVerified: boolean };
} | null> {
  const cookieStore = await cookies();
  const signedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!signedToken) return null;

  const token = verifySignedToken(signedToken);
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await db.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          scheduledDeletionAt: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check absolute expiry
  if (new Date() > session.expiresAt) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check idle timeout
  const idleLimit = new Date(
    session.lastActiveAt.getTime() +
      SESSION_IDLE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000
  );
  if (new Date() > idleLimit) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check if user account is scheduled for deletion
  if (session.user.scheduledDeletionAt) {
    return null;
  }

  // Update last active (fire-and-forget, don't block the request)
  db.session
    .update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});

  return {
    userId: session.userId,
    sessionId: session.id,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
    },
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const signedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (signedToken) {
    const token = verifySignedToken(signedToken);
    if (token) {
      const tokenHash = hashToken(token);
      await db.session
        .deleteMany({ where: { tokenHash } })
        .catch(() => {});
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function destroyAllSessionsExcept(
  userId: string,
  currentSessionId: string
): Promise<void> {
  await db.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  });
}

// ─── Auth Guards (for API routes) ────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Returns session or throws 401.
 * Use in API routes where authentication is required.
 */
export async function requireAuth(): Promise<{
  userId: string;
  sessionId: string;
  user: { id: string; name: string; email: string; emailVerified: boolean };
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required.", 401);
  }
  return session;
}

/**
 * Throws 403 if the authenticated user doesn't own the resource.
 */
export function requireOwnership(
  authenticatedUserId: string,
  resourceOwnerId: string
): void {
  if (authenticatedUserId !== resourceOwnerId) {
    throw new AuthError("Access denied.", 403);
  }
}

// ─── Session check for middleware (lightweight, cookie-only) ─────────────────

export function getSessionTokenFromCookie(
  cookieValue: string | undefined
): string | null {
  if (!cookieValue) return null;
  return verifySignedToken(cookieValue);
}
