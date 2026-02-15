"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import type { EmailProvider } from "@/generated/prisma/client";
import type {
  FetchEmailsResult,
  ResendSentEmail,
  ResendReceivedEmail,
  EmailDetail,
} from "@/types/email";

interface OwnerEmailActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

interface OwnerEmailConfig {
  provider: EmailProvider;
  resendApiKey?: string;
  imapEmail?: string;
  imapPassword?: string;
}

async function getOwnerEmailConfig(): Promise<OwnerEmailConfig | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.emailProvider) return null;

  try {
    if (settings.emailProvider === "RESEND") {
      if (!settings.resendApiKey) return null;
      return {
        provider: "RESEND",
        resendApiKey: decrypt(settings.resendApiKey),
      };
    }

    if (!settings.imapEmail || !settings.imapPassword) return null;
    return {
      provider: settings.emailProvider,
      imapEmail: decrypt(settings.imapEmail),
      imapPassword: decrypt(settings.imapPassword),
    };
  } catch {
    return null;
  }
}

export async function hasOwnerEmailConfig(): Promise<boolean> {
  const config = await getOwnerEmailConfig();
  return config !== null;
}

export async function getOwnerEmailProvider(): Promise<string | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.emailProvider ?? null;
}

export async function saveOwnerEmailConfig(
  _prevState: OwnerEmailActionResult,
  formData: FormData
): Promise<OwnerEmailActionResult> {
  const provider = formData.get("provider") as EmailProvider | null;

  if (!provider) {
    return { error: "Please select an email provider" };
  }

  try {
    if (provider === "RESEND") {
      const apiKey = formData.get("apiKey") as string;
      if (!apiKey?.trim()) {
        return { error: "API Key is required" };
      }

      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          emailProvider: "RESEND",
          resendApiKey: encrypt(apiKey.trim()),
          imapEmail: null,
          imapPassword: null,
        },
        create: {
          id: "default",
          emailProvider: "RESEND",
          resendApiKey: encrypt(apiKey.trim()),
        },
      });
    } else {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email?.trim() || !password?.trim()) {
        return { error: "Email and App Password are required" };
      }

      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          emailProvider: provider,
          imapEmail: encrypt(email.trim()),
          imapPassword: encrypt(password.trim()),
          resendApiKey: null,
        },
        create: {
          id: "default",
          emailProvider: provider,
          imapEmail: encrypt(email.trim()),
          imapPassword: encrypt(password.trim()),
        },
      });
    }

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
      update: {
        emailProvider: null,
        resendApiKey: null,
        imapEmail: null,
        imapPassword: null,
      },
      create: { id: "default" },
    });

    revalidatePath("/settings");
    revalidatePath("/email");
    return { success: true, message: "Email configuration removed" };
  } catch {
    return { error: "Failed to remove email configuration" };
  }
}

export async function testOwnerEmailConnection(): Promise<OwnerEmailActionResult> {
  const config = await getOwnerEmailConfig();
  if (!config) {
    return { error: "No email configuration found. Save your configuration first." };
  }

  try {
    if (config.provider === "RESEND") {
      const resend = new Resend(config.resendApiKey);
      const { error } = await resend.domains.list();
      if (error) {
        return { error: `Connection failed: ${error.message}` };
      }
      return { success: true, message: "Connection successful! API key is valid." };
    }

    // GMAIL / ICLOUD: test IMAP + SMTP
    const { testImapConnection } = await import("@/lib/imap-client");
    const { testSmtpConnection } = await import("@/lib/smtp-client");

    const [imapOk, smtpOk] = await Promise.all([
      testImapConnection(config.provider, config.imapEmail!, config.imapPassword!),
      testSmtpConnection(config.provider, config.imapEmail!, config.imapPassword!),
    ]);

    if (!imapOk && !smtpOk) {
      return { error: "Both IMAP and SMTP connections failed. Check your credentials." };
    }
    if (!imapOk) {
      return { error: "IMAP connection failed (inbox won't work). SMTP is OK." };
    }
    if (!smtpOk) {
      return { error: "SMTP connection failed (sending won't work). IMAP is OK." };
    }

    return { success: true, message: "Connection successful! IMAP and SMTP are working." };
  } catch {
    return { error: "Connection failed. Please check your credentials." };
  }
}

interface ResendEmailListResponse {
  data: ResendSentEmail[];
}

interface ResendReceivedListResponse {
  data: ResendReceivedEmail[];
}

export async function fetchOwnerEmails(): Promise<FetchEmailsResult> {
  const config = await getOwnerEmailConfig();
  if (!config) {
    return { sent: [], received: [], error: "No email configuration found." };
  }

  try {
    if (config.provider === "RESEND") {
      const headers = {
        Authorization: `Bearer ${config.resendApiKey}`,
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
    }

    // GMAIL / ICLOUD
    const { fetchImapEmails } = await import("@/lib/imap-client");
    return await fetchImapEmails(
      config.provider,
      config.imapEmail!,
      config.imapPassword!
    );
  } catch {
    return { sent: [], received: [], error: "Failed to fetch emails." };
  }
}

export async function fetchOwnerEmailDetail(emailId: string): Promise<EmailDetail> {
  const config = await getOwnerEmailConfig();
  if (!config) {
    return { html: null, text: null, error: "No email configuration found." };
  }

  try {
    if (config.provider === "RESEND") {
      const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return { html: null, text: null, error: "Failed to fetch email detail." };
      }

      const data = (await res.json()) as { html?: string; text?: string };
      return { html: data.html ?? null, text: data.text ?? null };
    }

    // GMAIL / ICLOUD: emailId format is "mailbox:uid"
    const lastColon = emailId.lastIndexOf(":");
    if (lastColon === -1) {
      return { html: null, text: null, error: "Invalid email ID format." };
    }

    const mailbox = emailId.substring(0, lastColon);
    const uid = parseInt(emailId.substring(lastColon + 1), 10);

    if (isNaN(uid)) {
      return { html: null, text: null, error: "Invalid email UID." };
    }

    const { fetchImapEmailDetail } = await import("@/lib/imap-client");
    return await fetchImapEmailDetail(
      config.provider,
      config.imapEmail!,
      config.imapPassword!,
      mailbox,
      uid
    );
  } catch {
    return { html: null, text: null, error: "Failed to fetch email detail." };
  }
}

export async function sendOwnerEmail(
  _prevState: OwnerEmailActionResult,
  formData: FormData
): Promise<OwnerEmailActionResult> {
  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!to?.trim()) return { error: "Recipient is required" };
  if (!subject?.trim()) return { error: "Subject is required" };
  if (!body?.trim()) return { error: "Message body is required" };

  const config = await getOwnerEmailConfig();
  if (!config) {
    return { error: "No email configuration found." };
  }

  try {
    if (config.provider === "RESEND") {
      const resend = new Resend(config.resendApiKey);
      const { error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: to.trim(),
        subject: subject.trim(),
        html: body.trim(),
      });
      if (error) {
        return { error: `Failed to send: ${error.message}` };
      }
      return { success: true, message: "Email sent successfully" };
    }

    // GMAIL / ICLOUD
    const { sendSmtpEmail } = await import("@/lib/smtp-client");
    await sendSmtpEmail(
      config.provider,
      config.imapEmail!,
      config.imapPassword!,
      to.trim(),
      subject.trim(),
      body.trim()
    );

    return { success: true, message: "Email sent successfully" };
  } catch {
    return { error: "Failed to send email." };
  }
}
