import { prisma } from "@/lib/prisma";

export type AnalyticsPeriod = "30d" | "3m" | "6m" | "12m" | "all";

export interface AnalyticsKpi {
  revenueCurrent: number;
  revenuePrevious: number;
  hoursCurrent: number;
  hoursPrevious: number;
  avgHourlyRate: number;
  tasksCompleted: number;
}

export interface RevenueByClientItem {
  clientName: string;
  revenue: number;
}

export interface RevenueByProjectItem {
  projectName: string;
  clientName: string;
  revenue: number;
}

export interface HoursByProjectItem {
  projectName: string;
  hours: number;
}

export interface ProfitabilityItem {
  projectName: string;
  effectiveRate: number;
  setRate: number;
}

export interface TaskCompletionTrendItem {
  month: string;
  completed: number;
}

export interface InvoicesByStatusItem {
  status: string;
  count: number;
}

export interface AnalyticsData {
  kpi: AnalyticsKpi;
  revenueByClient: RevenueByClientItem[];
  revenueByProject: RevenueByProjectItem[];
  hoursByProject: HoursByProjectItem[];
  profitability: ProfitabilityItem[];
  taskCompletionTrend: TaskCompletionTrendItem[];
  invoicesByStatus: InvoicesByStatusItem[];
}

const MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

function getPeriodDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case "30d": return 30;
    case "3m": return 90;
    case "6m": return 180;
    case "12m": return 365;
    case "all": return null;
  }
}

