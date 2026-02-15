"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ListChecks,
  Clock,
  Wallet,
  FileText,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
  Pencil,
  Trash2,
  MoreVertical,
  ArrowRight,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ProjectLogoUpload } from "@/components/project-logo-upload";
import { ProjectForm } from "@/components/project-form";
import ConfirmModal from "@/components/confirm-modal";
import { deleteProject, updateProjectInDialog } from "@/actions/projects";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import type { ProjectStatus, Client } from "@/generated/prisma/client";

// --- Types ---

interface HealthCheckResult {
  online: boolean;
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  brandProfile: string | null;
  seoAudit: string | null;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  hourlyRate: string | null;
  clientId: string;
  client: { id: string; name: string; company: string | null };
}

interface TaskBreakdown {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  completionPercent: number;
  subtaskTotal: number;
  subtaskDone: number;
}

interface TimeStats {
  totalMinutes: number;
  totalHours: number;
  totalEarned: number;
}

interface BudgetStats {
  budgetRaw: number;
  consumed: number;
  consumedPercent: number;
  remaining: number;
}

interface InvoiceStats {
  count: number;
  totalInvoiced: number;
  totalPaid: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
}

interface RecentActivityEntry {
  id: string;
  date: string;
  taskTitle: string | null;
  durationMinutes: number | null;
  notes: string | null;
}

interface ProjectSummaryProps {
  project: ProjectData;
  clients: Client[];
  taskBreakdown: TaskBreakdown;
  timeStats: TimeStats;
  budgetStats: BudgetStats;
  invoiceStats: InvoiceStats;
  recentActivity: RecentActivityEntry[];
}

// --- Helpers ---

