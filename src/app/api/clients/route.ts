import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createClientSchema } from "@/lib/validations/client";

/**
 * GET /api/clients — List clients with optional search and archive filter
 * Query params: search, archived (true/false), cursor, limit
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const showArchived = searchParams.get("archived") === "true";
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "25", 10) || 25, 1),
    100
  );

  const where = {
    userId: auth.userId,
    isArchived: showArchived,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              contactName: { contains: search, mode: "insensitive" as const },
            },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [clients, totalCount] = await Promise.all([
      db.client.findMany({
        where,
        include: {
          _count: {
            select: { projects: true },
          },
        },
        orderBy: { name: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      db.client.count({ where }),
    ]);

    const hasMore = clients.length > limit;
    if (hasMore) clients.pop();

    return NextResponse.json({
      data: clients,
      nextCursor: hasMore ? clients[clients.length - 1]?.id : null,
      hasMore,
      totalCount,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. We've been notified and are looking into it.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients — Create a new client
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  try {
    const client = await db.client.create({
      data: {
        userId: auth.userId,
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        defaultHourlyRate: data.defaultHourlyRate ?? null,
        defaultPaymentTerms: data.defaultPaymentTerms ?? 30,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. We've been notified and are looking into it.",
      },
      { status: 500 }
    );
  }
}
