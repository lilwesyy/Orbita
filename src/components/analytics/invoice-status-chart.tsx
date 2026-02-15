"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvoicesByStatusItem } from "@/lib/analytics";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Bozza", color: "#A1A1AA" },
  SENT: { label: "Inviata", color: "#006FEE" },
  PAID: { label: "Pagata", color: "#17C964" },
  OVERDUE: { label: "Scaduta", color: "#F31260" },
  CANCELLED: { label: "Annullata", color: "#F5A524" },
};

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface LegendPayloadItem {
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: ChartDataItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    return (
      <div className="glass-card rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.value} {item.value === 1 ? "fattura" : "fatture"}
        </p>
      </div>
    );
  }
  return null;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
}

function renderLabel(props: PieLabelProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, value = 0 } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {value}
    </text>
  );
}

interface InvoiceStatusChartProps {
  data: InvoicesByStatusItem[];
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  const chartData: ChartDataItem[] = data.map((item) => ({
    name: STATUS_CONFIG[item.status]?.label ?? item.status,
    value: item.count,
    color: STATUS_CONFIG[item.status]?.color ?? "#888888",
  }));

  const hasData = chartData.some((item) => item.value > 0);

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-0">
        <CardTitle>Fatture per Stato</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[260px]">
            <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
