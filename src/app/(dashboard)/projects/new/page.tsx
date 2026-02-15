import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/project-form";
import { createProject } from "@/actions/projects";
import Link from "next/link";

export default async function NewProjectPage() {
  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div className="flex items-center gap-4">
        <Link
          href="/projects"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">New Project</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new project for a client
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <ProjectForm clients={clients} action={createProject} />
      </div>
    </div>
  );
}
