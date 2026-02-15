"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InvoiceType, InvoiceStatus } from "@/generated/prisma/client";
import type { SerializedInvoice } from "@/types/invoice";

interface InvoiceActionResult {
  error?: string;
  success?: boolean;
}

interface InvoiceItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

async function generateInvoiceNumber(type: InvoiceType): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === "INVOICE" ? "FAT" : "PREV";
  const pattern = `${prefix}${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      number: { startsWith: pattern },
      type,
    },
    orderBy: { number: "desc" },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.number.split("-");
    const lastNum = parseInt(parts[1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${pattern}${String(nextNum).padStart(3, "0")}`;
}

export async function createInvoice(
  _prevState: InvoiceActionResult,
  formData: FormData
): Promise<InvoiceActionResult> {
  const type = formData.get("type") as InvoiceType;
  const clientId = formData.get("clientId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const date = formData.get("date") as string;
  const dueDate = formData.get("dueDate") as string;
  const taxRate = formData.get("taxRate") as string;
  const notes = (formData.get("notes") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!clientId || clientId.trim() === "") {
    return { error: "Client is required" };
  }

  if (!type) {
    return { error: "Document type is required" };
  }

  let items: InvoiceItemInput[];
  try {
    items = JSON.parse(itemsJson) as InvoiceItemInput[];
  } catch {
    return { error: "Error in line items format" };
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item is required" };
  }

  const hasEmptyDescription = items.some(
    (item) => !item.description || item.description.trim() === ""
  );
  if (hasEmptyDescription) {
    return { error: "All line items must have a description" };
  }

  const taxRateNum = taxRate !== "" && !isNaN(Number(taxRate)) ? parseFloat(taxRate) : 22;
  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );
  const taxAmount = (subtotal * taxRateNum) / 100;
  const total = subtotal + taxAmount;

  let invoiceId: string;

  try {
    const number = await generateInvoiceNumber(type);

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          number,
          type,
          status: "DRAFT",
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          taxRate: taxRateNum,
          subtotal,
          taxAmount,
          total,
          notes: notes?.trim() || null,
          clientId,
          projectId: projectId?.trim() || null,
          items: {
            create: items.map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
              total: parseFloat(item.total) || 0,
            })),
          },
        },
      });
      return created;
    });

    invoiceId = invoice.id;
  } catch {
    return { error: "Error creating document" };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  redirect(`/invoices/${invoiceId}`);
}

export async function createInvoiceInDialog(
  _prevState: InvoiceActionResult,
  formData: FormData
): Promise<InvoiceActionResult> {
  const type = formData.get("type") as InvoiceType;
  const clientId = formData.get("clientId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const date = formData.get("date") as string;
  const dueDate = formData.get("dueDate") as string;
  const taxRate = formData.get("taxRate") as string;
  const notes = (formData.get("notes") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!clientId || clientId.trim() === "") {
    return { error: "Client is required" };
  }

  if (!type) {
    return { error: "Document type is required" };
  }

  let items: InvoiceItemInput[];
  try {
    items = JSON.parse(itemsJson) as InvoiceItemInput[];
  } catch {
    return { error: "Error in line items format" };
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item is required" };
  }

  const hasEmptyDescription = items.some(
    (item) => !item.description || item.description.trim() === ""
  );
  if (hasEmptyDescription) {
    return { error: "All line items must have a description" };
  }

  const taxRateNum = taxRate !== "" && !isNaN(Number(taxRate)) ? parseFloat(taxRate) : 22;
  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );
  const taxAmount = (subtotal * taxRateNum) / 100;
  const total = subtotal + taxAmount;

  try {
    const number = await generateInvoiceNumber(type);

    await prisma.$transaction(async (tx) => {
      await tx.invoice.create({
        data: {
          number,
          type,
          status: "DRAFT",
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          taxRate: taxRateNum,
          subtotal,
          taxAmount,
          total,
          notes: notes?.trim() || null,
          clientId,
          projectId: projectId?.trim() || null,
          items: {
            create: items.map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
              total: parseFloat(item.total) || 0,
            })),
          },
        },
      });
    });
  } catch {
    return { error: "Error creating document" };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return { success: true };
}

