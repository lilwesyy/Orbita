import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { verifyOAuthState, exchangeCodeForToken } from "@/lib/github-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/projects?error=github_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/projects?error=github_missing_params", request.url)
    );
  }

  const projectId = verifyOAuthState(state);
  if (!projectId) {
    console.error("[GitHub OAuth] Invalid state:", state);
    return NextResponse.redirect(
      new URL("/projects?error=github_invalid_state", request.url)
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const encryptedToken = encrypt(accessToken);

    await prisma.gitHubConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        accessToken: encryptedToken,
      },
      update: {
        accessToken: encryptedToken,
        repoOwner: null,
        repoName: null,
        repoFullName: null,
      },
    });

    return NextResponse.redirect(
      new URL(`/projects/${projectId}/github`, request.url)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GitHub OAuth] Callback error:", message);
    return NextResponse.redirect(
      new URL(`/projects/${projectId}/github?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
