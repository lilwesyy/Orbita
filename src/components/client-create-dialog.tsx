"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientForm from "@/components/client-form";
import { createClientInDialog } from "@/actions/clients";

export default function ClientCreateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus /> New Client</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your CRM
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6">
            <ClientForm
              action={createClientInDialog}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
