"use client";

import { type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TempoTabsProps {
  tableContent: ReactNode;
  formContent: ReactNode;
}

export function TempoTabs({ tableContent, formContent }: TempoTabsProps) {
  return (
    <Tabs defaultValue="entries">
      <TabsList>
        <TabsTrigger value="entries">Entries</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>
      <TabsContent value="entries">
        {tableContent}
      </TabsContent>
      <TabsContent value="manual">
        {formContent}
      </TabsContent>
    </Tabs>
  );
}
