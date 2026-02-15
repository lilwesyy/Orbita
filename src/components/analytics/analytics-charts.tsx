"use client";

import dynamic from "next/dynamic";
import type { AnalyticsData } from "@/lib/analytics";

const ChartSkeleton = () => (
  <div className="h-[380px] w-full animate-pulse rounded-lg bg-muted" />
);

const RevenueByClientChart = dynamic(
  () => import("@/components/analytics/revenue-by-client-chart").then((m) => ({ default: m.RevenueByClientChart })),
  { ssr: false, loading: ChartSkeleton }
);

const RevenueByProjectChart = dynamic(
  () => import("@/components/analytics/revenue-by-project-chart").then((m) => ({ default: m.RevenueByProjectChart })),
  { ssr: false, loading: ChartSkeleton }
);

const HoursByProjectChart = dynamic(
  () => import("@/components/analytics/hours-by-project-chart").then((m) => ({ default: m.HoursByProjectChart })),
  { ssr: false, loading: ChartSkeleton }
);

const ProfitabilityChart = dynamic(
  () => import("@/components/analytics/profitability-chart").then((m) => ({ default: m.ProfitabilityChart })),
  { ssr: false, loading: ChartSkeleton }
);

const TaskCompletionChart = dynamic(
  () => import("@/components/analytics/task-completion-chart").then((m) => ({ default: m.TaskCompletionChart })),
  { ssr: false, loading: ChartSkeleton }
);

const InvoiceStatusChart = dynamic(
  () => import("@/components/analytics/invoice-status-chart").then((m) => ({ default: m.InvoiceStatusChart })),
  { ssr: false, loading: ChartSkeleton }
);

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
      <RevenueByClientChart data={data.revenueByClient} />
      <RevenueByProjectChart data={data.revenueByProject} />
      <HoursByProjectChart data={data.hoursByProject} />
      <ProfitabilityChart data={data.profitability} />
      <TaskCompletionChart data={data.taskCompletionTrend} />
      <InvoiceStatusChart data={data.invoicesByStatus} />
    </div>
  );
}
