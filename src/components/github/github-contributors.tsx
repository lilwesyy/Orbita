import type { GitHubContributor } from "@/types/github";

interface GitHubContributorsProps {
  contributors: GitHubContributor[];
}

export function GitHubContributors({ contributors }: GitHubContributorsProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Contributors ({contributors.length})
      </h3>
      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contributors found</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {contributors.map((c) => (
            <a
              key={c.login}
              href={c.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <img
                src={c.avatar_url}
                alt={c.login}
                className="h-8 w-8 rounded-full"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.login}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.contributions} commits
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
