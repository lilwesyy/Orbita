import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type {
  BrandProfile,
  LogoVariant,
  FaviconSet,
} from "@/types/brand-profile";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), "public/uploads/projects");

type UploadableVariant = "square" | "horizontal";

const VARIANT_CONFIG: Record<
  UploadableVariant,
  { width: number; height: number | null; fit: "cover" | "inside" }
> = {
  square: { width: 512, height: 512, fit: "cover" },
  horizontal: { width: 512, height: null, fit: "inside" },
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function generateFavicons(
  buffer: Buffer,
  projectId: string
): Promise<FaviconSet> {
  await ensureUploadDir();

  const sizes = [
    { size: 16, key: "favicon16" as const },
    { size: 32, key: "favicon32" as const },
    { size: 180, key: "favicon180" as const },
  ];

  const favicons: Partial<FaviconSet> = {};

  for (const { size, key } of sizes) {
    const filename = `${projectId}-favicon-${size}.png`;
    const filepath = join(UPLOAD_DIR, filename);
    const resized = await sharp(buffer)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();
    await writeFile(filepath, resized);
    favicons[key] = `/uploads/projects/${filename}`;
  }

  return favicons as FaviconSet;
}

async function deleteFavicons(projectId: string) {
  const sizes = [16, 32, 180];
  for (const size of sizes) {
    const filepath = join(UPLOAD_DIR, `${projectId}-favicon-${size}.png`);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const variant = formData.get("variant") as UploadableVariant | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!variant || !["square", "horizontal"].includes(variant)) {
    return NextResponse.json(
      { error: "Invalid variant. Use: square, horizontal" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PNG, JPG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 5MB" },
      { status: 400 }
    );
  }

  await ensureUploadDir();

  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);
  const config = VARIANT_CONFIG[variant];

  const resizeOptions: sharp.ResizeOptions = { fit: config.fit };
  const resized = await sharp(inputBuffer)
    .resize(config.width, config.height ?? undefined, resizeOptions)
    .webp({ quality: 85 })
    .toBuffer();

  const metadata = await sharp(resized).metadata();
  const timestamp = Date.now();
  const filename = `${id}-${variant}-${timestamp}.webp`;
  const filepath = join(UPLOAD_DIR, filename);
  await writeFile(filepath, resized);

  const logoUrl = `/uploads/projects/${filename}`;

  // Parse existing brand profile (may be a JSON string or object from DB)
  const rawProfile = project.brandProfile;
  const brandProfile: BrandProfile =
    typeof rawProfile === "string"
      ? (JSON.parse(rawProfile) as BrandProfile)
      : rawProfile
        ? (rawProfile as unknown as BrandProfile)
        : ({} as BrandProfile);

  // Remove old file for this variant
  const existingLogos: LogoVariant[] = brandProfile.logos ?? [];
  const oldLogo = existingLogos.find((l) => l.variant === variant);
  if (oldLogo) {
    const oldPath = join(process.cwd(), "public", oldLogo.url);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  } else if (variant === "square" && project.logoUrl) {
    // Clean up legacy logoUrl file if no square entry in logos array yet
    const oldPath = join(process.cwd(), "public", project.logoUrl);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  }

  // Build new logo entry
  const newLogo: LogoVariant = {
    variant,
    url: logoUrl,
    width: metadata.width ?? config.width,
    height: metadata.height ?? (config.height ?? 0),
  };

  // Replace or add variant
  const updatedLogos = [
    ...existingLogos.filter((l) => l.variant !== variant),
    newLogo,
  ];

  // Generate favicons when square is uploaded
  let favicons = brandProfile.favicons;
  if (variant === "square") {
    favicons = await generateFavicons(inputBuffer, id);
  }

  const updatedProfile = {
    ...brandProfile,
    logos: updatedLogos,
    favicons,
  };

  // Also update logoUrl for backward compat if square
  const updateData: Record<string, unknown> = {
    brandProfile: JSON.stringify(updatedProfile),
  };
  if (variant === "square") {
    updateData.logoUrl = logoUrl;
  }

  await prisma.project.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    logo: newLogo,
    favicons: variant === "square" ? favicons : undefined,
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant") as UploadableVariant | null;

  if (!variant || !["square", "horizontal"].includes(variant)) {
    return NextResponse.json(
      { error: "Invalid variant. Use: square, horizontal" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const rawProfile = project.brandProfile;
  const brandProfile: BrandProfile | null =
    typeof rawProfile === "string"
      ? (JSON.parse(rawProfile) as BrandProfile)
      : rawProfile
        ? (rawProfile as unknown as BrandProfile)
        : null;

  const existingLogos: LogoVariant[] = brandProfile?.logos ?? [];
  const oldLogo = existingLogos.find((l) => l.variant === variant);

  if (oldLogo) {
    const oldPath = join(process.cwd(), "public", oldLogo.url);
    if (existsSync(oldPath)) {
      await unlink(oldPath);
    }
  }

  const updatedLogos = existingLogos.filter((l) => l.variant !== variant);

  // If deleting square, also remove favicons
  let favicons = brandProfile?.favicons;
  const updateData: Record<string, unknown> = {};
  if (variant === "square") {
    await deleteFavicons(id);
    favicons = undefined;
    updateData.logoUrl = null;
  }

  const updatedProfile = {
    ...(brandProfile ?? {}),
    logos: updatedLogos,
    favicons,
  };

  updateData.brandProfile = JSON.stringify(updatedProfile);

  await prisma.project.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
