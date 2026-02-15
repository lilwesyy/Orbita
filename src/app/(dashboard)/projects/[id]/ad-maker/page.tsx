import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AdMakerWorkspace } from "@/components/ad-maker-workspace";
import { getAdDesigns } from "@/actions/ad-designs";
import { getSettings } from "@/actions/settings";
import type { BrandProfile } from "@/types/brand-profile";

interface AdMakerPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdMakerPage({ params }: AdMakerPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, brandProfile: true, logoUrl: true },
  });

  if (!project) {
    notFound();
  }

  const [designs, { hasApiKey }] = await Promise.all([
    getAdDesigns(project.id),
    getSettings(),
  ]);

  const brandProfile = project.brandProfile
    ? (JSON.parse(project.brandProfile) as BrandProfile)
    : null;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Ad Maker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate marketing materials for {project.name}
        </p>
      </div>
      <AdMakerWorkspace
        projectId={project.id}
        projectName={project.name}
        logoUrl={project.logoUrl}
        designs={designs}
        hasApiKey={hasApiKey}
        initialBrandProfile={brandProfile}
      />
    </div>
  );
}
