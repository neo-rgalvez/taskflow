import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const startedAt = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: { database: "healthy" | "unhealthy"; latencyMs?: number } = {
    database: "unhealthy",
  };

  try {
    const start = performance.now();
    await db.$queryRaw`SELECT 1`;
    checks.latencyMs = Math.round(performance.now() - start);
    checks.database = "healthy";
  } catch {
    // Intentionally swallow error details to avoid exposing internals
  }

  const status = checks.database === "healthy" ? "healthy" : "unhealthy";

  const body = {
    status,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: checks.database,
        latencyMs: checks.latencyMs ?? null,
      },
    },
  };

  return NextResponse.json(body, {
    status: status === "healthy" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
