"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client, ProjectStatus } from "@/generated/prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteProject } from "@/actions/projects";
import ConfirmModal from "./confirm-modal";

interface SerializedProject {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  budget: string | null;
  hourlyRate: string | null;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  client: Client;
}

interface ProjectDetailProps {
  project: SerializedProject;
}

type BadgeVariant = "default" | "warning" | "secondary" | "success" | "destructive";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PROPOSAL: { label: "Proposal", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    const result = await deleteProject(project.id);
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Project deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground">{project.client.name}</p>
          </div>
          <Badge variant={statusConfig[project.status].variant}>
            {statusConfig[project.status].label}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href={`/projects/${project.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Client</h3>
              <p className="text-foreground">{project.client.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <p className="text-foreground">{statusConfig[project.status].label}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h3>
              <p className="text-foreground">{project.startDate ? formatDate(project.startDate) : "\u2014"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">End Date</h3>
              <p className="text-foreground">{project.endDate ? formatDate(project.endDate) : "\u2014"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Budget</h3>
              <p className="text-foreground">{project.budget ? formatCurrency(project.budget) : "\u2014"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Hourly Rate</h3>
              <p className="text-foreground">{project.hourlyRate ? `${formatCurrency(project.hourlyRate)}/h` : "\u2014"}</p>
            </div>
          </div>
          {project.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="whitespace-pre-wrap text-foreground">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

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
