"use client";

import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted" />
    ),
  }
);

interface RevenueByMonth {
  month: string;
  revenue: number;
}

interface LazyRevenueChartProps {
  data: RevenueByMonth[];
}

export function LazyRevenueChart({ data }: LazyRevenueChartProps) {
  return <RevenueChart data={data} />;
}
