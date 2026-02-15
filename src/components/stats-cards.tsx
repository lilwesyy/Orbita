import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TrendData } from "@/lib/dashboard";

interface StatsCardsProps {
  totalRevenue: number;
  activeProjects: number;
  hoursThisMonth: number;
  totalClients: number;
  draftInvoices: number;
  overdueInvoices: number;
  trends: TrendData;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <Badge variant="outline">
        <Minus className="size-3" />
        —
      </Badge>
    );
  }

  const isPositive = value >= 0;
  const formatted = `${isPositive ? "+" : ""}${value}%`;

  return (
    <Badge variant="outline">
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {formatted}
    </Badge>
  );
}

export function StatsCards({
  totalRevenue,
  activeProjects,
  hoursThisMonth,
  totalClients,
  draftInvoices,
  overdueInvoices,
  trends,
}: StatsCardsProps) {
  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalRevenue)}
          </CardTitle>
          <CardAction>
            <TrendBadge value={trends.revenueTrend} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total paid invoices
          </div>
          <div className="text-muted-foreground">
            {draftInvoices > 0 ? `${draftInvoices} invoices still in draft` : "No draft invoices"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeProjects}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {activeProjects > 0 ? <TrendingUp className="size-3" /> : <Minus className="size-3" />}
              {activeProjects > 0 ? "Active" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            In Progress and Review
          </div>
          <div className="text-muted-foreground">
            Excludes proposals and completed
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Hours This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {hoursThisMonth.toFixed(1)}h
          </CardTitle>
          <CardAction>
            <TrendBadge value={trends.hoursTrend} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            vs {trends.hoursLastMonth.toFixed(1)}h last month
          </div>
          <div className="text-muted-foreground">
            Completed entries only
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Clients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalClients}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totalClients > 0 ? <TrendingUp className="size-3" /> : <Minus className="size-3" />}
              {totalClients > 0 ? "Active" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {overdueInvoices > 0
              ? <><span className="text-destructive">{overdueInvoices} overdue invoices</span> <TrendingDown className="size-4" /></>
              : <>All invoices on track <TrendingUp className="size-4" /></>
            }
          </div>
          <div className="text-muted-foreground">
            Excluding leads and inactive
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
