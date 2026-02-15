import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InvoiceDetail from "@/components/invoice-detail";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      items: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <InvoiceDetail invoice={invoice} />
    </div>
  );
}
