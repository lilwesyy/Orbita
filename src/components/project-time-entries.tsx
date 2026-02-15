"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { IconClock } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
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
import type { TimeEntryWithRelations } from "@/types/time-entry";
import { formatDuration, formatDateTime } from "@/lib/utils";
import { deleteTimeEntry } from "@/actions/time-entries";
import ConfirmModal from "@/components/confirm-modal";

interface ProjectTimeEntriesProps {
  timeEntries: TimeEntryWithRelations[];
  projectId: string;
}

export function ProjectTimeEntries({
  timeEntries,
}: ProjectTimeEntriesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalMinutes = timeEntries.reduce(
    (sum, entry) => sum + (entry.duration ?? 0),
    0
  );

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteTimeEntry(deletingId);
      if (result?.error) toast.error(result.error);
      else toast.success("Time entry deleted");
      setDeletingId(null);
      setConfirmDeleteOpen(false);
    });
  };

  const columns: ColumnDef<TimeEntryWithRelations>[] = [
    {
      accessorKey: "startTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => formatDateTime(row.original.startTime),
    },
    {
      accessorFn: (row) => row.task?.title ?? "",
      id: "task",
      header: "Task",
      enableSorting: false,
      cell: ({ row }) => row.original.task?.title ?? "\u2014",
    },
    {
      accessorKey: "duration",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
      cell: ({ row }) => {
        const duration = row.original.duration;
        if (duration != null) return formatDuration(duration);
        return (
          <span className="text-warning font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            In progress
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.duration ?? Infinity;
        const b = rowB.original.duration ?? Infinity;
        return a - b;
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[200px]">
          {row.original.notes || "\u2014"}
        </span>
      ),
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
            <DropdownMenuItem
              variant="destructive"
              disabled={isPending && deletingId === row.original.id}
              onClick={() => handleDeleteRequest(row.original.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Hours Logged
              </h3>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(totalMinutes)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Entries
              </h3>
              <p className="text-2xl font-bold text-foreground text-right">
                {timeEntries.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={timeEntries}
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconClock />
              </EmptyMedia>
              <EmptyTitle>No Time Entries</EmptyTitle>
              <EmptyDescription>
                No time has been tracked for this project yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => { setConfirmDeleteOpen(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action is irreversible."
        isLoading={isPending}
      />
    </div>
  );
}
