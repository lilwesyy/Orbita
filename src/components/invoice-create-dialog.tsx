"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Loader2, Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import InvoiceForm from "@/components/invoice-form";
import {
  createInvoiceInDialog,
  updateInvoiceInDialog,
  getInvoiceById,
} from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SerializedInvoice } from "@/types/invoice";
import type { InvoiceStatus, InvoiceType } from "@/generated/prisma/client";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const statusConfig: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  SENT: { label: "Sent", variant: "default" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const typeConfig: Record<InvoiceType, { label: string; variant: BadgeVariant }> = {
  INVOICE: { label: "Invoice", variant: "default" },
  QUOTE: { label: "Quote", variant: "secondary" },
};

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

// --- Create Dialog (with trigger button) ---

interface InvoiceCreateDialogProps {
  clients: ClientOption[];
  projects: ProjectOption[];
}

export default function InvoiceCreateDialog({ clients, projects }: InvoiceCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus /> New Invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl sm:max-w-3xl gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>New Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice or quote
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6">
            <InvoiceForm
              clients={clients}
              projects={projects}
              action={createInvoiceInDialog}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog (controlled externally) ---

interface InvoiceEditDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  projects: ProjectOption[];
}

export function InvoiceEditDialog({
  invoiceId,
  open,
  onOpenChange,
  clients,
  projects,
}: InvoiceEditDialogProps) {
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open && invoiceId) {
      setInvoice(null);
      startLoading(async () => {
        const data = await getInvoiceById(invoiceId);
        setInvoice(data);
        setFormKey((k) => k + 1);
      });
    }
  }, [open, invoiceId]);

  const boundUpdate = invoiceId
    ? updateInvoiceInDialog.bind(null, invoiceId)
    : createInvoiceInDialog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update invoice details
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : invoice ? (
              <InvoiceForm
                key={formKey}
                invoice={invoice}
                clients={clients}
                projects={projects}
                action={boundUpdate}
                onSuccess={() => onOpenChange(false)}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- Detail Dialog (read-only summary) ---

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string) => void;
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
  onEdit,
}: InvoiceDetailDialogProps) {
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [isLoading, startLoading] = useTransition();

  useEffect(() => {
    if (open && invoiceId) {
      setInvoice(null);
      startLoading(async () => {
        const data = await getInvoiceById(invoiceId);
        setInvoice(data);
      });
    }
  }, [open, invoiceId]);

  const handleEdit = () => {
    if (!invoiceId) return;
    onOpenChange(false);
    onEdit(invoiceId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl gap-0 px-0 pt-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            {invoice ? (
              <>
                {invoice.number}
                <Badge variant={typeConfig[invoice.type].variant}>
                  {typeConfig[invoice.type].label}
                </Badge>
                <Badge variant={statusConfig[invoice.status].variant}>
                  {statusConfig[invoice.status].label}
                </Badge>
              </>
            ) : (
              "Invoice Details"
            )}
          </DialogTitle>
          <DialogDescription>
            {invoice ? invoice.client.name : "Loading..."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : invoice ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{formatDate(invoice.date)}</p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
                    </div>
                  )}
                  {invoice.project && (
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{invoice.project.name}</p>
                    </div>
                  )}
                </div>

                {invoice.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{String(item.quantity)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(String(item.unitPrice))}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(String(item.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end border-t border-border pt-4">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(String(invoice.subtotal))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA ({String(invoice.taxRate)}%)</span>
                      <span className="font-medium">{formatCurrency(String(invoice.taxAmount))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(String(invoice.total))}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button variant="secondary" asChild>
                    <a href={`/api/invoices/${invoice.id}/pdf`}>
                      <Download className="size-4" />
                      PDF
                    </a>
                  </Button>
                  <Button onClick={handleEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
