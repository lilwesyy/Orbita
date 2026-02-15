import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InvoiceForm from "@/components/invoice-form";
import { updateInvoice } from "@/actions/invoices";
import Link from "next/link";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;

  const [invoice, clients, projects] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
      },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  const boundUpdate = updateInvoice.bind(null, id);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/invoices/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Edit Document
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.number}
          </p>
        </div>
      </div>
      <div className="max-w-4xl">
        <InvoiceForm
          invoice={invoice}
          clients={clients}
          projects={projects}
          action={boundUpdate}
        />
      </div>
    </div>
  );
}
