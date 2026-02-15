import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getGitHubConfig } from "@/actions/github-config";
import { fetchGitHubDashboard } from "@/actions/github";
import { getGitHubAuthUrl } from "@/lib/github-oauth";
import { getSettings } from "@/actions/settings";
import { GitHubConnectCard } from "@/components/github/github-connect-card";
import { GitHubRepoPicker } from "@/components/github/github-repo-picker";
import { GitHubDashboard } from "@/components/github/github-dashboard";

interface GitHubPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function GitHubPage({ params, searchParams }: GitHubPageProps) {
  const { id } = await params;
  const { error: oauthError } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  // Check if GitHub credentials are configured in settings
  const { hasGithubCredentials } = await getSettings();

  if (!hasGithubCredentials) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <GitHubConnectCard
          mode="setup"
          settingsUrl="/settings"
        />
      </div>
    );
  }

  const config = await getGitHubConfig(id);

  // No config — show connect card
  if (!config) {
    const authUrl = await getGitHubAuthUrl(id);
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <GitHubConnectCard mode="connect" authUrl={authUrl} error={oauthError} />
      </div>
    );
  }

  // Config without repo — show picker
  if (!config.repoOwner || !config.repoName) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">GitHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a repository for {project.name}
          </p>
        </div>
        <GitHubRepoPicker projectId={id} />
      </div>
    );
  }

  // Full config — fetch and show dashboard
  const result = await fetchGitHubDashboard(id);

  if (result.error) {
    const authUrl = await getGitHubAuthUrl(id);
    return (
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">GitHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.repoFullName}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-destructive font-medium">{result.error}</p>
          {result.needsReconnect && (
            <a
              href={authUrl}
              className="mt-3 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Reconnect GitHub
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <GitHubDashboard
        projectId={id}
        data={result.data!}
        repoFullName={config.repoFullName!}
      />
    </div>
  );
}
