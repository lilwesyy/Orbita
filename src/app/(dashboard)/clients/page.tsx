import { prisma } from "@/lib/prisma";
import ClientTable from "@/components/client-table";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your clients
        </p>
      </div>
      <ClientTable clients={clients} />
    </div>
  );
}
