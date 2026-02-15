"use server";

import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

interface SettingsActionResult {
  error?: string;
  success?: boolean;
}

export async function getSettings(): Promise<{
  hasApiKey: boolean;
  hasGithubCredentials: boolean;
  hasEmailConfig: boolean;
  emailProvider: string | null;
}> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  const hasEmailConfig = settings?.emailProvider
    ? settings.emailProvider === "RESEND"
      ? !!settings.resendApiKey
      : !!settings.imapEmail && !!settings.imapPassword
    : false;

  return {
    hasApiKey: !!settings?.anthropicApiKey,
    hasGithubCredentials: !!settings?.githubClientId && !!settings?.githubClientSecret,
    hasEmailConfig,
    emailProvider: settings?.emailProvider ?? null,
  };
}

export async function saveAnthropicApiKey(
  _prevState: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  const apiKey = formData.get("apiKey") as string;

  if (!apiKey || apiKey.trim() === "") {
    return { error: "API key is required" };
  }

  if (!apiKey.startsWith("sk-ant-")) {
    return { error: "Invalid Anthropic API key format" };
  }

  try {
    const encrypted = encrypt(apiKey.trim());

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { anthropicApiKey: encrypted },
      create: { id: "default", anthropicApiKey: encrypted },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to save API key" };
  }
}

export async function deleteAnthropicApiKey(): Promise<SettingsActionResult> {
  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { anthropicApiKey: null },
      create: { id: "default", anthropicApiKey: null },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to remove API key" };
  }
}

export async function saveGitHubCredentials(
  _prevState: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  const clientId = formData.get("githubClientId") as string;
  const clientSecret = formData.get("githubClientSecret") as string;

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return { error: "Both Client ID and Client Secret are required" };
  }

  try {
    const encryptedId = encrypt(clientId.trim());
    const encryptedSecret = encrypt(clientSecret.trim());

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { githubClientId: encryptedId, githubClientSecret: encryptedSecret },
      create: { id: "default", githubClientId: encryptedId, githubClientSecret: encryptedSecret },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to save GitHub credentials:", err);
    return { error: "Failed to save GitHub credentials" };
  }
}

export async function deleteGitHubCredentials(): Promise<SettingsActionResult> {
  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { githubClientId: null, githubClientSecret: null },
      create: { id: "default", githubClientId: null, githubClientSecret: null },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to remove GitHub credentials" };
  }
}

export async function getGitHubCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings?.githubClientId || !settings?.githubClientSecret) {
    return null;
  }

  const { decrypt } = await import("@/lib/encryption");
  return {
    clientId: decrypt(settings.githubClientId),
    clientSecret: decrypt(settings.githubClientSecret),
  };
}
