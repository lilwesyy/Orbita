import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientForm from "@/components/client-form";
import { updateClient } from "@/actions/clients";
import Link from "next/link";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  const updateClientWithId = updateClient.bind(null, id);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div className="flex items-center gap-4">
        <Link
          href="/clients"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Edit Client
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.name}
          </p>
        </div>
      </div>
      <div className="max-w-3xl">
        <ClientForm client={client} action={updateClientWithId} />
      </div>
    </div>
  );
}
