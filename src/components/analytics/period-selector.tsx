"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const PERIODS = [
  { value: "30d", label: "30gg" },
  { value: "3m", label: "3 mesi" },
  { value: "6m", label: "6 mesi" },
  { value: "12m", label: "12 mesi" },
  { value: "all", label: "Tutto" },
] as const;

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "12m";

  function handleChange(value: string) {
    router.push(`/analytics?period=${value}`);
  }

  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={current === p.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
