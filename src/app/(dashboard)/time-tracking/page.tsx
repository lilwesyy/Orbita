import { prisma } from "@/lib/prisma";
import { TimerWidget } from "@/components/timer-widget";
import { TimeEntryTable } from "@/components/time-entry-table";
import { TimeEntryForm } from "@/components/time-entry-form";
import { TempoTabs } from "@/components/tempo-tabs";

export default async function TimeTrackingPage() {
  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        where: {
          status: { not: "DONE" },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const timeEntries = await prisma.timeEntry.findMany({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      duration: true,
      hourlyRate: true,
      notes: true,
      projectId: true,
      taskId: true,
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { startTime: "desc" },
    take: 200,
  });

  const projectsForSelectors = projects.map((p) => ({
    id: p.id,
    name: p.name,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
    })),
  }));

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Time Tracking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage your working hours
        </p>
      </div>
      <TimerWidget projects={projectsForSelectors} />
      <TempoTabs
        tableContent={<TimeEntryTable timeEntries={timeEntries} />}
        formContent={<TimeEntryForm projects={projectsForSelectors} />}
      />
    </div>
  );
}
