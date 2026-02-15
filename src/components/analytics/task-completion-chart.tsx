"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskCompletionTrendItem } from "@/lib/analytics";

interface TaskCompletionChartProps {
  data: TaskCompletionTrendItem[];
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    return (
      <div className="glass-card rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {payload[0].value} task completati
        </p>
      </div>
    );
  }
  return null;
}

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
  if (data.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-0">
          <CardTitle>Trend Completamento Task</CardTitle>
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
        <CardTitle>Trend Completamento Task</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006FEE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#006FEE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#006FEE"
                strokeWidth={2}
                fill="url(#taskGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
