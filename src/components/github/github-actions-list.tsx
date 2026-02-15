"use client";

import { useState } from "react";
import {
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconBan,
  IconExternalLink,
  IconRocket,
  IconChevronDown,
  IconChevronRight,
  IconFileText,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { GitHubWorkflowRun, GitHubWorkflowJob, GitHubWorkflowStep } from "@/types/github";
import { rerunGitHubWorkflow, dispatchGitHubWorkflow, fetchGitHubWorkflowJobs, fetchGitHubJobLog } from "@/actions/github";

interface GitHubActionsListProps {
  workflowRuns: GitHubWorkflowRun[];
  projectId: string;
  defaultBranch: string;
}

interface StatusBadgeInfo {
  icon: typeof IconCheck;
  color: string;
  dotColor: string;
  label: string;
  spin: boolean;
}

type ConclusionType = "success" | "failure" | "cancelled" | "skipped" | null;

function getStatusInfo(status: string, conclusion: ConclusionType): StatusBadgeInfo {
  if (status === "queued" || status === "in_progress") {
    return {
      icon: IconLoader2,
      label: status === "queued" ? "Queued" : "In Progress",
      color: "text-yellow-500",
      dotColor: "bg-yellow-500",
      spin: true,
    };
  }

  switch (conclusion) {
    case "success":
      return {
        icon: IconCheck,
        label: "Success",
        color: "text-green-500",
        dotColor: "bg-green-500",
        spin: false,
      };
    case "failure":
      return {
        icon: IconX,
        label: "Failure",
        color: "text-red-500",
        dotColor: "bg-red-500",
        spin: false,
      };
    case "cancelled":
    case "skipped":
      return {
        icon: IconBan,
        label: conclusion === "cancelled" ? "Cancelled" : "Skipped",
        color: "text-gray-400",
        dotColor: "bg-gray-400",
        spin: false,
      };
    default:
      return {
        icon: IconClock,
        label: status,
        color: "text-gray-400",
        dotColor: "bg-gray-400",
        spin: false,
      };
  }
}

function getRunStatusInfo(run: GitHubWorkflowRun): StatusBadgeInfo {
  return getStatusInfo(run.status, run.conclusion as ConclusionType);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt || !completedAt) return null;
  const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function StepStatusIcon({ step }: { step: GitHubWorkflowStep }) {
  const info = getStatusInfo(step.status, step.conclusion as ConclusionType);
  const Icon = info.icon;
  return (
    <Icon className={`h-3 w-3 shrink-0 ${info.color} ${info.spin ? "animate-spin" : ""}`} />
  );
}

function JobSection({
  job,
  projectId,
  logsMap,
  loadingLogId,
  onFetchLog,
}: {
  job: GitHubWorkflowJob;
  projectId: string;
  logsMap: Record<number, string>;
  loadingLogId: number | null;
  onFetchLog: (jobId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const jobStatus = getStatusInfo(job.status, job.conclusion as ConclusionType);
  const JobIcon = jobStatus.icon;
  const duration = formatDuration(job.started_at, job.completed_at);
  const hasLog = logsMap[job.id] !== undefined;
  const isLoadingLog = loadingLogId === job.id;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <JobIcon className={`h-3.5 w-3.5 shrink-0 ${jobStatus.color} ${jobStatus.spin ? "animate-spin" : ""}`} />
        <span className="text-xs font-medium text-foreground truncate">{job.name}</span>
        {duration && (
          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{duration}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-1.5">
          {/* Steps */}
          {job.steps.length > 0 && (
            <div className="space-y-1">
              {job.steps.map((step) => {
                const stepDuration = formatDuration(step.started_at, step.completed_at);
                return (
                  <div key={step.number} className="flex items-center gap-2 text-xs">
                    <StepStatusIcon step={step} />
                    <span className="text-muted-foreground truncate">{step.name}</span>
                    {stepDuration && (
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {stepDuration}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* View Log button */}
          <div className="pt-1">
            <button
              onClick={() => onFetchLog(job.id)}
              disabled={isLoadingLog}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {isLoadingLog ? (
                <IconLoader2 className="h-3 w-3 animate-spin" />
              ) : (
                <IconFileText className="h-3 w-3" />
              )}
              {hasLog ? "Refresh log" : "View log"}
            </button>
          </div>

          {/* Log output */}
          {hasLog && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-black/80 p-3 text-[10px] leading-relaxed text-green-400 font-mono">
              {logsMap[job.id]}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function GitHubActionsList({
  workflowRuns,
  projectId,
  defaultBranch,
}: GitHubActionsListProps) {
  const [rerunningIds, setRerunningIds] = useState<Set<number>>(new Set());
  const [dispatching, setDispatching] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const [jobsMap, setJobsMap] = useState<Record<number, GitHubWorkflowJob[]>>({});
  const [logsMap, setLogsMap] = useState<Record<number, string>>({});
  const [loadingJobsRunId, setLoadingJobsRunId] = useState<number | null>(null);
  const [loadingLogId, setLoadingLogId] = useState<number | null>(null);

  const workflowId = workflowRuns.length > 0 ? workflowRuns[0].workflow_id : null;
  const workflowName = workflowRuns.length > 0 ? workflowRuns[0].name : null;

  async function handleRerun(runId: number, runName: string) {
    setRerunningIds((prev) => new Set(prev).add(runId));
    try {
      const result = await rerunGitHubWorkflow(projectId, runId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Re-running "${runName}"`);
      }
    } catch {
      toast.error("Failed to re-run workflow");
    } finally {
      setRerunningIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  async function handleDispatch() {
    if (!workflowId) return;
    setDispatching(true);
    try {
      const result = await dispatchGitHubWorkflow(projectId, workflowId, defaultBranch);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Workflow "${workflowName}" triggered on ${defaultBranch}`);
      }
    } catch {
      toast.error("Failed to trigger workflow");
    } finally {
      setDispatching(false);
    }
  }

  async function handleToggleRun(runId: number) {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);

    // Fetch jobs if not already cached
    if (!jobsMap[runId]) {
      setLoadingJobsRunId(runId);
      try {
        const result = await fetchGitHubWorkflowJobs(projectId, runId);
        if (result.error) {
          toast.error(result.error);
        } else if (result.jobs) {
          setJobsMap((prev) => ({ ...prev, [runId]: result.jobs! }));
        }
      } catch {
        toast.error("Failed to fetch jobs");
      } finally {
        setLoadingJobsRunId(null);
      }
    }
  }

  async function handleFetchLog(jobId: number) {
    setLoadingLogId(jobId);
    try {
      const result = await fetchGitHubJobLog(projectId, jobId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.log !== undefined) {
        setLogsMap((prev) => ({ ...prev, [jobId]: result.log! }));
      }
    } catch {
      toast.error("Failed to fetch log");
    } finally {
      setLoadingLogId(null);
    }
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            GitHub Actions
          </h3>
          {workflowName && (
            <p className="mt-0.5 text-xs text-muted-foreground">{workflowName}</p>
          )}
        </div>
        {workflowId && (
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {dispatching ? (
              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <IconRocket className="h-3.5 w-3.5" />
            )}
            Run workflow
          </button>
        )}
      </div>

      {workflowRuns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workflow runs</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          <div className="flex flex-col gap-0">
            {workflowRuns.map((run, idx) => {
              const status = getRunStatusInfo(run);
              const StatusIcon = status.icon;
              const isCompleted = run.status === "completed";
              const isRerunning = rerunningIds.has(run.id);
              const isLast = idx === workflowRuns.length - 1;
              const isExpanded = expandedRunId === run.id;
              const isLoadingJobs = loadingJobsRunId === run.id;
              const jobs = jobsMap[run.id];

              return (
                <div
                  key={run.id}
                  className={`group relative ${!isLast ? "" : ""}`}
                >
                  {/* Run header row */}
                  <div className="flex items-start gap-3 py-2.5">
                    {/* Timeline dot - clickable */}
                    <button
                      onClick={() => handleToggleRun(run.id)}
                      className="relative z-10 mt-1 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-background hover:ring-2 hover:ring-primary/30 transition-shadow"
                      title="Toggle jobs"
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${status.color}`}>
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${status.spin ? "animate-spin" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Content */}
                    <div className="flex flex-1 items-center justify-between min-w-0 gap-2">
                      <button
                        onClick={() => handleToggleRun(run.id)}
                        className="min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground hover:underline line-clamp-1">
                            #{run.run_number}
                          </span>
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {run.head_branch}
                          </span>
                          {isExpanded ? (
                            <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <img
                            src={run.actor.avatar_url}
                            alt={run.actor.login}
                            className="h-3.5 w-3.5 rounded-full"
                          />
                          <span>{run.actor.login}</span>
                          <span>&middot;</span>
                          <span>{run.event}</span>
                          <span>&middot;</span>
                          <time
                            dateTime={run.created_at}
                            title={formatDate(run.created_at)}
                          >
                            {timeAgo(run.created_at)}
                          </time>
                        </div>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCompleted && (
                          <button
                            onClick={() => handleRerun(run.id, run.name)}
                            disabled={isRerunning}
                            className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                            title="Re-run"
                          >
                            {isRerunning ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <IconPlayerPlay className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="View on GitHub"
                        >
                          <IconExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Jobs & Steps */}
                  {isExpanded && (
                    <div className="ml-[35px] mb-3 space-y-2">
                      {isLoadingJobs ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading jobs...
                        </div>
                      ) : jobs && jobs.length > 0 ? (
                        jobs.map((job) => (
                          <JobSection
                            key={job.id}
                            job={job}
                            projectId={projectId}
                            logsMap={logsMap}
                            loadingLogId={loadingLogId}
                            onFetchLog={handleFetchLog}
                          />
                        ))
                      ) : jobs && jobs.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1">No jobs found</p>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
