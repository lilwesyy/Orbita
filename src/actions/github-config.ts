"use server";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import type { GitHubConfigSerialized } from "@/types/github";

export async function getGitHubConfig(
  projectId: string
): Promise<GitHubConfigSerialized | null> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });
  if (!config) return null;
  return {
    id: config.id,
    projectId: config.projectId,
    repoOwner: config.repoOwner,
    repoName: config.repoName,
    repoFullName: config.repoFullName,
  };
}

interface GitHubConfigActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function saveGitHubRepo(
  projectId: string,
  owner: string,
  name: string,
  fullName: string
): Promise<GitHubConfigActionResult> {
  try {
    await prisma.gitHubConfig.update({
      where: { projectId },
      data: {
        repoOwner: owner,
        repoName: name,
        repoFullName: fullName,
      },
    });
  } catch {
    return { error: "Failed to save repository selection" };
  }

  revalidatePath(`/projects/${projectId}/github`);
  return { success: true, message: "Repository linked successfully" };
}

export async function deleteGitHubConfig(
  projectId: string
): Promise<GitHubConfigActionResult> {
  try {
    await prisma.gitHubConfig.delete({
      where: { projectId },
    });
  } catch {
    return { error: "Failed to disconnect GitHub" };
  }

  revalidatePath(`/projects/${projectId}/github`);
  return { success: true, message: "GitHub disconnected" };
}

export async function testGitHubConnection(
  projectId: string
): Promise<GitHubConfigActionResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });
  if (!config) {
    return { error: "No GitHub configuration found" };
  }

  try {
    const token = decrypt(config.accessToken);
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      return { error: `Connection failed (${res.status}). Please reconnect.` };
    }

    return { success: true, message: "GitHub connection is working" };
  } catch {
    return { error: "Connection test failed. Token may be invalid." };
  }
}
