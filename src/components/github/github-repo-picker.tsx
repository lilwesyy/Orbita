"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch, IconLock, IconWorld } from "@tabler/icons-react";
import { fetchGitHubRepos } from "@/actions/github";
import { saveGitHubRepo } from "@/actions/github-config";
import type { GitHubRepo } from "@/types/github";

interface GitHubRepoPickerProps {
  projectId: string;
}

export function GitHubRepoPicker({ projectId }: GitHubRepoPickerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchGitHubRepos(projectId).then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.repos) {
        setRepos(result.repos);
      }
      setLoading(false);
    });
  }, [projectId]);

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(repo: GitHubRepo) {
    startTransition(async () => {
      await saveGitHubRepo(
        projectId,
        repo.owner.login,
        repo.name,
        repo.full_name
      );
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading repositories...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<IconSearch className="h-4 w-4" />}
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((repo) => (
          <button
            key={repo.id}
            onClick={() => handleSelect(repo)}
            disabled={isPending}
            className="flex flex-col gap-1 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              {repo.private ? (
                <IconLock className="h-3.5 w-3.5 text-yellow-500" />
              ) : (
                <IconWorld className="h-3.5 w-3.5 text-green-500" />
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {repo.full_name}
              </span>
            </div>
            {repo.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {repo.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {repo.language && <span>{repo.language}</span>}
              <span>&#9733; {repo.stargazers_count}</span>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No repositories found
        </p>
      )}
    </div>
  );
}
