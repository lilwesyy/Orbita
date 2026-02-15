import type { Client, ClientStatus, Project, Invoice } from "@/generated/prisma/client";

export type { ClientStatus };

/** Project with Decimal fields serialized to strings for Client Components */
type SerializedProject = Omit<Project, "budget" | "hourlyRate"> & {
  budget: string | null;
  hourlyRate: string | null;
};

/** Invoice with Decimal fields serialized to strings for Client Components */
type SerializedInvoice = Omit<Invoice, "taxRate" | "subtotal" | "taxAmount" | "total"> & {
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
};

export interface ClientWithRelations extends Client {
  projects: SerializedProject[];
  invoices: SerializedInvoice[];
  _count?: {
    projects: number;
    invoices: number;
  };
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  status: ClientStatus;
}
