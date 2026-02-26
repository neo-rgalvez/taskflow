import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations/project";
import { ProjectStatus } from "@prisma/client";

/**
 * GET /api/projects — List projects with optional search, status, and client filters
 * Query params: search, status, clientId, cursor, limit
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "25", 10) || 25, 1),
    100
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: auth.userId,
  };

  // Status filter
  if (status && status !== "all") {
    const validStatuses: ProjectStatus[] = [
      "active",
      "on_hold",
      "completed",
      "cancelled",
    ];
    if (validStatuses.includes(status as ProjectStatus)) {
      where.status = status as ProjectStatus;
    }
  }

  // Client filter
  if (clientId) {
    where.clientId = clientId;
  }

  // Search across name and description
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const [projects, totalCount] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { name: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    db.project.count({ where }),
  ]);

  const hasMore = projects.length > limit;
  if (hasMore) projects.pop();

  return NextResponse.json({
    data: projects,
    nextCursor: hasMore ? projects[projects.length - 1]?.id : null,
    hasMore,
    totalCount,
  });
}

/**
 * POST /api/projects — Create a new project
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

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Verify client belongs to user
  const client = await db.client.findFirst({
    where: { id: data.clientId, userId: auth.userId },
  });
  if (!client) {
    return NextResponse.json(
      { error: "Client not found." },
      { status: 404 }
    );
  }

  const project = await db.project.create({
    data: {
      userId: auth.userId,
      clientId: data.clientId,
      name: data.name,
      description: data.description || null,
      billingType: data.billingType,
      hourlyRate: data.hourlyRate ?? null,
      fixedPrice: data.fixedPrice ?? null,
      budgetHours: data.budgetHours ?? null,
      budgetAmount: data.budgetAmount ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      color: data.color || "#6366F1",
    },
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
