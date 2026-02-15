import { IconGitBranch, IconShieldCheck } from "@tabler/icons-react";
import type { GitHubBranch } from "@/types/github";

interface GitHubBranchListProps {
  branches: GitHubBranch[];
}

export function GitHubBranchList({ branches }: GitHubBranchListProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Branches ({branches.length})
      </h3>
      {branches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No branches found</p>
      ) : (
        <div className="flex flex-col gap-2">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            >
              <IconGitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-sm text-foreground truncate">
                {branch.name}
              </code>
              {branch.protected && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                  <IconShieldCheck className="h-3 w-3" />
                  Protected
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
