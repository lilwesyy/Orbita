"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import type { FetchEmailsResult, ResendSentEmail, ResendReceivedEmail, EmailDetail } from "@/types/email";

interface SerializedEmailConfig {
  id: string;
  projectId: string;
  provider: string;
  apiKey: string;
}

export async function getEmailConfig(
  projectId: string
): Promise<SerializedEmailConfig | null> {
  const config = await prisma.emailConfig.findUnique({
    where: { projectId },
  });
  if (!config) return null;
  return {
    id: config.id,
    projectId: config.projectId,
    provider: config.provider,
    apiKey: config.apiKey,
  };
}

interface EmailConfigActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function saveEmailConfig(
  projectId: string,
  _prevState: EmailConfigActionResult,
  formData: FormData
): Promise<EmailConfigActionResult> {
  const apiKey = formData.get("apiKey") as string;

  if (!apiKey || apiKey.trim() === "") {
    return { error: "API Key is required" };
  }

  try {
    await prisma.emailConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        provider: "resend",
        apiKey: apiKey.trim(),
      },
      update: {
        apiKey: apiKey.trim(),
      },
    });
  } catch {
    return { error: "Error saving email configuration" };
  }

  revalidatePath(`/projects/${projectId}/email`);
  return { success: true, message: "Configuration saved successfully" };
}

export async function deleteEmailConfig(
  projectId: string
): Promise<EmailConfigActionResult> {
  try {
    await prisma.emailConfig.delete({
      where: { projectId },
    });
  } catch {
    return { error: "Error deleting email configuration" };
  }

  revalidatePath(`/projects/${projectId}/email`);
  return { success: true, message: "Configuration deleted" };
}

export async function testEmailConnection(
  projectId: string
): Promise<EmailConfigActionResult> {
  const config = await prisma.emailConfig.findUnique({
    where: { projectId },
  });

  if (!config) {
    return { error: "No email configuration found. Save your configuration first." };
  }

  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.domains.list();

    if (error) {
      return { error: `Connection failed: ${error.message}` };
    }

    return { success: true, message: "Connection successful! API key is valid." };
  } catch {
    return { error: "Connection failed. Please check your API key." };
  }
}

export async function fetchEmailDetail(
  projectId: string,
  emailId: string
): Promise<EmailDetail> {
  const config = await prisma.emailConfig.findUnique({
    where: { projectId },
  });

  if (!config) {
    return { html: null, text: null, error: "No email configuration found." };
  }

  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return { html: null, text: null, error: "Failed to fetch email detail." };
    }

    const data = (await res.json()) as { html?: string; text?: string };
    return { html: data.html ?? null, text: data.text ?? null };
  } catch {
    return { html: null, text: null, error: "Failed to fetch email detail." };
  }
}

interface ResendEmailListResponse {
  data: ResendSentEmail[];
}

interface ResendReceivedListResponse {
  data: ResendReceivedEmail[];
}

export async function fetchEmails(projectId: string): Promise<FetchEmailsResult> {
  const config = await prisma.emailConfig.findUnique({
    where: { projectId },
  });

  if (!config) {
    return { sent: [], received: [], error: "No email configuration found." };
  }

  try {
    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };

    const [sentRes, receivedRes] = await Promise.allSettled([
      fetch("https://api.resend.com/emails", { headers }),
      fetch("https://api.resend.com/emails/receiving", { headers }),
    ]);

    let sent: ResendSentEmail[] = [];
    let received: ResendReceivedEmail[] = [];

    if (sentRes.status === "fulfilled" && sentRes.value.ok) {
      const sentData = (await sentRes.value.json()) as ResendEmailListResponse;
      sent = sentData.data ?? [];
    }

    if (receivedRes.status === "fulfilled" && receivedRes.value.ok) {
      const receivedData = (await receivedRes.value.json()) as ResendReceivedListResponse;
      received = receivedData.data ?? [];
    }

    return { sent, received };
  } catch {
    return { sent: [], received: [], error: "Failed to fetch emails from Resend." };
  }
}
