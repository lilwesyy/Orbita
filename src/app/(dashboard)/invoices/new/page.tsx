import { prisma } from "@/lib/prisma";
import InvoiceForm from "@/components/invoice-form";
import { createInvoice } from "@/actions/invoices";
import Link from "next/link";

export default async function NewInvoicePage() {
  const [clients, projects] = await Promise.all([
    prisma.client.findMany({
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
      <div className="flex items-center gap-4">
        <Link
          href="/invoices"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            New Invoice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new invoice or quote
          </p>
        </div>
      </div>
      <div className="max-w-4xl">
        <InvoiceForm clients={clients} projects={projects} action={createInvoice} />
      </div>
    </div>
  );
}
