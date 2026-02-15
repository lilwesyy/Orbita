"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AdDesignSummary, AdDesignFull } from "@/types/ad-design";

interface AdDesignActionResult {
  error?: string;
  success?: boolean;
}

export async function getAdDesigns(projectId: string): Promise<AdDesignSummary[]> {
  const designs = await prisma.adDesign.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      format: true,
      prompt: true,
      sourceUrl: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });
  return designs;
}

export async function getAdDesign(id: string): Promise<AdDesignFull | null> {
  const design = await prisma.adDesign.findUnique({
    where: { id },
  });
  if (!design) return null;
  return {
    id: design.id,
    format: design.format,
    prompt: design.prompt,
    sourceUrl: design.sourceUrl,
    htmlContent: design.htmlContent,
    width: design.width,
    height: design.height,
    projectId: design.projectId,
    createdAt: design.createdAt,
  };
}

export async function saveAdDesign(
  projectId: string,
  data: {
    format: string;
    prompt: string;
    sourceUrl: string | null;
    htmlContent: string;
    width: number;
    height: number;
  }
): Promise<AdDesignActionResult & { id?: string }> {
  try {
    const design = await prisma.adDesign.create({
      data: {
        ...data,
        projectId,
      },
    });
    revalidatePath(`/projects/${projectId}/ad-maker`);
    return { success: true, id: design.id };
  } catch {
    return { error: "Failed to save design" };
  }
}

export async function deleteAdDesign(
  id: string,
  projectId: string
): Promise<AdDesignActionResult> {
  try {
    await prisma.adDesign.delete({ where: { id } });
    revalidatePath(`/projects/${projectId}/ad-maker`);
    return { success: true };
  } catch {
    return { error: "Failed to delete design" };
  }
}
