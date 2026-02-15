import { prisma } from "@/lib/prisma";

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface ProjectByStatus {
  status: string;
  count: number;
}

export interface RecentProjectItem {
  id: string;
  name: string;
  clientName: string;
  status: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeProjects: number;
  hoursThisMonth: number;
  totalClients: number;
  draftInvoices: number;
  overdueInvoices: number;
  revenueByMonth: RevenueByMonth[];
  projectsByStatus: ProjectByStatus[];
  recentProjects: RecentProjectItem[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    revenueResult,
    activeProjects,
    hoursResult,
    totalClients,
    draftInvoices,
    overdueInvoices,
    paidInvoices,
    projectStatusCounts,
    recentProjectsRaw,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.project.count({
      where: { status: { in: ["IN_PROGRESS", "REVIEW"] } },
    }),
    prisma.timeEntry.aggregate({
      where: {
        startTime: { gte: startOfMonth },
        duration: { not: null },
      },
      _sum: { duration: true },
    }),
    prisma.client.count({
      where: { status: "ACTIVE" },
    }),
    prisma.invoice.count({
      where: { status: "DRAFT" },
    }),
    prisma.invoice.count({
      where: { status: "OVERDUE" },
    }),
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        date: { gte: twelveMonthsAgo },
      },
      select: { date: true, total: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.total ?? 0);
  const hoursThisMonth =
    Math.round(((hoursResult._sum.duration ?? 0) / 60) * 10) / 10;

  // Build revenue by month for last 12 months
  const revenueMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueMap.set(key, 0);
  }

  for (const inv of paidInvoices) {
    const d = new Date(inv.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(inv.total));
    }
  }

  const revenueByMonth: RevenueByMonth[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth.push({
      month: MONTHS[d.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
    });
  }

  const projectsByStatus: ProjectByStatus[] = projectStatusCounts.map(
    (item) => ({
      status: item.status,
      count: item._count.status,
    })
  );

  const recentProjects: RecentProjectItem[] = recentProjectsRaw.map(
    (project) => ({
      id: project.id,
      name: project.name,
      clientName: project.client.name,
      status: project.status,
      updatedAt: project.updatedAt.toISOString(),
    })
  );

  return {
    totalRevenue,
    activeProjects,
    hoursThisMonth,
    totalClients,
    draftInvoices,
    overdueInvoices,
    revenueByMonth,
    projectsByStatus,
    recentProjects,
  };
}
