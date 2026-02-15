"use client";

import { useRouter } from "next/navigation";
import type { GitHubDashboardData } from "@/types/github";
import { GitHubRepoCard } from "./github-repo-card";
import { GitHubCommitList } from "./github-commit-list";
import { GitHubPrList } from "./github-pr-list";
import { GitHubBranchList } from "./github-branch-list";
import { GitHubContributors } from "./github-contributors";
import { GitHubDisconnectButton } from "./github-disconnect-button";
import { GitHubActionsList } from "./github-actions-list";

interface GitHubDashboardProps {
  projectId: string;
  data: GitHubDashboardData;
  repoFullName: string;
}

export function GitHubDashboard({
  projectId,
  data,
  repoFullName,
}: GitHubDashboardProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">GitHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">{repoFullName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Refresh
          </button>
          <GitHubDisconnectButton projectId={projectId} />
        </div>
      </div>

      <GitHubRepoCard repo={data.repo} />

      <GitHubActionsList
        workflowRuns={data.workflowRuns}
        projectId={projectId}
        defaultBranch={data.repo.default_branch}
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <GitHubCommitList commits={data.commits} />
        <GitHubPrList pullRequests={data.pullRequests} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <GitHubBranchList branches={data.branches} />
        <GitHubContributors contributors={data.contributors} />
      </div>
    </>
  );
}
