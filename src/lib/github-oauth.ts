import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set");
  return key;
}

async function getGitHubCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
}> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings?.githubClientId || !settings?.githubClientSecret) {
    throw new Error("GitHub OAuth credentials not configured. Go to Settings to add them.");
  }

  return {
    clientId: decrypt(settings.githubClientId),
    clientSecret: decrypt(settings.githubClientSecret),
  };
}

export async function getGitHubAuthUrl(projectId: string): Promise<string> {
  const { clientId } = await getGitHubCredentials();

  const timestamp = Date.now().toString();
  const payload = `${projectId}:${timestamp}`;
  const hmac = createHmac("sha256", getEncryptionKey())
    .update(payload)
    .digest("hex");
  const state = `${payload}:${hmac}`;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function verifyOAuthState(state: string): string | null {
  const parts = state.split(":");
  if (parts.length !== 3) return null;

  const [projectId, timestamp, receivedHmac] = parts;
  if (!projectId || !timestamp || !receivedHmac) return null;

  // Check expiry (10 minutes)
  const elapsed = Date.now() - parseInt(timestamp, 10);
  if (elapsed > 10 * 60 * 1000) return null;

  const payload = `${projectId}:${timestamp}`;
  const expectedHmac = createHmac("sha256", getEncryptionKey())
    .update(payload)
    .digest("hex");

  if (receivedHmac !== expectedHmac) return null;

  return projectId;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const { clientId, clientSecret } = await getGitHubCredentials();

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(`GitHub OAuth error: ${data.error ?? "no access_token"}`);
  }

  return data.access_token;
}
