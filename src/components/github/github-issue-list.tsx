import { IconCircleDot } from "@tabler/icons-react";
import type { GitHubIssue } from "@/types/github";

interface GitHubIssueListProps {
  issues: GitHubIssue[];
}

export function GitHubIssueList({ issues }: GitHubIssueListProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Open Issues
      </h3>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open issues</p>
      ) : (
        <div className="flex flex-col gap-3">
          {issues.map((issue) => (
            <div key={issue.number} className="flex items-start gap-2">
              <IconCircleDot className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground hover:underline line-clamp-1"
                >
                  {issue.title}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    #{issue.number}
                  </span>
                  {issue.labels.map((label) => (
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
                  {issue.comments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {issue.comments} comments
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
