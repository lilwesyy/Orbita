import { InvoiceDetailSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <InvoiceDetailSkeleton />
    </div>
  );
}
