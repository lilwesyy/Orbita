"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProfitabilityItem } from "@/lib/analytics";

interface ProfitabilityChartProps {
  data: ProfitabilityItem[];
}

interface TooltipPayloadItem {
  value: number;
  payload: ProfitabilityItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <div className="glass-card rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{item.projectName}</p>
        <p className="text-sm text-muted-foreground">
          Effettiva: {formatCurrency(item.effectiveRate)}/h
        </p>
        <p className="text-sm text-muted-foreground">
          Tariffa: {formatCurrency(item.setRate)}/h
        </p>
        <p className={`text-sm font-bold mt-1 ${item.effectiveRate >= item.setRate ? "text-success" : "text-danger"}`}>
          {item.effectiveRate >= item.setRate ? "+" : ""}
          {((item.effectiveRate - item.setRate) / item.setRate * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  if (data.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-0">
          <CardTitle>Profittabilità</CardTitle>
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
        <CardTitle>Profittabilità (tariffa effettiva vs impostata)</CardTitle>
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
                tickFormatter={(value: number) => `€${value}`}
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
              <Bar dataKey="effectiveRate" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.effectiveRate >= entry.setRate ? "#17C964" : "#F31260"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
