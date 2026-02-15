"use client";

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconCircleX,
} from "@tabler/icons-react";
import type { SeoSection, SeoStatus } from "@/types/seo-audit";

const statusConfig: Record<SeoStatus, { icon: typeof IconCircleCheck; color: string }> = {
  pass: { icon: IconCircleCheck, color: "text-emerald-500" },
  warning: { icon: IconAlertTriangle, color: "text-amber-500" },
  fail: { icon: IconCircleX, color: "text-red-500" },
};

function getScoreVariant(score: number, maxScore: number): "success" | "warning" | "destructive" {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return "success";
  if (pct >= 50) return "warning";
  return "destructive";
}

interface SeoScoreCardProps {
  section: SeoSection;
}

export function SeoScoreCard({ section }: SeoScoreCardProps) {
  const variant = getScoreVariant(section.score, section.maxScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.name}</CardTitle>
        <CardAction>
          <Badge variant={variant}>
            {section.score}/{section.maxScore}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {section.checks.map((c, i) => {
            const cfg = statusConfig[c.status];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex items-start gap-2">
                <Icon className={`mt-0.5 size-4 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.points}/{c.maxPoints}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.value}</p>
                  {c.recommendation && (
                    <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                      {c.recommendation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
