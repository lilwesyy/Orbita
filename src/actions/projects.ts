"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@/generated/prisma/client";

interface ProjectActionResult {
  error?: string;
  success?: boolean;
}

export async function createProject(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const status = (formData.get("status") as ProjectStatus) || "PROPOSAL";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const budget = formData.get("budget") as string;
  const hourlyRate = formData.get("hourlyRate") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const clientId = formData.get("clientId") as string;

  if (!name || name.trim() === "") {
    return { error: "Project name is required" };
  }
  if (!clientId) {
    return { error: "Client is required" };
  }

  try {
    await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        websiteUrl: websiteUrl?.trim() || null,
        clientId,
      },
    });
  } catch {
    return { error: "Error creating project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function updateProject(
  id: string,
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const status = (formData.get("status") as ProjectStatus) || "PROPOSAL";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const budget = formData.get("budget") as string;
  const hourlyRate = formData.get("hourlyRate") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const clientId = formData.get("clientId") as string;

  if (!name || name.trim() === "") {
    return { error: "Project name is required" };
  }
  if (!clientId) {
    return { error: "Client is required" };
  }

  try {
    await prisma.project.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        websiteUrl: websiteUrl?.trim() || null,
        clientId,
      },
    });
  } catch {
    return { error: "Error updating project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
  redirect(`/projects/${id}`);
}

export async function createProjectInDialog(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const status = (formData.get("status") as ProjectStatus) || "PROPOSAL";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const budget = formData.get("budget") as string;
  const hourlyRate = formData.get("hourlyRate") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const clientId = formData.get("clientId") as string;

  if (!name || name.trim() === "") {
    return { error: "Project name is required" };
  }
  if (!clientId) {
    return { error: "Client is required" };
  }

  try {
    await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        websiteUrl: websiteUrl?.trim() || null,
        clientId,
      },
    });
  } catch {
    return { error: "Error creating project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function updateProjectInDialog(
  id: string,
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const status = (formData.get("status") as ProjectStatus) || "PROPOSAL";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const budget = formData.get("budget") as string;
  const hourlyRate = formData.get("hourlyRate") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const clientId = formData.get("clientId") as string;

  if (!name || name.trim() === "") {
    return { error: "Project name is required" };
  }
  if (!clientId) {
    return { error: "Client is required" };
  }

  try {
    await prisma.project.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        websiteUrl: websiteUrl?.trim() || null,
        clientId,
      },
    });
  } catch {
    return { error: "Error updating project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<ProjectActionResult> {
  try {
    await prisma.project.update({
      where: { id },
      data: { status },
    });
  } catch {
    return { error: "Error updating status" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
  return { success: true };
}

interface SerializedProject {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  brandProfile: string | null;
  seoAudit: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  budget: string | null;
  hourlyRate: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
}

export async function getProjectById(id: string): Promise<SerializedProject | null> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  return {
    ...project,
    budget: project.budget ? String(project.budget) : null,
    hourlyRate: project.hourlyRate ? String(project.hourlyRate) : null,
  };
}

export async function deleteProjectFromList(id: string): Promise<ProjectActionResult> {
  try {
    await prisma.project.delete({ where: { id } });
  } catch {
    return { error: "Error deleting project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProject(id: string): Promise<ProjectActionResult> {
  try {
    await prisma.project.delete({
      where: { id },
    });
  } catch {
    return { error: "Error deleting project" };
  }

  revalidateTag("projects", "max");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}
