import { Suspense } from "react";
import { getAnalyticsData, isValidPeriod } from "@/lib/analytics";
import type { AnalyticsPeriod } from "@/lib/analytics";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const period: AnalyticsPeriod = params.period && isValidPeriod(params.period)
    ? params.period
    : "12m";

  const data = await getAnalyticsData(period);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analisi dettagliata del business
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <AnalyticsKpiCards kpi={data.kpi} />

      <AnalyticsCharts data={data} />
    </div>
  );
}
