"use server";

import { prisma } from "@/lib/prisma";

interface SearchResultClient {
  id: string;
  name: string;
  company: string | null;
}

interface SearchResultProject {
  id: string;
  name: string;
  status: string;
}

interface SearchResultTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

interface SearchResultInvoice {
  id: string;
  number: string;
  clientName: string;
  status: string;
}

export interface SearchResults {
  clients: SearchResultClient[];
  projects: SearchResultProject[];
  tasks: SearchResultTask[];
  invoices: SearchResultInvoice[];
}

export async function globalSearch(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { clients: [], projects: [], tasks: [], invoices: [] };
  }

  const [clients, projects, tasks, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { company: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, company: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: {
        name: { contains: trimmed, mode: "insensitive" },
      },
      select: { id: true, name: true, status: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        title: { contains: trimmed, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { name: true } },
      },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { number: { contains: trimmed, mode: "insensitive" } },
          { client: { name: { contains: trimmed, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        number: true,
        status: true,
        client: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return {
    clients,
    projects,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      projectName: t.project.name,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      number: i.number,
      clientName: i.client.name,
      status: i.status,
    })),
  };
}
