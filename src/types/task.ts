import type { Task, TaskStatus, TaskPriority, Project } from "@/generated/prisma/client";

export type { TaskStatus, TaskPriority };

export interface TaskWithRelations extends Task {
  project: Project;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
}
