import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CredentialVault } from "@/components/credential-vault";

interface ProjectCredentialsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectCredentialsPage({
  params,
}: ProjectCredentialsPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      credentials: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          category: true,
          username: true,
          password: true,
          url: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Map credentials — expose hasPassword flag, never send encrypted password to client
  const credentials = project.credentials.map((c) => ({
    id: c.id,
    label: c.label,
    category: c.category,
    username: c.username,
    url: c.url,
    notes: c.notes,
    hasPassword: !!c.password,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Credentials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Securely manage credentials for {project.name}
        </p>
      </div>
      <CredentialVault credentials={credentials} projectId={project.id} />
    </div>
  );
}
