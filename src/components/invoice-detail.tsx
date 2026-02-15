"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { deleteInvoice, updateInvoiceStatus } from "@/actions/invoices";
import ConfirmModal from "./confirm-modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { InvoiceStatus, InvoiceType } from "@/generated/prisma/client";

interface InvoiceDetailProps {
  invoice: InvoiceWithRelations;
}

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

interface StatusTransition {
  key: InvoiceStatus;
  label: string;
}

const statusTransitions: Record<InvoiceStatus, StatusTransition[]> = {
  DRAFT: [
    { key: "SENT", label: "Mark as Sent" },
    { key: "CANCELLED", label: "Cancel" },
  ],
  SENT: [
    { key: "PAID", label: "Mark as Paid" },
    { key: "OVERDUE", label: "Mark as Overdue" },
    { key: "CANCELLED", label: "Cancel" },
  ],
  PAID: [],
  OVERDUE: [
    { key: "PAID", label: "Mark as Paid" },
    { key: "CANCELLED", label: "Cancel" },
  ],
  CANCELLED: [
    { key: "DRAFT", label: "Revert to Draft" },
  ],
};

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    const result = await deleteInvoice(invoice.id);
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Invoice deleted");
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setIsUpdatingStatus(true);
    const result = await updateInvoiceStatus(invoice.id, newStatus);
    setIsUpdatingStatus(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status updated");
      router.refresh();
    }
  };

  const availableTransitions = statusTransitions[invoice.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{invoice.number}</h1>
              <Badge variant={typeConfig[invoice.type].variant}>
                {typeConfig[invoice.type].label}
              </Badge>
              <Badge variant={statusConfig[invoice.status].variant}>
                {statusConfig[invoice.status].label}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{invoice.client.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTransitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" loading={isUpdatingStatus}>
                  Change Status
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {availableTransitions.map((transition) => (
                  <DropdownMenuItem
                    key={transition.key}
                    onClick={() => handleStatusChange(transition.key)}
                  >
                    {transition.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="secondary" asChild>
            <Link href={`/api/invoices/${invoice.id}/pdf`}>
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Document Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="text-foreground">
                  <Link href={`/clients/${invoice.client.id}`} className="text-primary hover:underline">
                    {invoice.client.name}
                  </Link>
                </p>
              </div>
              {invoice.project && (
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="text-foreground">
                    <Link href={`/projects/${invoice.project.id}`} className="text-primary hover:underline">
                      {invoice.project.name}
                    </Link>
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-foreground">{formatDate(invoice.date)}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-foreground">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Line Items</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DESCRIPTION</TableHead>
                <TableHead className="text-right">QUANTITY</TableHead>
                <TableHead className="text-right">UNIT PRICE</TableHead>
                <TableHead className="text-right">TOTAL</TableHead>
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

          <div className="flex justify-end pt-4 border-t border-border">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">{formatCurrency(String(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({String(invoice.taxRate)}%)</span>
                <span className="text-foreground font-medium">{formatCurrency(String(invoice.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCurrency(String(invoice.total))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${invoice.number}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
