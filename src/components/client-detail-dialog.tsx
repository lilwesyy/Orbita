"use client";

import Link from "next/link";
import { Loader2, Mail, Phone, MapPin, Calendar, FolderOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ClientStatus } from "@/generated/prisma/client";
import type { ClientWithRelations } from "@/types/client";

interface ClientDetailDialogProps {
  client: ClientWithRelations | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<
  ClientStatus,
  { label: string; variant: "success" | "destructive" | "warning" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "destructive" },
  LEAD: { label: "Lead", variant: "warning" },
};

export default function ClientDetailDialog({
  client,
  loading,
  open,
  onClose,
}: ClientDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl sm:max-w-xl gap-0 px-0 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <DialogTitle className="sr-only">Loading client</DialogTitle>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !client ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Client not found</DialogTitle>
              <DialogDescription>
                This client could not be loaded.
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <DialogTitle>{client.name}</DialogTitle>
                <Badge variant={statusConfig[client.status].variant}>
                  {statusConfig[client.status].label}
                </Badge>
              </div>
              <DialogDescription>
                {client.company || "Client details"}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="px-6 pb-6 space-y-6">
                {/* Information */}
                <div className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{client.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Created {formatDate(client.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {client.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {client.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Projects */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Projects ({client.projects.length})
                    </h4>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/projects/new?clientId=${client.id}`}>
                        New Project
                      </Link>
                    </Button>
                  </div>
                  {client.projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects yet</p>
                  ) : (
                    <div className="space-y-1">
                      {client.projects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{project.name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {project.status.replace("_", " ")}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Invoices ({client.invoices.length})
                    </h4>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/invoices/new?clientId=${client.id}`}>
                        New Invoice
                      </Link>
                    </Button>
                  </div>
                  {client.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices yet</p>
                  ) : (
                    <div className="space-y-1">
                      {client.invoices.map((invoice) => (
                        <Link
                          key={invoice.id}
                          href={`/invoices/${invoice.id}`}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{invoice.number}</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {invoice.type === "QUOTE" ? "Quote" : "Invoice"} — {invoice.status}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
