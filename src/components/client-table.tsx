"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, UserCheck, UserX, UserPlus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { IconUsers } from "@tabler/icons-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ClientCreateDialog from "@/components/client-create-dialog";
import ClientDetailDialog from "@/components/client-detail-dialog";
import ConfirmModal from "@/components/confirm-modal";
import { deleteClientFromList, getClientWithRelations } from "@/actions/clients";
import type { Client, ClientStatus } from "@/generated/prisma/client";
import type { ClientWithRelations } from "@/types/client";

interface ClientTableProps {
  clients: Client[];
}

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const statusConfig: Record<ClientStatus, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  ACTIVE: { label: "Active", variant: "success", icon: UserCheck },
  INACTIVE: { label: "Inactive", variant: "destructive", icon: UserX },
  LEAD: { label: "Lead", variant: "warning", icon: UserPlus },
};

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

function ClientTableToolbar({ table }: { table: Table<Client> }) {
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

interface ColumnActions {
  onOpenDetail: (id: string) => void;
  onDelete: (client: Client) => void;
}

function buildColumns({ onOpenDetail, onDelete }: ColumnActions): ColumnDef<Client>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onOpenDetail(row.original.id)}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.getValue("name")}
        </button>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        const lower = filterValue.toLowerCase();
        const client = row.original;
        return (
          client.name.toLowerCase().includes(lower) ||
          (client.email?.toLowerCase().includes(lower) ?? false) ||
          (client.company?.toLowerCase().includes(lower) ?? false)
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => row.getValue("email") || "\u2014",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      enableSorting: false,
      cell: ({ row }) => row.getValue("phone") || "\u2014",
    },
    {
      accessorKey: "company",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ row }) => row.getValue("company") || "\u2014",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as ClientStatus;
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
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onOpenDetail(row.original.id)}>
              <Eye className="size-4" />
              Details
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/clients/${row.original.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export default function ClientTable({ clients }: ClientTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [detailClient, setDetailClient] = useState<ClientWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDetail = useCallback((id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    getClientWithRelations(id)
      .then((data) => setDetailClient(data as ClientWithRelations | null))
      .finally(() => setDetailLoading(false));
  }, []);

  // Open detail dialog from search params (e.g. /clients?open=<id>)
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      openDetail(openId);
      router.replace("/clients", { scroll: false });
    }
  }, [searchParams, openDetail, router]);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailClient(null);
  }, []);

  const columns = useMemo(
    () =>
      buildColumns({
        onOpenDetail: openDetail,
        onDelete: (client) => setClientToDelete(client),
      }),
    [openDetail]
  );

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    const result = await deleteClientFromList(clientToDelete.id);
    setIsDeleting(false);
    setClientToDelete(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Client deleted");
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={clients}
        searchKey="name"
        searchPlaceholder="Search clients..."
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconUsers />
              </EmptyMedia>
              <EmptyTitle>No Clients Found</EmptyTitle>
              <EmptyDescription>
                Get started by adding your first client.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        action={<ClientCreateDialog />}
        toolbar={(table) => <ClientTableToolbar table={table} />}
      />

      <ClientDetailDialog
        client={detailClient}
        loading={detailLoading}
        open={detailOpen}
        onClose={closeDetail}
      />

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={
          clientToDelete
            ? `Are you sure you want to delete "${clientToDelete.name}"? This action is irreversible and will also delete all associated projects and invoices.`
            : ""
        }
        isLoading={isDeleting}
      />
    </>
  );
}
