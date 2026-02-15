"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconArrowLeft,
  IconLoader2,
  IconExternalLink,
  IconBrandGithub,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { GitHubRepoContent } from "@/types/github";
import { fetchGitHubRepoContents, fetchGitHubFileContent } from "@/actions/github";

interface GitHubFileBrowserProps {
  projectId: string;
  repoFullName: string | null;
}

const FILE_ICONS: Record<string, string> = {
  ts: "text-blue-400",
  tsx: "text-blue-400",
  js: "text-yellow-400",
  jsx: "text-yellow-400",
  json: "text-yellow-600",
  md: "text-gray-400",
  css: "text-purple-400",
  scss: "text-pink-400",
  html: "text-orange-400",
  py: "text-green-400",
  rs: "text-orange-500",
  go: "text-cyan-400",
  yml: "text-red-400",
  yaml: "text-red-400",
  toml: "text-red-400",
  lock: "text-gray-500",
  svg: "text-emerald-400",
  png: "text-emerald-400",
  jpg: "text-emerald-400",
  gif: "text-emerald-400",
  ico: "text-emerald-400",
};

function getFileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICONS[ext] ?? "text-muted-foreground";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const textExts = [
    "ts", "tsx", "js", "jsx", "json", "md", "css", "scss", "html",
    "py", "rs", "go", "yml", "yaml", "toml", "txt", "sh", "bash",
    "env", "gitignore", "dockerignore", "dockerfile", "makefile",
    "cfg", "ini", "xml", "sql", "prisma", "graphql", "vue", "svelte",
  ];
  // Also handle dotfiles like .gitignore, .env etc
  if (name.startsWith(".") && !ext) return true;
  return textExts.includes(ext);
}

function sortContents(items: GitHubRepoContent[]): GitHubRepoContent[] {
  return [...items].sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1;
    if (a.type !== "dir" && b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
  });
}

export function GitHubFileBrowser({ projectId, repoFullName }: GitHubFileBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [contents, setContents] = useState<GitHubRepoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filePreview, setFilePreview] = useState<{ path: string; content: string } | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const loadContents = useCallback(async (path: string) => {
    setLoading(true);
    setFilePreview(null);
    try {
      const result = await fetchGitHubRepoContents(projectId, path);
      if (result.error) {
        toast.error(result.error);
        setContents([]);
      } else if (result.contents) {
        setContents(sortContents(result.contents));
      }
    } catch {
      toast.error("Failed to load files");
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadContents(currentPath);
  }, [currentPath, loadContents]);

  function navigateTo(path: string) {
    setCurrentPath(path);
  }

  function navigateUp() {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join("/"));
  }

  async function handleFileClick(item: GitHubRepoContent) {
    if (item.type === "dir") {
      navigateTo(item.path);
      return;
    }

    if (!isPreviewable(item.name)) {
      // Open in GitHub for non-text files
      window.open(item.html_url, "_blank");
      return;
    }

    // Fetch and preview text files
    setLoadingFile(item.path);
    try {
      const result = await fetchGitHubFileContent(projectId, item.path);
      if (result.error) {
        toast.error(result.error);
      } else if (result.content !== undefined) {
        setFilePreview({ path: item.path, content: result.content });
      }
    } catch {
      toast.error("Failed to load file");
    } finally {
      setLoadingFile(null);
    }
  }

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm overflow-x-auto">
        {currentPath && (
          <button
            onClick={navigateUp}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="size-4" />
          </button>
        )}
        <button
          onClick={() => navigateTo("")}
          className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 font-medium text-foreground hover:bg-muted transition-colors"
        >
          <IconBrandGithub className="size-3.5" />
          {repoFullName ?? "Repository"}
        </button>
        {pathParts.map((part, i) => {
          const fullPath = pathParts.slice(0, i + 1).join("/");
          const isLast = i === pathParts.length - 1;
          return (
            <span key={fullPath} className="flex items-center gap-1">
              <IconChevronRight className="size-3 text-muted-foreground shrink-0" />
              {isLast ? (
                <span className="font-medium text-foreground">{part}</span>
              ) : (
                <button
                  onClick={() => navigateTo(fullPath)}
                  className="rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {part}
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <IconFolder className="size-10 mb-2" />
          <p className="text-sm">Empty directory</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          {contents.map((item) => {
            const isDir = item.type === "dir";
            const isLoading = loadingFile === item.path;

            return (
              <button
                key={item.sha}
                onClick={() => handleFileClick(item)}
                disabled={isLoading}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {isDir ? (
                  <IconFolder className="size-4 shrink-0 text-blue-400" />
                ) : isLoading ? (
                  <IconLoader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <IconFile className={`size-4 shrink-0 ${getFileColor(item.name)}`} />
                )}
                <span className="text-sm text-foreground truncate flex-1">{item.name}</span>
                {!isDir && (
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                    {formatFileSize(item.size)}
                  </span>
                )}
                {isDir && (
                  <IconChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* File preview dialog */}
      <Dialog open={filePreview !== null} onOpenChange={(open) => { if (!open) setFilePreview(null); }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-4 py-3 pr-12 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm font-medium truncate">
                  {filePreview?.path.split("/").pop()}
                </DialogTitle>
                <DialogDescription className="text-xs truncate">
                  {filePreview?.path}
                </DialogDescription>
              </div>
              <a
                href={contents.find((c) => c.path === filePreview?.path)?.html_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <IconExternalLink className="size-3" />
                GitHub
              </a>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-xs leading-relaxed font-mono text-foreground whitespace-pre-wrap break-words">
              {filePreview?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
