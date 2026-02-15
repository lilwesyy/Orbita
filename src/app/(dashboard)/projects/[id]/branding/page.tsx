import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BrandingPageClient } from "@/components/branding-page-client";
import type { BrandProfile } from "@/types/brand-profile";

interface BrandingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectBrandingPage({
  params,
}: BrandingPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      brandProfile: true,
      logoUrl: true,
    },
  });

  if (!project) {
    notFound();
  }

  const rawProfile = project.brandProfile;
  const brandProfile: BrandProfile | null =
    typeof rawProfile === "string"
      ? (JSON.parse(rawProfile) as BrandProfile)
      : rawProfile
        ? (rawProfile as unknown as BrandProfile)
        : null;

  // Build logos array, syncing square variant with project.logoUrl
  const storedLogos = brandProfile?.logos ?? [];
  const hasSquare = storedLogos.some((l) => l.variant === "square");
  const logos =
    !hasSquare && project.logoUrl
      ? [
          {
            variant: "square" as const,
            url: project.logoUrl,
            width: 512,
            height: 512,
          },
          ...storedLogos,
        ]
      : storedLogos;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <BrandingPageClient
        projectId={project.id}
        brandProfile={brandProfile}
        logos={logos}
        favicons={brandProfile?.favicons}
      />
    </div>
  );
}
