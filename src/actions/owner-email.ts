"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import type { FetchEmailsResult, ResendSentEmail, ResendReceivedEmail, EmailDetail } from "@/types/email";

interface OwnerEmailActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

async function getOwnerResendApiKey(): Promise<string | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.resendApiKey) return null;
  try {
    return decrypt(settings.resendApiKey);
  } catch {
    return null;
  }
}

export async function hasOwnerEmailConfig(): Promise<boolean> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  return !!settings?.resendApiKey;
}

export async function saveOwnerEmailConfig(
  _prevState: OwnerEmailActionResult,
  formData: FormData
): Promise<OwnerEmailActionResult> {
  const apiKey = formData.get("apiKey") as string;

  if (!apiKey || apiKey.trim() === "") {
    return { error: "API Key is required" };
  }

  try {
    const encrypted = encrypt(apiKey.trim());

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { resendApiKey: encrypted },
      create: { id: "default", resendApiKey: encrypted },
    });

    revalidatePath("/settings");
    revalidatePath("/email");
    return { success: true, message: "Email configuration saved successfully" };
  } catch {
    return { error: "Failed to save email configuration" };
  }
}

export async function deleteOwnerEmailConfig(): Promise<OwnerEmailActionResult> {
  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { resendApiKey: null },
      create: { id: "default", resendApiKey: null },
    });

    revalidatePath("/settings");
    revalidatePath("/email");
    return { success: true, message: "Email configuration removed" };
  } catch {
    return { error: "Failed to remove email configuration" };
  }
}

export async function testOwnerEmailConnection(): Promise<OwnerEmailActionResult> {
  const apiKey = await getOwnerResendApiKey();

  if (!apiKey) {
    return { error: "No email configuration found. Save your configuration first." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.domains.list();

    if (error) {
      return { error: `Connection failed: ${error.message}` };
    }

    return { success: true, message: "Connection successful! API key is valid." };
  } catch {
    return { error: "Connection failed. Please check your API key." };
  }
}

interface ResendEmailListResponse {
  data: ResendSentEmail[];
}

interface ResendReceivedListResponse {
  data: ResendReceivedEmail[];
}

export async function fetchOwnerEmails(): Promise<FetchEmailsResult> {
  const apiKey = await getOwnerResendApiKey();

  if (!apiKey) {
    return { sent: [], received: [], error: "No email configuration found." };
  }

  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
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

export async function fetchOwnerEmailDetail(emailId: string): Promise<EmailDetail> {
  const apiKey = await getOwnerResendApiKey();

  if (!apiKey) {
    return { html: null, text: null, error: "No email configuration found." };
  }

  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
