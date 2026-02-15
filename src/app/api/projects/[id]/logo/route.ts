import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = join(process.cwd(), "public/uploads/projects");

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

  // Remove old logo if exists
  if (project.logoUrl) {
    const oldPath = join(process.cwd(), "public", project.logoUrl);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  }

  const filename = `${id}-${Date.now()}.webp`;
  const filepath = join(UPLOAD_DIR, filename);

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const resized = await sharp(Buffer.from(bytes))
    .resize(128, 128, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();
  await writeFile(filepath, resized);

  const logoUrl = `/uploads/projects/${filename}`;
  await prisma.project.update({
    where: { id },
    data: { logoUrl },
  });

  return NextResponse.json({ logoUrl });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.logoUrl) {
    const oldPath = join(process.cwd(), "public", project.logoUrl);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }

    await prisma.project.update({
      where: { id },
      data: { logoUrl: null },
    });
  }

  return NextResponse.json({ success: true });
}
