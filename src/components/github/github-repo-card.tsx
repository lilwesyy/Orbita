import {
  IconStar,
  IconGitFork,
  IconEye,
  IconAlertCircle,
  IconLock,
  IconWorld,
} from "@tabler/icons-react";
import type { GitHubRepo } from "@/types/github";

interface GitHubRepoCardProps {
  repo: GitHubRepo;
}

export function GitHubRepoCard({ repo }: GitHubRepoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-foreground hover:underline"
            >
              {repo.full_name}
            </a>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {repo.private ? (
                <>
                  <IconLock className="h-3 w-3" /> Private
                </>
              ) : (
                <>
                  <IconWorld className="h-3 w-3" /> Public
                </>
              )}
            </span>
          </div>
          {repo.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {repo.description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-primary" />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <IconStar className="h-4 w-4" />
          {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <IconGitFork className="h-4 w-4" />
          {repo.forks_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <IconEye className="h-4 w-4" />
          {repo.watchers_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <IconAlertCircle className="h-4 w-4" />
          {repo.open_issues_count} issues
        </span>
        <span>
          Default: <code className="text-xs">{repo.default_branch}</code>
        </span>
      </div>
    </div>
  );
}
