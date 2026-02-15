import type { Invoice, InvoiceType, InvoiceStatus, InvoiceItem, Client, Project } from "@/generated/prisma/client";

export type { InvoiceType, InvoiceStatus };

export interface InvoiceWithRelations extends Invoice {
  client: Client;
  project: Project | null;
  items: InvoiceItem[];
}

export interface SerializedInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
}

export interface SerializedInvoice {
  id: string;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date: Date;
  dueDate: Date | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  projectId: string | null;
  client: Client;
  project: Project | null;
  items: SerializedInvoiceItem[];
}

export interface InvoiceListItem {
  id: string;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date: Date;
  total: string;
  client: { id: string; name: string };
}

export interface InvoiceItemFormData {
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export interface InvoiceFormData {
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  taxRate: string;
  notes: string;
  clientId: string;
  projectId: string;
  items: InvoiceItemFormData[];
}
