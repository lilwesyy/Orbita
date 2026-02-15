import { ImapFlow } from "imapflow";
import type { EmailProvider } from "@/generated/prisma/client";
import { getProviderPreset } from "@/lib/email-providers";
import type {
  FetchEmailsResult,
  ResendSentEmail,
  ResendReceivedEmail,
  EmailDetail,
} from "@/types/email";

function createImapClient(
  provider: EmailProvider,
  email: string,
  password: string
): ImapFlow {
  const preset = getProviderPreset(provider);
  if (!preset) throw new Error("IMAP not supported for this provider");

  return new ImapFlow({
    host: preset.imap.host,
    port: preset.imap.port,
    secure: preset.imap.secure,
    auth: { user: email, pass: password },
    logger: false,
  });
}

export async function testImapConnection(
  provider: EmailProvider,
  email: string,
  password: string
): Promise<boolean> {
  const client = createImapClient(provider, email, password);
  try {
    await client.connect();
    await client.logout();
    return true;
  } catch {
    return false;
  }
}

interface ImapParsedMessage {
  uid: number;
  from: string;
  to: string[];
  subject: string;
  date: string;
}

async function fetchMailbox(
  client: ImapFlow,
  mailbox: string,
  limit: number
): Promise<ImapParsedMessage[]> {
  const messages: ImapParsedMessage[] = [];

  try {
    const lock = await client.getMailboxLock(mailbox);
    try {
      const status = client.mailbox;
      if (!status || !status.exists || status.exists === 0) return [];

      const total = status.exists;
      const startSeq = Math.max(1, total - limit + 1);

      for await (const msg of client.fetch(`${startSeq}:*`, {
        uid: true,
        envelope: true,
      })) {
        const envelope = msg.envelope;
        if (!envelope) continue;

        const from =
          envelope.from?.[0]
            ? `${envelope.from[0].name || ""} <${envelope.from[0].address || ""}>`.trim()
            : "Unknown";
        const to = (envelope.to || []).map(
          (addr: { name?: string; address?: string }) =>
            addr.address || "Unknown"
        );

        messages.push({
          uid: msg.uid,
          from,
          to,
          subject: envelope.subject || "(No Subject)",
          date: envelope.date
            ? new Date(envelope.date).toISOString()
            : new Date().toISOString(),
        });
      }
    } finally {
      lock.release();
    }
  } catch {
    // Mailbox might not exist
  }

  return messages;
}

export async function fetchImapEmails(
  provider: EmailProvider,
  email: string,
  password: string,
  limit = 50
): Promise<FetchEmailsResult> {
  const preset = getProviderPreset(provider);
  if (!preset) return { sent: [], received: [], error: "IMAP not supported" };

  const client = createImapClient(provider, email, password);

  try {
    await client.connect();

    const [inboxMessages, sentMessages] = await Promise.all([
      fetchMailbox(client, "INBOX", limit),
      fetchMailbox(client, preset.sentMailbox, limit),
    ]);

    await client.logout();

    const received: ResendReceivedEmail[] = inboxMessages.map((msg) => ({
      id: `INBOX:${msg.uid}`,
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      created_at: msg.date,
    }));

    const sent: ResendSentEmail[] = sentMessages.map((msg) => ({
      id: `${preset.sentMailbox}:${msg.uid}`,
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      created_at: msg.date,
      last_event: "delivered",
    }));

    return { sent, received };
  } catch (err) {
    const message = err instanceof Error ? err.message : "IMAP connection failed";
    return { sent: [], received: [], error: message };
  }
}

export async function fetchImapEmailDetail(
  provider: EmailProvider,
  email: string,
  password: string,
  mailbox: string,
  uid: number
): Promise<EmailDetail> {
  const client = createImapClient(provider, email, password);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      const result = await client.fetchOne(
        String(uid),
        { source: true },
        { uid: true }
      );

      if (!result) {
        return { html: null, text: null, error: "Message not found" };
      }

      const msg = result;
      if (!msg.source) {
        return { html: null, text: null, error: "Message not found" };
      }

      const { simpleParser } = await import("mailparser");
      const parsed = await simpleParser(msg.source);

      return {
        html: parsed.html || null,
        text: parsed.text || null,
      };
    } finally {
      lock.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch email";
    return { html: null, text: null, error: message };
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout errors
    }
  }
}
