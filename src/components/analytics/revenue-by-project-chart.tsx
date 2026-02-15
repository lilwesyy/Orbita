"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RevenueByProjectItem } from "@/lib/analytics";

interface RevenueByProjectChartProps {
  data: RevenueByProjectItem[];
}

interface TooltipPayloadItem {
  value: number;
  payload: RevenueByProjectItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    return (
      <div className="glass-card rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{item.payload.projectName}</p>
        <p className="text-xs text-muted-foreground">{item.payload.clientName}</p>
        <p className="text-sm font-bold text-foreground mt-1">
          {formatCurrency(item.value)}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueByProjectChart({ data }: RevenueByProjectChartProps) {
  if (data.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-0">
          <CardTitle>Revenue per Progetto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[260px]">
            <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-0">
        <CardTitle>Revenue per Progetto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
                tickFormatter={(value: number) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                }
              />
              <YAxis
                type="category"
                dataKey="projectName"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#17C964" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
