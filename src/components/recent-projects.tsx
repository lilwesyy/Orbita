"use client";

import Link from "next/link";
import { IconFolderCode } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";

interface RecentProject {
  id: string;
  name: string;
  clientName: string;
  status: string;
  updatedAt: string;
}

interface RecentProjectsProps {
  projects: RecentProject[];
}

type BadgeVariant = "default" | "warning" | "secondary" | "success" | "destructive";

const statusConfig: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  PROPOSAL: { label: "Proposal", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-0 flex flex-row justify-between items-center">
        <CardTitle>Recent Projects</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <Empty className="border-none py-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFolderCode />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                Create your first project to get started.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y divide-border">
            {projects.map((project) => {
              const config = statusConfig[project.status] ?? {
                label: project.status,
                variant: "secondary" as const,
              };
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.clientName} &middot;{" "}
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={config.variant}>
                      {config.label}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
