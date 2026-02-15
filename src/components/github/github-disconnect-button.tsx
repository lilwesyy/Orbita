"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGitHubConfig } from "@/actions/github-config";

interface GitHubDisconnectButtonProps {
  projectId: string;
}

export function GitHubDisconnectButton({
  projectId,
}: GitHubDisconnectButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDisconnect() {
    startTransition(async () => {
      await deleteGitHubConfig(projectId);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Disconnect?</span>
        <button
          onClick={handleDisconnect}
          disabled={isPending}
          className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
    >
      Disconnect
    </button>
  );
}
