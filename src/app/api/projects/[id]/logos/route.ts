import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import type {
  BrandProfile,
  LogoVariant,
  FaviconSet,
} from "@/types/brand-profile";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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

async function generateFavicons(buffer: Buffer): Promise<FaviconSet> {
  const sizes = [
    { size: 16, key: "favicon16" as const },
    { size: 32, key: "favicon32" as const },
    { size: 180, key: "favicon180" as const },
  ];

  const favicons: Partial<FaviconSet> = {};

  for (const { size, key } of sizes) {
    const resized = await sharp(buffer)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();
    favicons[key] = `data:image/png;base64,${resized.toString("base64")}`;
  }

  return favicons as FaviconSet;
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

  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);
  const config = VARIANT_CONFIG[variant];

  const resizeOptions: sharp.ResizeOptions = { fit: config.fit };
  const resized = await sharp(inputBuffer)
    .resize(config.width, config.height ?? undefined, resizeOptions)
    .webp({ quality: 85 })
    .toBuffer();

  const metadata = await sharp(resized).metadata();
  const logoDataUrl = `data:image/webp;base64,${resized.toString("base64")}`;

  // Parse existing brand profile
  const rawProfile = project.brandProfile;
  const brandProfile: BrandProfile =
    typeof rawProfile === "string"
      ? (JSON.parse(rawProfile) as BrandProfile)
      : rawProfile
        ? (rawProfile as unknown as BrandProfile)
        : ({} as BrandProfile);

  // Build new logo entry
  const newLogo: LogoVariant = {
    variant,
    url: logoDataUrl,
    width: metadata.width ?? config.width,
    height: metadata.height ?? (config.height ?? 0),
  };

  // Replace or add variant
  const existingLogos: LogoVariant[] = brandProfile.logos ?? [];
  const updatedLogos = [
    ...existingLogos.filter((l) => l.variant !== variant),
    newLogo,
  ];

  // Generate favicons when square is uploaded
  let favicons = brandProfile.favicons;
  if (variant === "square") {
    favicons = await generateFavicons(inputBuffer);
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
    updateData.logoUrl = logoDataUrl;
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
  const updatedLogos = existingLogos.filter((l) => l.variant !== variant);

  // If deleting square, also remove favicons
  let favicons = brandProfile?.favicons;
  const updateData: Record<string, unknown> = {};
  if (variant === "square") {
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
