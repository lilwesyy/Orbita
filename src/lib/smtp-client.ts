import nodemailer from "nodemailer";
import type { EmailProvider } from "@/generated/prisma/client";
import { getProviderPreset } from "@/lib/email-providers";

function createTransport(
  provider: EmailProvider,
  email: string,
  password: string
) {
  const preset = getProviderPreset(provider);
  if (!preset) throw new Error("SMTP not supported for this provider");

  return nodemailer.createTransport({
    host: preset.smtp.host,
    port: preset.smtp.port,
    secure: preset.smtp.secure,
    auth: { user: email, pass: password },
  });
}

export async function testSmtpConnection(
  provider: EmailProvider,
  email: string,
  password: string
): Promise<boolean> {
  try {
    const transport = createTransport(provider, email, password);
    await transport.verify();
    transport.close();
    return true;
  } catch {
    return false;
  }
}

export async function sendSmtpEmail(
  provider: EmailProvider,
  email: string,
  password: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  const transport = createTransport(provider, email, password);
  try {
    await transport.sendMail({
      from: email,
      to,
      subject,
      html,
      text,
    });
  } finally {
    transport.close();
  }
}
