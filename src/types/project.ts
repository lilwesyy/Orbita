import type { Project, ProjectStatus, Client, Task, TimeEntry } from "@/generated/prisma/client";

export type { ProjectStatus };

export interface ProjectWithRelations extends Project {
  client: Client;
  tasks: Task[];
  timeEntries: TimeEntry[];
  _count?: {
    tasks: number;
    timeEntries: number;
  };
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  logoUrl: string | null;
  hasEmailConfig: boolean;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: string;
  hourlyRate: string;
  clientId: string;
}