export async function updateInvoice(
  id: string,
  _prevState: InvoiceActionResult,
  formData: FormData
): Promise<InvoiceActionResult> {
  const type = formData.get("type") as InvoiceType;
  const clientId = formData.get("clientId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const date = formData.get("date") as string;
  const dueDate = formData.get("dueDate") as string;
  const taxRate = formData.get("taxRate") as string;
  const notes = (formData.get("notes") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!clientId || clientId.trim() === "") {
    return { error: "Client is required" };
  }

  if (!type) {
    return { error: "Document type is required" };
  }

  let items: InvoiceItemInput[];
  try {
    items = JSON.parse(itemsJson) as InvoiceItemInput[];
  } catch {
    return { error: "Error in line items format" };
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item is required" };
  }

  const hasEmptyDescription = items.some(
    (item) => !item.description || item.description.trim() === ""
  );
  if (hasEmptyDescription) {
    return { error: "All line items must have a description" };
  }

  const taxRateNum = taxRate !== "" && !isNaN(Number(taxRate)) ? parseFloat(taxRate) : 22;
  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );
  const taxAmount = (subtotal * taxRateNum) / 100;
  const total = subtotal + taxAmount;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      await tx.invoice.update({
        where: { id },
        data: {
          type,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          taxRate: taxRateNum,
          subtotal,
          taxAmount,
          total,
          notes: notes?.trim() || null,
          clientId,
          projectId: projectId?.trim() || null,
          items: {
            create: items.map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
              total: parseFloat(item.total) || 0,
            })),
          },
        },
      });
    });
  } catch {
    return { error: "Error updating document" };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/");
  redirect(`/invoices/${id}`);
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<InvoiceActionResult> {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status },
    });
  } catch {
    return { error: "Error updating status" };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/");
  return {};
}

export async function getInvoiceById(id: string): Promise<SerializedInvoice | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, project: true, items: true },
  });
  if (!invoice) return null;
  return JSON.parse(JSON.stringify(invoice, (_key, value) =>
    value !== null && typeof value === "object" && "toFixed" in value
      ? Number(value)
      : value
  )) as SerializedInvoice;
}

export async function updateInvoiceInDialog(
  id: string,
  _prevState: InvoiceActionResult,
  formData: FormData
): Promise<InvoiceActionResult> {
  const type = formData.get("type") as InvoiceType;
  const clientId = formData.get("clientId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const date = formData.get("date") as string;
  const dueDate = formData.get("dueDate") as string;
  const taxRate = formData.get("taxRate") as string;
  const notes = (formData.get("notes") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!clientId || clientId.trim() === "") {
    return { error: "Client is required" };
  }

  if (!type) {
    return { error: "Document type is required" };
  }

  let items: InvoiceItemInput[];
  try {
    items = JSON.parse(itemsJson) as InvoiceItemInput[];
  } catch {
    return { error: "Error in line items format" };
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item is required" };
  }

  const hasEmptyDescription = items.some(
    (item) => !item.description || item.description.trim() === ""
  );
  if (hasEmptyDescription) {
    return { error: "All line items must have a description" };
  }

  const taxRateNum = taxRate !== "" && !isNaN(Number(taxRate)) ? parseFloat(taxRate) : 22;
  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );
  const taxAmount = (subtotal * taxRateNum) / 100;
  const total = subtotal + taxAmount;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.update({
        where: { id },
        data: {
          type,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          taxRate: taxRateNum,
          subtotal,
          taxAmount,
          total,
          notes: notes?.trim() || null,
          clientId,
          projectId: projectId?.trim() || null,
          items: {
            create: items.map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
              total: parseFloat(item.total) || 0,
            })),
          },
        },
      });
    });
  } catch {
    return { error: "Error updating document" };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteInvoiceFromList(id: string): Promise<InvoiceActionResult> {
  try {
    await prisma.invoice.delete({ where: { id } });
  } catch {
    return { error: "Error deleting document" };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return { success: true };
}

export async function deleteInvoice(id: string): Promise<InvoiceActionResult> {
  try {
    await prisma.invoice.delete({
      where: { id },
    });
  } catch {
    return { error: "Error deleting document" };
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  redirect("/invoices");
}
