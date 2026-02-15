"use client";

import { useState, useCallback, useMemo, useTransition, useRef } from "react";
import Link from "next/link";
import { X, MoreHorizontal, FileEdit, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { IconFolderCode } from "@tabler/icons-react";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ProjectCreateDialog, { ProjectEditDialog } from "@/components/project-create-dialog";
import ConfirmModal from "@/components/confirm-modal";
import { updateProjectStatus, deleteProjectFromList } from "@/actions/projects";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, Client, ProjectStatus } from "@/generated/prisma/client";

interface ProjectWithClient extends Omit<Project, "budget" | "hourlyRate"> {
  client: Client;
  budget: string | null;
  hourlyRate: string | null;
}

interface ProjectTableProps {
  projects: ProjectWithClient[];
  clients: Client[];
}

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const statusConfig: Record<ProjectStatus, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  PROPOSAL: { label: "Proposal", variant: "warning", icon: FileEdit },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: Clock },
  REVIEW: { label: "Review", variant: "secondary", icon: AlertCircle },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const allStatuses: ProjectStatus[] = ["PROPOSAL", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"];

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

// --- Row Actions ---

interface ProjectRowActionsProps {
  project: ProjectWithClient;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

function ProjectRowActions({ project, onEdit, onDelete }: ProjectRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: ProjectStatus) => {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, newStatus);
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
        <DropdownMenuItem asChild>
          <Link href={`/projects/${project.id}`}>
            <Eye className="size-4" />
            Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(project.id)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Set status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {allStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={project.status === status}
                onClick={() => handleStatusChange(status)}
              >
                {statusConfig[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(project.id, project.name)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Toolbar ---

function ProjectTableToolbar({ table }: { table: Table<ProjectWithClient> }) {
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

// --- Columns ---

function getColumns(onEdit: (id: string) => void, onDelete: (id: string, name: string) => void): ColumnDef<ProjectWithClient>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      filterFn: (row, _columnId, filterValue: string) => {
        const lower = filterValue.toLowerCase();
        return (
          row.original.name.toLowerCase().includes(lower) ||
          row.original.client.name.toLowerCase().includes(lower)
        );
      },
      cell: ({ row }) => (
        <Link
          href={`/projects/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorFn: (row) => row.client.name,
      id: "client",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as ProjectStatus;
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
      accessorKey: "budget",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Budget" />,
      cell: ({ row }) => {
        const budget = row.original.budget;
        return budget ? formatCurrency(String(budget)) : "\u2014";
      },
      sortingFn: (rowA, rowB) => {
        const a = Number(rowA.original.budget) || 0;
        const b = Number(rowB.original.budget) || 0;
        return a - b;
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
      cell: ({ row }) => {
        const date = row.original.startDate;
        return date ? formatDate(date) : "\u2014";
      },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => <ProjectRowActions project={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

// --- Main Component ---

export function ProjectTable({ projects, clients }: ProjectTableProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteIdRef = useRef<string | null>(null);

  const handleEdit = useCallback((id: string) => {
    setEditId(id);
    setEditOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    deleteIdRef.current = id;
    setDeleteName(name);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteIdRef.current) return;
    setIsDeleting(true);
    const result = await deleteProjectFromList(deleteIdRef.current);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Project deleted");
      setDeleteOpen(false);
    }
  }, []);

  const columns = useMemo(() => getColumns(handleEdit, handleDeleteRequest), [handleEdit, handleDeleteRequest]);

  return (
    <>
      <DataTable
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Search by name or client..."
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFolderCode />
              </EmptyMedia>
              <EmptyTitle>No Projects Found</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first project.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        action={<ProjectCreateDialog clients={clients} />}
        toolbar={(table) => <ProjectTableToolbar table={table} />}
      />
      <ProjectEditDialog
        projectId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
      />
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteName}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </>
  );
}
