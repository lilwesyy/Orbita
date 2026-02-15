"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/client";

const MAX_SUBTASKS_PER_TASK = 20;

interface TaskActionResult {
  error?: string;
  success?: boolean;
}

interface SubtaskInput {
  title: string;
  completed: boolean;
}

function parseSubtasks(raw: string | null): SubtaskInput[] {
  if (!raw) return [];
  try {
    const parsed: SubtaskInput[] = JSON.parse(raw);
    return parsed.filter((s) => s.title.trim() !== "");
  } catch {
    return [];
  }
}

export async function createTask(
  projectId: string,
  _prevState: TaskActionResult,
  formData: FormData
): Promise<TaskActionResult> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";
  const subtasksRaw = formData.get("subtasks") as string | null;
  const subtasks = parseSubtasks(subtasksRaw);

  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  if (subtasks.length > MAX_SUBTASKS_PER_TASK) {
    return { error: `Maximum ${MAX_SUBTASKS_PER_TASK} subtasks per task` };
  }

  try {
    await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        projectId,
        subtasks: {
          create: subtasks.map((s, i) => ({
            title: s.title.trim(),
            completed: s.completed,
            order: i,
          })),
        },
      },
    });
  } catch {
    return { error: "Error creating task" };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  projectId: string
): Promise<TaskActionResult> {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  } catch {
    return { error: "Error updating status" };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(
  taskId: string,
  projectId: string,
  _prevState: TaskActionResult,
  formData: FormData
): Promise<TaskActionResult> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as TaskPriority) || "MEDIUM";
  const status = (formData.get("status") as TaskStatus) || "TODO";
  const subtasksRaw = formData.get("subtasks") as string | null;
  const subtasks = parseSubtasks(subtasksRaw);

  if (!title || title.trim() === "") {
    return { error: "Title is required" };
  }

  if (subtasks.length > MAX_SUBTASKS_PER_TASK) {
    return { error: `Maximum ${MAX_SUBTASKS_PER_TASK} subtasks per task` };
  }

  try {
    await prisma.$transaction([
      prisma.subtask.deleteMany({ where: { taskId } }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          priority,
          status,
          subtasks: {
            create: subtasks.map((s, i) => ({
              title: s.title.trim(),
              completed: s.completed,
              order: i,
            })),
          },
        },
      }),
    ]);
  } catch {
    return { error: "Error updating task" };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function toggleSubtask(
  subtaskId: string,
  projectId: string,
  currentCompleted: boolean
): Promise<TaskActionResult> {
  try {
    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completed: !currentCompleted },
    });
  } catch {
    return { error: "Error toggling subtask" };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteTask(
  taskId: string,
  projectId: string
): Promise<TaskActionResult> {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
  } catch {
    return { error: "Error deleting task" };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
