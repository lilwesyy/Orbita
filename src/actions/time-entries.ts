"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface TimeEntryActionResult {
  error?: string;
  success?: boolean;
}

interface TimerActionResult {
  error?: string;
  success?: boolean;
  timeEntryId?: string;
}

export async function createTimeEntry(
  prevState: TimeEntryActionResult,
  formData: FormData
): Promise<TimeEntryActionResult> {
  const projectId = formData.get("projectId") as string;
  const taskId = formData.get("taskId") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const manualDuration = formData.get("duration") as string;
  const hourlyRateStr = formData.get("hourlyRate") as string;
  const notes = formData.get("notes") as string;

  if (!projectId) {
    return { error: "Project is required" };
  }

  if (!startTimeStr) {
    return { error: "Start time is required" };
  }

  const startTime = new Date(startTimeStr);

  if (isNaN(startTime.getTime())) {
    return { error: "Invalid start date/time" };
  }

  let endTime: Date | null = null;
  let duration: number | null = null;

  if (endTimeStr) {
    endTime = new Date(endTimeStr);
    if (isNaN(endTime.getTime())) {
      return { error: "Invalid end date/time" };
    }
    if (endTime <= startTime) {
      return { error: "End time must be after start time" };
    }
    duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  } else if (manualDuration) {
    const parsedDuration = parseInt(manualDuration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return { error: "Duration must be a positive number" };
    }
    duration = parsedDuration;
  } else {
    return { error: "Enter end time or manual duration" };
  }

  const hourlyRate = hourlyRateStr ? parseFloat(hourlyRateStr) : null;

  try {
    await prisma.timeEntry.create({
      data: {
        startTime,
        endTime,
        duration,
        hourlyRate,
        notes: notes?.trim() || null,
        projectId,
        taskId: taskId || null,
      },
    });
  } catch {
    return { error: "Error creating time entry" };
  }

  revalidatePath("/time-tracking");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { success: true };
}

export async function startTimer(
  prevState: TimerActionResult,
  formData: FormData
): Promise<TimerActionResult> {
  const projectId = formData.get("projectId") as string;
  const taskId = formData.get("taskId") as string;

  if (!projectId) {
    return { error: "Project is required" };
  }

  try {
    const entry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(),
        projectId,
        taskId: taskId || null,
      },
    });

    revalidatePath("/time-tracking");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, timeEntryId: entry.id };
  } catch {
    return { error: "Error starting timer" };
  }
}

export async function stopTimer(timeEntryId: string): Promise<TimerActionResult> {
  if (!timeEntryId) {
    return { error: "Missing entry ID" };
  }

  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    });

    if (!entry) {
      return { error: "Time entry not found" };
    }

    if (entry.endTime) {
      return { error: "Timer has already been stopped" };
    }

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - entry.startTime.getTime()) / 60000
    );

    await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        endTime,
        duration: Math.max(duration, 1),
      },
    });

    revalidatePath("/time-tracking");
    revalidatePath(`/projects/${entry.projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error stopping timer" };
  }
}

export async function deleteTimeEntry(id: string): Promise<TimeEntryActionResult> {
  if (!id) {
    return { error: "Missing entry ID" };
  }

  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return { error: "Time entry not found" };
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    revalidatePath("/time-tracking");
    revalidatePath(`/projects/${entry.projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error deleting time entry" };
  }
}
