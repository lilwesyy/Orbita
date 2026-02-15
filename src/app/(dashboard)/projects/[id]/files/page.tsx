import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconBrandGithub } from "@tabler/icons-react";
import { GitHubFileBrowser } from "@/components/github/github-file-browser";

interface ProjectFilesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      githubConfig: {
        select: { repoFullName: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const repoFullName = project.githubConfig?.repoFullName ?? null;

  if (!repoFullName) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="items-center justify-items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <IconBrandGithub className="h-7 w-7 text-foreground" />
            </div>
            <CardTitle>No Repository Connected</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">
              Connect a GitHub repository in the GitHub tab to browse files.
            </p>
            <Link
              href={`/projects/${id}/github`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <IconBrandGithub className="h-4 w-4" />
              Connect with GitHub
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>Repository Files</CardTitle>
          <CardDescription>{repoFullName}</CardDescription>
        </CardHeader>
        <CardContent>
          <GitHubFileBrowser projectId={project.id} repoFullName={repoFullName} />
        </CardContent>
      </Card>
    </div>
  );
}
