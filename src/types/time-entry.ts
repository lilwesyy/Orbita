import type { TimeEntry, Project, Task, Prisma } from "@/generated/prisma/client";

export interface TimeEntryWithRelations extends TimeEntry {
  project: Project;
  task: Task | null;
}

export interface TimeEntryListItem {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  hourlyRate: Prisma.Decimal | null;
  notes: string | null;
  projectId: string;
  taskId: string | null;
  project: { id: string; name: string };
  task: { id: string; title: string } | null;
}

export interface TimeEntryFormData {
  startTime: string;
  endTime: string;
  duration: string;
  hourlyRate: string;
  notes: string;
  projectId: string;
  taskId: string;
}
