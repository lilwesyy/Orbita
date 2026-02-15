import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectTimeEntries } from "@/components/project-time-entries";
import type { TimeEntryWithRelations } from "@/types/time-entry";

interface ProjectTimePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectTimePage({ params }: ProjectTimePageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      timeEntries: {
        include: { task: true },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Serialize Decimal fields to plain numbers for client component compatibility
  const serializedProject = {
    ...project,
    budget: project.budget ? Number(project.budget) : null,
    hourlyRate: project.hourlyRate ? Number(project.hourlyRate) : null,
  };

  const timeEntries = project.timeEntries.map((te) => ({
    ...te,
    hourlyRate: te.hourlyRate ? Number(te.hourlyRate) : null,
    project: serializedProject,
  })) as unknown as TimeEntryWithRelations[];

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Time entries for {project.name}
        </p>
      </div>
      <ProjectTimeEntries timeEntries={timeEntries} projectId={project.id} />
    </div>
  );
}
