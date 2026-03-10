import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateTimeEntrySchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2,000 characters or fewer.")
    .optional()
    .nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duration must be between 1 minute and 24 hours.")
    .max(1440, "Duration must be between 1 minute and 24 hours.")
    .optional(),
  isBillable: z.boolean().optional(),
});

/**
 * GET /api/time-entries/[id] — Get a single time entry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const entry = await db.timeEntry.findFirst({
      where: { id, userId: auth.userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            client: { select: { id: true, name: true } },
          },
        },
        task: { select: { id: true, title: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (err) {
    console.error("GET /api/time-entries/[id] error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/time-entries/[id] — Update a time entry
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    // Check ownership and invoiced status
    const existing = await db.timeEntry.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    if (existing.isInvoiced) {
      return NextResponse.json(
        { error: "This time entry has been invoiced and cannot be modified." },
        { status: 422 }
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description;
    }
    if (parsed.data.isBillable !== undefined) {
      updateData.isBillable = parsed.data.isBillable;
    }
    if (parsed.data.durationMinutes !== undefined) {
      updateData.durationMinutes = parsed.data.durationMinutes;
      // Recalculate start time based on new duration
      const endTime = existing.endTime || new Date();
      updateData.startTime = new Date(
        endTime.getTime() - parsed.data.durationMinutes * 60 * 1000
      );
    }

    const updated = await db.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            client: { select: { id: true, name: true } },
          },
        },
        task: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/time-entries/[id] error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/time-entries/[id] — Delete a time entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    // Atomic ownership check + delete
    const existing = await db.timeEntry.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    if (existing.isInvoiced) {
      return NextResponse.json(
        { error: "This time entry has been invoiced and cannot be deleted." },
        { status: 422 }
      );
    }

    await db.timeEntry.deleteMany({
      where: { id, userId: auth.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/time-entries/[id] error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}
