import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TasksView } from "@/components/tasks-view";
import { TaskViewToggle } from "@/components/task-view-toggle";
import { CreateTaskDialog } from "@/components/task-list";

interface ProjectTasksPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          subtasks: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tasks for {project.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <TaskViewToggle />
          </Suspense>
          <CreateTaskDialog projectId={project.id} />
        </div>
      </div>
      <Suspense>
        <TasksView tasks={project.tasks} projectId={project.id} />
      </Suspense>
    </div>
  );
}
