"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientStatus } from "@/generated/prisma/client";

interface ClientActionResult {
  error?: string;
  success?: boolean;
}

export async function getClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
}

export async function createClient(
  _prevState: ClientActionResult,
  formData: FormData
): Promise<ClientActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;
  const address = formData.get("address") as string;
  const notes = formData.get("notes") as string;
  const status = (formData.get("status") as ClientStatus) || "ACTIVE";

  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  try {
    await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        status,
      },
    });
  } catch {
    return { error: "Error creating client" };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}

export async function updateClient(
  id: string,
  _prevState: ClientActionResult,
  formData: FormData
): Promise<ClientActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;
  const address = formData.get("address") as string;
  const notes = formData.get("notes") as string;
  const status = (formData.get("status") as ClientStatus) || "ACTIVE";

  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  try {
    await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        status,
      },
    });
  } catch {
    return { error: "Error updating client" };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}

export async function createClientInDialog(
  _prevState: ClientActionResult,
  formData: FormData
): Promise<ClientActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;
  const address = formData.get("address") as string;
  const notes = formData.get("notes") as string;
  const status = (formData.get("status") as ClientStatus) || "ACTIVE";

  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  try {
    await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        status,
      },
    });
  } catch {
    return { error: "Error creating client" };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function getClientWithRelations(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) return null;

  return {
    ...client,
    projects: client.projects.map((p) => ({
      ...p,
      budget: p.budget ? String(p.budget) : null,
      hourlyRate: p.hourlyRate ? String(p.hourlyRate) : null,
    })),
    invoices: client.invoices.map((inv) => ({
      ...inv,
      taxRate: String(inv.taxRate),
      subtotal: String(inv.subtotal),
      taxAmount: String(inv.taxAmount),
      total: String(inv.total),
    })),
  };
}

export async function deleteClientFromList(id: string): Promise<ClientActionResult> {
  try {
    await prisma.client.delete({
      where: { id },
    });
  } catch {
    return { error: "Error deleting client" };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  return { success: true };
}

export async function deleteClient(id: string): Promise<ClientActionResult> {
  try {
    await prisma.client.delete({
      where: { id },
    });
  } catch {
    return { error: "Error deleting client" };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}
