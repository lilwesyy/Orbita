import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  totalRevenue: number;
  activeProjects: number;
  hoursThisMonth: number;
  totalClients: number;
  draftInvoices: number;
  overdueInvoices: number;
}

export function StatsCards({
  totalRevenue,
  activeProjects,
  hoursThisMonth,
  totalClients,
  draftInvoices,
  overdueInvoices,
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
            <Badge variant="outline">
              <TrendingUp className="size-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total paid invoices <TrendingUp className="size-4" />
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
              <TrendingUp className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            In Progress and Review projects <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Includes In Progress and Review status
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
            <Badge variant="outline">
              {hoursThisMonth > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {hoursThisMonth > 0 ? "Active" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Time logged this month
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
              <TrendingUp className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {overdueInvoices > 0
              ? <><span className="text-destructive">{overdueInvoices} overdue invoices</span> <TrendingDown className="size-4" /></>
              : <>All good <TrendingUp className="size-4" /></>
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
