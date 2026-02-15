import type { GitHubCommit } from "@/types/github";

interface GitHubCommitListProps {
  commits: GitHubCommit[];
}

export function GitHubCommitList({ commits }: GitHubCommitListProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Recent Commits
      </h3>
      {commits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commits found</p>
      ) : (
        <div className="flex flex-col gap-3">
          {commits.map((commit) => {
            const firstLine = commit.commit.message.split("\n")[0];
            const date = new Date(commit.commit.author.date);
            return (
              <div key={commit.sha} className="flex items-start gap-3">
                {commit.author ? (
                  <img
                    src={commit.author.avatar_url}
                    alt={commit.author.login}
                    className="h-6 w-6 rounded-full mt-0.5"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground hover:underline line-clamp-1"
                  >
                    {firstLine}
                  </a>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{commit.commit.author.name}</span>
                    <span>&middot;</span>
                    <code className="text-xs">{commit.sha.slice(0, 7)}</code>
                    <span>&middot;</span>
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
