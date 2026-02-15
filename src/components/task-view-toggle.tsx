"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutList, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TaskViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "table";

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "table") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    const qs = params.toString();
    router.replace(`?${qs}`, { scroll: false });
  };

  return (
    <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2.5 text-xs"
        onClick={() => setView("table")}
      >
        <LayoutList className="size-3.5" />
        Table
      </Button>
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2.5 text-xs"
        onClick={() => setView("kanban")}
      >
        <Columns3 className="size-3.5" />
        Kanban
      </Button>
    </div>
  );
}
