import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailConfigForm } from "@/components/email-config-form";
import { EmailInbox } from "@/components/email-inbox";

interface ProjectEmailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectEmailPage({ params }: ProjectEmailPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { emailConfig: true },
  });

  if (!project) {
    notFound();
  }

  if (!project.emailConfig) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailConfigForm projectId={id} config={null} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4 py-4 lg:px-6">
      <EmailInbox projectId={id} />
    </div>
  );
}
