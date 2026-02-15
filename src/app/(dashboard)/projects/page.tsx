import { prisma } from "@/lib/prisma";
import { ProjectTable } from "@/components/project-table";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all your projects
        </p>
      </div>
      <ProjectTable
        projects={projects.map((p) => ({
          ...p,
          budget: p.budget ? String(p.budget) : null,
          hourlyRate: p.hourlyRate ? String(p.hourlyRate) : null,
        }))}
        clients={clients}
      />
    </div>
  );
}
