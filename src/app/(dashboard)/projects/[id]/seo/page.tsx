import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SeoCheckerClient } from "@/components/seo-checker-client";
import type { BrandProfile } from "@/types/brand-profile";
import type { SeoAuditResult } from "@/types/seo-audit";

interface SeoPageProps {
  params: Promise<{ id: string }>;
}

export default async function SeoPage({ params }: SeoPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, websiteUrl: true, brandProfile: true, seoAudit: true },
  });

  if (!project) {
    notFound();
  }

  const brandProfile = project.brandProfile
    ? (JSON.parse(project.brandProfile) as BrandProfile)
    : null;

  const seoAudit = project.seoAudit
    ? (JSON.parse(project.seoAudit) as SeoAuditResult)
    : null;

  const defaultUrl = project.websiteUrl || brandProfile?.sourceUrl || "";

  if (!seoAudit) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <SeoCheckerClient
          projectId={project.id}
          projectName={project.name}
          initialResult={null}
          defaultUrl={defaultUrl}
        />
      </div>
    );
  }

  return (
    <SeoCheckerClient
      projectId={project.id}
      projectName={project.name}
      initialResult={seoAudit}
      defaultUrl={defaultUrl}
    />
  );
}
