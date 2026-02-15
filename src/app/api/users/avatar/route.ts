import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = join(process.cwd(), "public/uploads/users");

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PNG, JPG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 2MB" },
      { status: 400 }
    );
  }

  // Remove old avatar if exists
  if (user.image) {
    const oldPath = join(process.cwd(), "public", user.image);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  }

  const filename = `${userId}-${Date.now()}.webp`;
  const filepath = join(UPLOAD_DIR, filename);

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const resized = await sharp(Buffer.from(bytes))
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();
  await writeFile(filepath, resized);

  const image = `/uploads/users/${filename}`;
  await prisma.user.update({
    where: { id: userId },
    data: { image },
  });

  return NextResponse.json({ image });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.image) {
    const oldPath = join(process.cwd(), "public", user.image);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });
  }

  return NextResponse.json({ success: true });
}
