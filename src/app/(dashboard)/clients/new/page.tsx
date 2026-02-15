import ClientForm from "@/components/client-form";
import { createClient } from "@/actions/clients";
import Link from "next/link";

export default function NewClientPage() {
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
            New Client
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a new client
          </p>
        </div>
      </div>
      <div className="max-w-3xl">
        <ClientForm action={createClient} />
      </div>
    </div>
  );
}
