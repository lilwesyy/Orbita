"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { IconClock } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { TimeEntryListItem } from "@/types/time-entry";
import { formatDuration, formatDateTime } from "@/lib/utils";
import { deleteTimeEntry } from "@/actions/time-entries";
import ConfirmModal from "@/components/confirm-modal";

interface TimeEntryTableProps {
  timeEntries: TimeEntryListItem[];
}

export function TimeEntryTable({ timeEntries }: TimeEntryTableProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredEntries = useMemo(() => {
    let entries = timeEntries;

    if (dateFrom) {
      const from = new Date(dateFrom);
      entries = entries.filter((e) => new Date(e.startTime) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      entries = entries.filter((e) => new Date(e.startTime) <= to);
    }

    return entries;
  }, [timeEntries, dateFrom, dateTo]);

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

  const totalMinutes = filteredEntries.reduce(
    (sum, entry) => sum + (entry.duration ?? 0),
    0
  );

  const columns: ColumnDef<TimeEntryListItem>[] = [
    {
      accessorKey: "startTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => formatDateTime(row.original.startTime),
    },
    {
      accessorFn: (row) => row.project.name,
      id: "project",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.project.name}</span>
      ),
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
            <svg
              className="w-4 h-4 animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
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
    <>
    <DataTable
      columns={columns}
      data={filteredEntries}
      emptyMessage={
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconClock />
            </EmptyMedia>
            <EmptyTitle>No Time Entries Found</EmptyTitle>
            <EmptyDescription>
              {dateFrom || dateTo
                ? "No entries match the selected date range. Try adjusting the filters."
                : "Start tracking time to see your entries here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
      toolbar={
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {totalMinutes > 0 && (
            <div className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-semibold text-foreground">
                {formatDuration(totalMinutes)}
              </span>{" "}
              ({filteredEntries.length} entries)
            </div>
          )}
        </div>
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
    </>
  );
}
