import { IconGitPullRequest } from "@tabler/icons-react";
import type { GitHubPullRequest } from "@/types/github";

interface GitHubPrListProps {
  pullRequests: GitHubPullRequest[];
}

export function GitHubPrList({ pullRequests }: GitHubPrListProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Open Pull Requests
      </h3>
      {pullRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open pull requests</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pullRequests.map((pr) => (
            <div key={pr.number} className="flex items-start gap-2">
              <IconGitPullRequest className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground hover:underline line-clamp-1"
                >
                  {pr.title}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>#{pr.number}</span>
                  {pr.draft && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                      Draft
                    </span>
                  )}
                  <span>
                    {pr.head.ref} &rarr; {pr.base.ref}
                  </span>
                  {pr.labels.map((label) => (
                    <span
                      key={label.name}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        color: `#${label.color}`,
                        border: `1px solid #${label.color}40`,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
