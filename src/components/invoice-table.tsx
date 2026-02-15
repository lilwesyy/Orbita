"use client";

import { useState, useCallback, useMemo, useTransition, useRef } from "react";
import { X, FileText, FileQuestion, CircleDashed, Send, CircleCheck, AlertTriangle, CircleX, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { IconFileInvoice } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateInvoiceStatus, deleteInvoiceFromList } from "@/actions/invoices";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import InvoiceCreateDialog, { InvoiceEditDialog, InvoiceDetailDialog } from "@/components/invoice-create-dialog";
import ConfirmModal from "@/components/confirm-modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceListItem } from "@/types/invoice";
import type { InvoiceStatus, InvoiceType } from "@/generated/prisma/client";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  clients: ClientOption[];
  projects: ProjectOption[];
}

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const statusConfig: Record<InvoiceStatus, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  DRAFT: { label: "Draft", variant: "outline", icon: CircleDashed },
  SENT: { label: "Sent", variant: "default", icon: Send },
  PAID: { label: "Paid", variant: "success", icon: CircleCheck },
  OVERDUE: { label: "Overdue", variant: "warning", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: CircleX },
};

const typeConfig: Record<InvoiceType, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  INVOICE: { label: "Invoice", variant: "default", icon: FileText },
  QUOTE: { label: "Quote", variant: "secondary", icon: FileQuestion },
};

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const typeOptions = Object.entries(typeConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

// --- Status transitions ---

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
  PAID: [
    { key: "SENT", label: "Revert to Sent" },
  ],
  OVERDUE: [
    { key: "PAID", label: "Mark as Paid" },
    { key: "CANCELLED", label: "Cancel" },
  ],
  CANCELLED: [
    { key: "DRAFT", label: "Revert to Draft" },
  ],
};

// --- Row Actions ---

interface InvoiceRowActionsProps {
  invoice: InvoiceListItem;
  onDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, label: string) => void;
}

function InvoiceRowActions({ invoice, onDetails, onEdit, onDelete }: InvoiceRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const transitions = statusTransitions[invoice.status];

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status changed to ${statusConfig[newStatus].label}`);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDetails(invoice.id)}>
          <Eye className="size-4" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        {transitions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Set status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {transitions.map((t) => (
                  <DropdownMenuItem key={t.key} onClick={() => handleStatusChange(t.key)}>
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(invoice.id, invoice.number)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Columns ---

function getColumns(onDetails: (id: string) => void, onEdit: (id: string) => void, onDelete: (id: string, label: string) => void): ColumnDef<InvoiceListItem>[] {
  return [
    {
      accessorKey: "number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
      cell: ({ row }) => (
        <button
          onClick={() => onDetails(row.original.id)}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.getValue("number")}
        </button>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        const lower = filterValue.toLowerCase();
        return (
          row.original.number.toLowerCase().includes(lower) ||
          row.original.client.name.toLowerCase().includes(lower)
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue("type") as InvoiceType;
        return (
          <Badge variant={typeConfig[type].variant}>
            {typeConfig[type].label}
          </Badge>
        );
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorFn: (row) => row.client.name,
      id: "client",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as InvoiceStatus;
        return (
          <Badge variant={statusConfig[status].variant}>
            {statusConfig[status].label}
          </Badge>
        );
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(String(row.original.total))}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = Number(rowA.original.total) || 0;
        const b = Number(rowB.original.total) || 0;
        return a - b;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => <InvoiceRowActions invoice={row.original} onDetails={onDetails} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

// --- Toolbar ---

function InvoiceTableToolbar({ table }: { table: Table<InvoiceListItem> }) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center gap-2">
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statusOptions}
        />
      )}
      {table.getColumn("type") && (
        <DataTableFacetedFilter
          column={table.getColumn("type")}
          title="Type"
          options={typeOptions}
        />
      )}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

// --- Main Component ---

export default function InvoiceTable({ invoices, clients, projects }: InvoiceTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteIdRef = useRef<string | null>(null);

  const handleDetails = useCallback((id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  }, []);

  const handleEdit = useCallback((id: string) => {
    setEditId(id);
    setEditOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string, label: string) => {
    deleteIdRef.current = id;
    setDeleteLabel(label);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteIdRef.current) return;
    setIsDeleting(true);
    const result = await deleteInvoiceFromList(deleteIdRef.current);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Document deleted");
      setDeleteOpen(false);
    }
  }, []);

  const columns = useMemo(() => getColumns(handleDetails, handleEdit, handleDeleteRequest), [handleDetails, handleEdit, handleDeleteRequest]);

  return (
    <>
      <DataTable
        columns={columns}
        data={invoices}
        searchKey="number"
        searchPlaceholder="Search by number or client..."
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFileInvoice />
              </EmptyMedia>
              <EmptyTitle>No Documents Found</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first invoice or quote.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        action={<InvoiceCreateDialog clients={clients} projects={projects} />}
        toolbar={(table) => <InvoiceTableToolbar table={table} />}
      />
      <InvoiceDetailDialog
        invoiceId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
      />
      <InvoiceEditDialog
        invoiceId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
        projects={projects}
      />
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteLabel}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </>
  );
}
