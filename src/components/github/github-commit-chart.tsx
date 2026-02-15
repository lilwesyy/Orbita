"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GitHubWeeklyCommitActivity } from "@/types/github";

interface GitHubCommitChartProps {
  activity: GitHubWeeklyCommitActivity[];
}

export function GitHubCommitChart({ activity }: GitHubCommitChartProps) {
  const chartData = activity.map((week) => {
    const date = new Date(week.week * 1000);
    return {
      name: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      commits: week.total,
    };
  });

  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Commit Activity
      </h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Activity data not available yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="commits"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
