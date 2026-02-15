"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectForm } from "@/components/project-form";
import {
  createProjectInDialog,
  updateProjectInDialog,
  getProjectById,
} from "@/actions/projects";
import type { Client } from "@/generated/prisma/client";

// --- Create Dialog ---

interface ProjectCreateDialogProps {
  clients: Client[];
}

export default function ProjectCreateDialog({ clients }: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus /> New Project</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl sm:max-w-xl gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a new project
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6">
            <ProjectForm
              clients={clients}
              action={createProjectInDialog}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog ---

interface ProjectEditDialogProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}

export function ProjectEditDialog({
  projectId,
  open,
  onOpenChange,
  clients,
}: ProjectEditDialogProps) {
  const [project, setProject] = useState<Awaited<ReturnType<typeof getProjectById>>>(null);
  const [isLoading, startLoading] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open && projectId) {
      setProject(null);
      startLoading(async () => {
        const data = await getProjectById(projectId);
        setProject(data);
        setFormKey((k) => k + 1);
      });
    }
  }, [open, projectId]);

  const boundUpdate = projectId
    ? updateProjectInDialog.bind(null, projectId)
    : createProjectInDialog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : project ? (
              <ProjectForm
                key={formKey}
                project={project}
                clients={clients}
                action={boundUpdate}
                onSuccess={() => onOpenChange(false)}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
