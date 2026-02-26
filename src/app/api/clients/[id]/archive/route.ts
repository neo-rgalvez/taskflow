import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { archiveClientSchema } from "@/lib/validations/client";

/**
 * PATCH /api/clients/[id]/archive — Archive or unarchive a client
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const parsed = archiveClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const client = await db.client.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  const updated = await db.client.update({
    where: { id: params.id },
    data: { isArchived: parsed.data.isArchived },
  });

  return NextResponse.json(updated);
}
