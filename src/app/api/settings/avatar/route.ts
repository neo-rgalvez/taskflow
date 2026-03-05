import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

/**
 * POST /api/settings/avatar — upload a new avatar image
 * Accepts multipart/form-data with a "file" field.
 * Stores the image as a base64 data URL on the user record.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 422 }
      );
    }

    // file is a Blob/File from formData — cast for property access
    const uploadedFile = file as File;

    if (!ALLOWED_TYPES.includes(uploadedFile.type)) {
      return NextResponse.json(
        { error: "Only JPG and PNG files are allowed." },
        { status: 422 }
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be 2MB or smaller." },
        { status: 422 }
      );
    }

    const bytes = await uploadedFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${uploadedFile.type};base64,${base64}`;

    const updated = await db.user.update({
      where: { id: auth.userId },
      data: { avatarUrl: dataUrl },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error("POST /api/settings/avatar error:", err);
    return NextResponse.json(
      { error: "Failed to upload avatar." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/avatar — remove the current avatar
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await db.user.update({
      where: { id: auth.userId },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ avatarUrl: null });
  } catch (err) {
    console.error("DELETE /api/settings/avatar error:", err);
    return NextResponse.json(
      { error: "Failed to remove avatar." },
      { status: 500 }
    );
  }
}