function getStartDate(period: AnalyticsPeriod): Date | null {
  const days = getPeriodDays(period);
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPreviousStart(period: AnalyticsPeriod, startDate: Date | null): Date | null {
  if (startDate === null) return null;
  const days = getPeriodDays(period);
  if (days === null) return null;
  const d = new Date(startDate);
  d.setDate(d.getDate() - days);
  return d;
}

export function isValidPeriod(value: string): value is AnalyticsPeriod {
  return ["30d", "3m", "6m", "12m", "all"].includes(value);
}

export async function getAnalyticsData(period: AnalyticsPeriod): Promise<AnalyticsData> {
  const startDate = getStartDate(period);
  const previousStart = getPreviousStart(period, startDate);

  const dateFilter = startDate ? { gte: startDate } : undefined;
  const previousDateFilter = previousStart && startDate
    ? { gte: previousStart, lt: startDate }
    : undefined;

  const [
    revenueCurrent,
    revenuePrevious,
    hoursCurrent,
    hoursPrevious,
    tasksCompleted,
    paidInvoices,
    timeEntries,
    doneTasks,
    invoiceStatusCounts,
  ] = await Promise.all([
    // KPI: revenue current period
    prisma.invoice.aggregate({
      where: {
        status: "PAID",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      _sum: { total: true },
    }),
    // KPI: revenue previous period
    previousDateFilter
      ? prisma.invoice.aggregate({
          where: { status: "PAID", date: previousDateFilter },
          _sum: { total: true },
        })
      : Promise.resolve({ _sum: { total: null } }),
    // KPI: hours current period
    prisma.timeEntry.aggregate({
      where: {
        duration: { not: null },
        ...(dateFilter ? { startTime: dateFilter } : {}),
      },
      _sum: { duration: true },
    }),
    // KPI: hours previous period
    previousDateFilter
      ? prisma.timeEntry.aggregate({
          where: { duration: { not: null }, startTime: previousDateFilter },
          _sum: { duration: true },
        })
      : Promise.resolve({ _sum: { duration: null } }),
    // KPI: tasks completed
    prisma.task.count({
      where: {
        status: "DONE",
        ...(dateFilter ? { updatedAt: dateFilter } : {}),
      },
    }),
    // Revenue by client/project: paid invoices with relations
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      select: {
        total: true,
        client: { select: { name: true } },
        project: { select: { name: true, hourlyRate: true } },
      },
    }),
    // Hours by project: time entries with project
    prisma.timeEntry.findMany({
      where: {
        duration: { not: null },
        ...(dateFilter ? { startTime: dateFilter } : {}),
      },
      select: {
        duration: true,
        project: { select: { id: true, name: true, hourlyRate: true } },
      },
    }),
    // Task completion trend
    prisma.task.findMany({
      where: {
        status: "DONE",
        ...(dateFilter ? { updatedAt: dateFilter } : {}),
      },
      select: { updatedAt: true },
    }),
    // Invoice status distribution
    prisma.invoice.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  // KPI calculations
  const revenueCurrentVal = Number(revenueCurrent._sum.total ?? 0);
  const revenuePreviousVal = Number(revenuePrevious._sum.total ?? 0);
  const hoursCurrentVal = Math.round(((hoursCurrent._sum.duration ?? 0) / 60) * 10) / 10;
  const hoursPreviousVal = Math.round(((hoursPrevious._sum.duration ?? 0) / 60) * 10) / 10;
  const avgHourlyRate = hoursCurrentVal > 0 ? revenueCurrentVal / hoursCurrentVal : 0;

  // Revenue by client — group and top 10
  const clientRevenueMap = new Map<string, number>();
  for (const inv of paidInvoices) {
    const name = inv.client.name;
    clientRevenueMap.set(name, (clientRevenueMap.get(name) ?? 0) + Number(inv.total));
  }
  const revenueByClient: RevenueByClientItem[] = Array.from(clientRevenueMap.entries())
    .map(([clientName, revenue]) => ({ clientName, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Revenue by project — group and top 10
  const projectRevenueMap = new Map<string, { clientName: string; revenue: number }>();
  for (const inv of paidInvoices) {
    if (!inv.project) continue;
    const key = inv.project.name;
    const existing = projectRevenueMap.get(key);
    if (existing) {
      existing.revenue += Number(inv.total);
    } else {
      projectRevenueMap.set(key, {
        clientName: inv.client.name,
        revenue: Number(inv.total),
      });
    }
  }
  const revenueByProject: RevenueByProjectItem[] = Array.from(projectRevenueMap.entries())
    .map(([projectName, data]) => ({ projectName, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Hours by project — group and top 10
  const projectHoursMap = new Map<string, number>();
  for (const te of timeEntries) {
    const name = te.project.name;
    projectHoursMap.set(name, (projectHoursMap.get(name) ?? 0) + (te.duration ?? 0));
  }
  const hoursByProject: HoursByProjectItem[] = Array.from(projectHoursMap.entries())
    .map(([projectName, mins]) => ({ projectName, hours: Math.round((mins / 60) * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  // Profitability: compare effective rate vs set rate per project
  const projectHoursById = new Map<string, { name: string; minutes: number; hourlyRate: number | null }>();
  for (const te of timeEntries) {
    const id = te.project.id;
    const existing = projectHoursById.get(id);
    if (existing) {
      existing.minutes += te.duration ?? 0;
    } else {
      projectHoursById.set(id, {
        name: te.project.name,
        minutes: te.duration ?? 0,
        hourlyRate: te.project.hourlyRate ? Number(te.project.hourlyRate) : null,
      });
    }
  }
  const projectRevenueById = new Map<string, number>();
  for (const inv of paidInvoices) {
    if (!inv.project) continue;
    // We need project ID but we only have name — use name as key here
    const key = inv.project.name;
    projectRevenueById.set(key, (projectRevenueById.get(key) ?? 0) + Number(inv.total));
  }
  const profitability: ProfitabilityItem[] = [];
  for (const [, proj] of projectHoursById) {
    if (proj.hourlyRate === null || proj.minutes === 0) continue;
    const hours = proj.minutes / 60;
    const revenue = projectRevenueById.get(proj.name) ?? 0;
    const effectiveRate = revenue / hours;
    profitability.push({
      projectName: proj.name,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      setRate: proj.hourlyRate,
    });
  }
  profitability.sort((a, b) => b.effectiveRate - a.effectiveRate);

  // Task completion trend — bucket by month
  const monthBucketMap = new Map<string, number>();
  // Build month keys for the period
  const now = new Date();
  const monthCount = startDate
    ? Math.ceil((now.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)) + 1
    : 12;
  const actualMonthCount = Math.min(monthCount, 36);
  for (let i = 0; i < actualMonthCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - actualMonthCount + 1 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthBucketMap.set(key, 0);
  }
  for (const task of doneTasks) {
    const d = new Date(task.updatedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthBucketMap.has(key)) {
      monthBucketMap.set(key, (monthBucketMap.get(key) ?? 0) + 1);
    }
  }
  const taskCompletionTrend: TaskCompletionTrendItem[] = [];
  for (let i = 0; i < actualMonthCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - actualMonthCount + 1 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    taskCompletionTrend.push({
      month: `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      completed: monthBucketMap.get(key) ?? 0,
    });
  }

  // Invoice status distribution
  const invoicesByStatus: InvoicesByStatusItem[] = invoiceStatusCounts.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));

  return {
    kpi: {
      revenueCurrent: revenueCurrentVal,
      revenuePrevious: revenuePreviousVal,
      hoursCurrent: hoursCurrentVal,
      hoursPrevious: hoursPreviousVal,
      avgHourlyRate: Math.round(avgHourlyRate * 100) / 100,
      tasksCompleted,
    },
    revenueByClient,
    revenueByProject,
    hoursByProject,
    profitability,
    taskCompletionTrend,
    invoicesByStatus,
  };
}
