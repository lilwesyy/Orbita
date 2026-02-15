import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsKpi } from "@/lib/analytics";

interface AnalyticsKpiCardsProps {
  kpi: AnalyticsKpi;
}

function calcChange(current: number, previous: number): { pct: string; positive: boolean } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { pct: "+100%", positive: true };
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return { pct: `${sign}${change.toFixed(1)}%`, positive: change >= 0 };
}

export function AnalyticsKpiCards({ kpi }: AnalyticsKpiCardsProps) {
  const revenueChange = calcChange(kpi.revenueCurrent, kpi.revenuePrevious);
  const hoursChange = calcChange(kpi.hoursCurrent, kpi.hoursPrevious);

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Revenue periodo</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(kpi.revenueCurrent)}
          </CardTitle>
          {revenueChange && (
            <CardAction>
              <Badge variant="outline">
                {revenueChange.positive
                  ? <TrendingUp className="size-3" />
                  : <TrendingDown className="size-3" />}
                {revenueChange.pct}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fatture pagate nel periodo
          </div>
          <div className="text-muted-foreground">
            vs periodo precedente
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ore lavorate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.hoursCurrent.toFixed(1)}h
          </CardTitle>
          {hoursChange && (
            <CardAction>
              <Badge variant="outline">
                {hoursChange.positive
                  ? <TrendingUp className="size-3" />
                  : <TrendingDown className="size-3" />}
                {hoursChange.pct}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Ore tracciate nel periodo
          </div>
          <div className="text-muted-foreground">
            vs periodo precedente
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tariffa media effettiva</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(kpi.avgHourlyRate)}/h
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {kpi.avgHourlyRate > 0
                ? <TrendingUp className="size-3" />
                : <TrendingDown className="size-3" />}
              {kpi.avgHourlyRate > 0 ? "Attivo" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Revenue / ore lavorate
          </div>
          <div className="text-muted-foreground">
            Calcolata su fatture pagate
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Task completati</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.tasksCompleted}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {kpi.tasksCompleted > 0
                ? <TrendingUp className="size-3" />
                : <TrendingDown className="size-3" />}
              {kpi.tasksCompleted > 0 ? "Attivo" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Task con stato DONE
          </div>
          <div className="text-muted-foreground">
            Nel periodo selezionato
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