type BadgeVariant = "default" | "warning" | "secondary" | "success" | "destructive";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PROPOSAL: { label: "Proposal", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

// --- Component ---

export function ProjectSummary({
  project,
  clients,
  taskBreakdown,
  timeStats,
  budgetStats,
  invoiceStats,
  recentActivity,
}: ProjectSummaryProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    if (!project.websiteUrl) return;
    setHealthLoading(true);
    fetch(`/api/projects/${project.id}/health-check`)
      .then((res) => res.json() as Promise<HealthCheckResult>)
      .then(setHealthCheck)
      .catch(() => setHealthCheck({ online: false, statusCode: null, responseTime: null, error: "Check failed" }))
      .finally(() => setHealthLoading(false));
  }, [project.id, project.websiteUrl]);

  const websiteHref = project.websiteUrl
    ? /^https?:\/\//i.test(project.websiteUrl) ? project.websiteUrl : `https://${project.websiteUrl}`
    : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProject(project.id);
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } else {
      toast.success("Project deleted");
    }
  };

  const boundUpdateProject = updateProjectInDialog.bind(null, project.id);

  const status = statusConfig[project.status];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* #1 Back button */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects" aria-label="Back to projects">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <ProjectLogoUpload
            projectId={project.id}
            projectName={project.name}
            logoUrl={project.logoUrl}
          />
          <div>
            {/* #2 text-3xl for consistency */}
            <h1 className="text-3xl font-bold text-foreground">
              {project.name}
            </h1>
            {/* #4 Client name as link */}
            <p className="text-muted-foreground">
              <Link
                href={`/clients/${project.client.id}`}
                className="hover:text-foreground transition-colors hover:underline underline-offset-4"
              >
                {project.client.name}
              </Link>
              {project.client.company && ` — ${project.client.company}`}
            </p>
            {project.websiteUrl && websiteHref && (
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
                >
                  <Globe className="size-3.5" />
                  <span className="truncate max-w-[250px]">
                    {project.websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <ExternalLink className="size-3" />
                </a>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center">
                        {healthLoading ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        ) : healthCheck?.online ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            Online
                          </span>
                        ) : healthCheck ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Offline
                          </span>
                        ) : null}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {healthLoading ? (
                        "Checking..."
                      ) : healthCheck?.online ? (
                        <span>
                          Status {healthCheck.statusCode} — {healthCheck.responseTime}ms
                        </span>
                      ) : healthCheck ? (
                        <span>{healthCheck.error || `Status ${healthCheck.statusCode}`}</span>
                      ) : null}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
        {/* #5 Actions in dropdown */}
        <div className="flex shrink-0 flex-col gap-2 sm:self-start sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {(project.startDate || project.endDate) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />
                {project.startDate ? formatDate(project.startDate) : "—"}
                {" → "}
                {project.endDate ? formatDate(project.endDate) : "—"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowEditDialog(true)}>
            <Pencil /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pencil />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>

      {/* STATS ROW — #6 Clickable cards */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Tasks */}
        <Link href={`/projects/${project.id}/tasks`} className="group">
          <Card className="@container/card transition-shadow group-hover:shadow-md">
            <CardHeader>
              <CardDescription>Tasks</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {taskBreakdown.done}/{taskBreakdown.total}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <ListChecks className="size-3" />
                  {taskBreakdown.completionPercent}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {taskBreakdown.total > 0
                  ? `${taskBreakdown.completionPercent}% complete`
                  : "No tasks yet"}
                {taskBreakdown.total > 0 && <TrendingUp className="size-4" />}
              </div>
              <div className="text-muted-foreground">
                {taskBreakdown.inProgress > 0
                  ? `${taskBreakdown.inProgress} in progress`
                  : `${taskBreakdown.todo} to do`}
              </div>
            </CardFooter>
          </Card>
        </Link>

        {/* Hours */}
        <Link href={`/projects/${project.id}/time`} className="group">
          <Card className="@container/card transition-shadow group-hover:shadow-md">
            <CardHeader>
              <CardDescription>Hours Logged</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {timeStats.totalHours.toFixed(1)}h
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Clock className="size-3" />
                  Time
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {timeStats.totalEarned > 0
                  ? `${formatCurrency(timeStats.totalEarned)} earned`
                  : "No time logged"}
              </div>
              <div className="text-muted-foreground">
                {timeStats.totalMinutes > 0
                  ? formatDuration(timeStats.totalMinutes)
                  : "0 minutes total"}
              </div>
            </CardFooter>
          </Card>
        </Link>

        {/* Budget */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {budgetStats.budgetRaw > 0
                ? `${budgetStats.consumedPercent}%`
                : "—"}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Wallet className="size-3" />
                {budgetStats.budgetRaw > 0 ? "Used" : "N/A"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {budgetStats.budgetRaw > 0
                ? `${formatCurrency(budgetStats.consumed)} of ${formatCurrency(budgetStats.budgetRaw)}`
                : "No budget set"}
            </div>
            <div className="text-muted-foreground">
              {budgetStats.remaining > 0
                ? `${formatCurrency(budgetStats.remaining)} remaining`
                : budgetStats.budgetRaw > 0
                  ? "Budget exhausted"
                  : "Set a budget to track spending"}
            </div>
          </CardFooter>
        </Card>

        {/* Invoiced */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Invoiced</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(invoiceStats.totalInvoiced)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <FileText className="size-3" />
                {invoiceStats.count}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {invoiceStats.totalPaid > 0
                ? `${formatCurrency(invoiceStats.totalPaid)} paid`
                : "Nothing paid yet"}
            </div>
            <div className="text-muted-foreground">
              {invoiceStats.overdue > 0
                ? `${invoiceStats.overdue} overdue`
                : invoiceStats.draft > 0
                  ? `${invoiceStats.draft} draft`
                  : `${invoiceStats.count} invoices total`}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* TWO COLUMNS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Task Breakdown — #8 View all action */}
        <Card>
          <CardHeader>
            <CardTitle>Task Breakdown</CardTitle>
            <CardDescription>
              {taskBreakdown.total} tasks, {taskBreakdown.subtaskTotal} subtasks
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${project.id}/tasks`}>
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskBreakdown.total > 0 ? (
              <>
                {/* Horizontal stacked bar */}
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  {taskBreakdown.done > 0 && (
                    <div
                      className="bg-primary cursor-pointer transition-all hover:opacity-80"
                      title={`Done: ${taskBreakdown.done}`}
                      style={{
                        width: `${(taskBreakdown.done / taskBreakdown.total) * 100}%`,
                      }}
                    />
                  )}
                  {taskBreakdown.inProgress > 0 && (
                    <div
                      className="bg-primary/60 cursor-pointer transition-all hover:opacity-80"
                      title={`In Progress: ${taskBreakdown.inProgress}`}
                      style={{
                        width: `${(taskBreakdown.inProgress / taskBreakdown.total) * 100}%`,
                      }}
                    />
                  )}
                  {taskBreakdown.todo > 0 && (
                    <div
                      className="bg-muted cursor-pointer transition-all hover:opacity-80"
                      title={`To Do: ${taskBreakdown.todo}`}
                      style={{
                        width: `${(taskBreakdown.todo / taskBreakdown.total) * 100}%`,
                      }}
                    />
                  )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-primary" />
                    Done ({taskBreakdown.done})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-primary/60" />
                    In Progress ({taskBreakdown.inProgress})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-muted" />
                    To Do ({taskBreakdown.todo})
                  </div>
                </div>
                {/* Subtask info */}
                {taskBreakdown.subtaskTotal > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Subtasks: {taskBreakdown.subtaskDone}/{taskBreakdown.subtaskTotal} completed
                  </p>
                )}
              </>
            ) : (
              /* #7 Proper empty state */
              <Empty className="border-none py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListChecks />
                  </EmptyMedia>
                  <EmptyTitle>No tasks yet</EmptyTitle>
                  <EmptyDescription>
                    Create tasks to track project progress.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity — #8 View all action */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest time entries</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${project.id}/time`}>
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-0">
                {recentActivity.map((entry, i) => (
                  <div key={entry.id}>
                    {i > 0 && <Separator className="my-3" />}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {entry.taskTitle ? (
                          <Link
                            href={`/projects/${project.id}/tasks`}
                            className="text-sm font-medium truncate block hover:underline underline-offset-4"
                          >
                            {entry.taskTitle}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium truncate text-muted-foreground">
                            No task
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {entry.durationMinutes
                            ? formatDuration(entry.durationMinutes)
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* #7 Proper empty state */
              <Empty className="border-none py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Clock />
                  </EmptyMedia>
                  <EmptyTitle>No activity yet</EmptyTitle>
                  <EmptyDescription>
                    Time entries will appear here as you log work.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      {/* #9 Description only — removed redundant details card */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground text-sm">
              {project.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl sm:max-w-xl gap-0 px-0 pt-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="px-6 pb-6">
              <ProjectForm
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  websiteUrl: project.websiteUrl,
                  logoUrl: project.logoUrl,
                  brandProfile: project.brandProfile ?? null,
                  seoAudit: project.seoAudit ?? null,
                  status: project.status,
                  startDate: project.startDate ? new Date(project.startDate) : null,
                  endDate: project.endDate ? new Date(project.endDate) : null,
                  budget: project.budget,
                  hourlyRate: project.hourlyRate,
                  clientId: project.clientId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
                clients={clients}
                action={boundUpdateProject}
                onSuccess={() => setShowEditDialog(false)}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
