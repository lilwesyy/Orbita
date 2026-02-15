"use client";

import { useEffect, useState, useTransition } from "react";
import { IconSettings } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { EmailConfigForm } from "@/components/email-config-form";
import { getEmailConfig } from "@/actions/email-config";

interface EmailConfigData {
  id: string;
  projectId: string;
  provider: string;
  apiKey: string;
}

interface EmailConfigDialogProps {
  projectId: string;
}

export function EmailConfigDialog({ projectId }: EmailConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<EmailConfigData | null>(null);
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const result = await getEmailConfig(projectId);
      setConfig(result);
    });
  }, [open, projectId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuAction>
          <IconSettings className="size-4" />
          <span className="sr-only">Email settings</span>
        </SidebarMenuAction>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email Configuration</DialogTitle>
          <DialogDescription>
            Configure the email provider for this project.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : (
          <EmailConfigForm projectId={projectId} config={config} />
        )}
      </DialogContent>
    </Dialog>
  );
}
