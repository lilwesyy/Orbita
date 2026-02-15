import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/project-form";
import { updateProject } from "@/actions/projects";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  const [project, clients] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
    }),
    prisma.client.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!project) {
    notFound();
  }

  const boundUpdateProject = updateProject.bind(null, id);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${id}`}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Edit Project</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <ProjectForm
          project={{
            ...project,
            budget: project.budget ? String(project.budget) : null,
            hourlyRate: project.hourlyRate ? String(project.hourlyRate) : null,
          }}
          clients={clients}
          action={boundUpdateProject}
        />
      </div>
    </div>
  );
}
