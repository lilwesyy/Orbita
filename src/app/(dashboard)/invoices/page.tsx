import { prisma } from "@/lib/prisma";
import InvoiceTable from "@/components/invoice-table";

export default async function InvoicesPage() {
  const [invoices, clients, projects] = await Promise.all([
    prisma.invoice.findMany({
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
        date: true,
        total: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Invoices & Quotes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage invoices and quotes
        </p>
      </div>
      <InvoiceTable
        invoices={invoices.map((inv) => ({ ...inv, total: String(inv.total) }))}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}
