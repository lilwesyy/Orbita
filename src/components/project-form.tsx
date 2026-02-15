"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Project, Client } from "@/generated/prisma/client";

interface ProjectFormAction {
  (prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState>;
}

interface ProjectFormState {
  error?: string;
  success?: boolean;
}

type SerializedProject = Omit<Project, "budget" | "hourlyRate"> & {
  budget: string | null;
  hourlyRate: string | null;
};

interface ProjectFormProps {
  project?: SerializedProject;
  clients: Client[];
  action: ProjectFormAction;
  onSuccess?: () => void;
}

const statusOptions = [
  { value: "PROPOSAL", label: "Proposal" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ProjectForm({ project, clients, action, onSuccess }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success(project ? "Project updated" : "Project created");
      onSuccess?.();
    }
  }, [state, project, onSuccess]);

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={project?.name}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={project?.description || ""}
          disabled={isPending}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="text"
          placeholder="example.com"
          defaultValue={project?.websiteUrl || ""}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <Select name="clientId" defaultValue={project?.clientId ?? ""} disabled={isPending} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select name="status" defaultValue={project?.status ?? "PROPOSAL"} disabled={isPending} required>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={formatDateForInput(project?.startDate)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={formatDateForInput(project?.endDate)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (&euro;)</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            step="0.01"
            defaultValue={project?.budget?.toString() || ""}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (&euro;/h)</Label>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            step="0.01"
            defaultValue={project?.hourlyRate?.toString() || ""}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
        >
          {project ? <><Save /> Update Project</> : <><Plus /> Create Project</>}
        </Button>
      </div>
    </form>
  );
}
