import type { EmailProvider } from "@/generated/prisma/client";

export interface ProviderPreset {
  label: string;
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
  sentMailbox: string;
  appPasswordUrl: string;
  instructions: string;
}

const presets: Record<Exclude<EmailProvider, "RESEND">, ProviderPreset> = {
  GMAIL: {
    label: "Gmail",
    imap: { host: "imap.gmail.com", port: 993, secure: true },
    smtp: { host: "smtp.gmail.com", port: 587, secure: false },
    sentMailbox: "[Gmail]/Sent Mail",
    appPasswordUrl: "https://myaccount.google.com/apppasswords",
    instructions:
      "Enable 2-Step Verification, then generate an App Password at the link above. Use your full Gmail address and the 16-character app password.",
  },
  ICLOUD: {
    label: "iCloud",
    imap: { host: "imap.mail.me.com", port: 993, secure: true },
    smtp: { host: "smtp.mail.me.com", port: 587, secure: false },
    sentMailbox: "Sent Messages",
    appPasswordUrl: "https://appleid.apple.com/account/manage",
    instructions:
      "Go to Apple ID > Sign-In and Security > App-Specific Passwords. Generate a new password and use your @icloud.com / @me.com address.",
  },
};

export function getProviderPreset(
  provider: EmailProvider
): ProviderPreset | null {
  if (provider === "RESEND") return null;
  return presets[provider];
}

export function getProviderLabel(provider: EmailProvider): string {
  if (provider === "RESEND") return "Resend";
  return presets[provider].label;
}
