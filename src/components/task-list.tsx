"use client";

import { useState, useCallback, useMemo, useActionState, useEffect, useRef, useTransition, type RefObject } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, X, CircleDashed, Timer, CircleCheck, ArrowDown, ArrowRight, ArrowUp, AlertTriangle, Pencil } from "lucide-react";
import { IconListCheck } from "@tabler/icons-react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import type { Task, TaskStatus, TaskPriority, Subtask } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  deleteTask,
} from "@/actions/tasks";
import { formatDate, stripHtml } from "@/lib/utils";
import ConfirmModal from "@/components/confirm-modal";
import TiptapEditor from "@/components/tiptap-editor";
import SubtaskEditor, { type SubtaskItem } from "@/components/subtask-editor";

// --- Types ---

export type TaskWithSubtasks = Task & { subtasks: Subtask[] };

// --- Config ---

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const statusConfig: Record<TaskStatus, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  TODO: { label: "Todo", variant: "outline", icon: CircleDashed },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: Timer },
  DONE: { label: "Done", variant: "success", icon: CircleCheck },
};

export const priorityConfig: Record<TaskPriority, { label: string; variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }> = {
  LOW: { label: "Low", variant: "outline", icon: ArrowDown },
  MEDIUM: { label: "Medium", variant: "secondary", icon: ArrowRight },
  HIGH: { label: "High", variant: "warning", icon: ArrowUp },
  URGENT: { label: "Urgent", variant: "destructive", icon: AlertTriangle },
};

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const priorityOptions = Object.entries(priorityConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const allStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

// --- Done Checkbox ---

interface TaskDoneCheckboxProps {
  task: TaskWithSubtasks;
  projectId: string;
}

function TaskDoneCheckbox({ task, projectId }: TaskDoneCheckboxProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  const handleToggle = () => {
    startTransition(async () => {
      const newStatus: TaskStatus = isDone ? "TODO" : "DONE";
      const result = await updateTaskStatus(task.id, newStatus, projectId);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Checkbox
      checked={isDone}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={isDone ? "Mark as todo" : "Mark as done"}
    />
  );
}

interface TaskDoneAllCheckboxProps {
  tasks: TaskWithSubtasks[];
  projectId: string;
}

function TaskDoneAllCheckbox({ tasks, projectId }: TaskDoneAllCheckboxProps) {
  const [isPending, startTransition] = useTransition();
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === "DONE");

  const handleToggleAll = () => {
    const newStatus: TaskStatus = allDone ? "TODO" : "DONE";
    startTransition(async () => {
      const results = await Promise.all(
        tasks
          .filter((t) => t.status !== newStatus)
          .map((t) => updateTaskStatus(t.id, newStatus, projectId))
      );
      const errors = results.filter((r) => r.error);
      if (errors.length) toast.error(`${errors.length} task(s) failed to update`);
    });
  };

  return (
    <Checkbox
      checked={allDone}
      onCheckedChange={handleToggleAll}
      disabled={isPending || tasks.length === 0}
      aria-label={allDone ? "Mark all as todo" : "Mark all as done"}
    />
  );
}

// --- Subtask Progress Badge ---

function SubtaskProgressBadge({ subtasks }: { subtasks: Subtask[] }) {
  if (subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.completed).length;
  return (
    <Badge variant={done === subtasks.length ? "success" : "secondary"} className="text-[10px] px-1.5 py-0">
      {done}/{subtasks.length}
    </Badge>
  );
}

// --- Inline Subtask Toggle ---

function SubtaskToggleList({ subtasks, projectId }: { subtasks: Subtask[]; projectId: string }) {
  const [isPending, startTransition] = useTransition();

  if (subtasks.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <Checkbox
            checked={s.completed}
            onCheckedChange={() => {
              startTransition(async () => {
                const result = await toggleSubtask(s.id, projectId, s.completed);
                if (result.error) toast.error(result.error);
              });
            }}
            disabled={isPending}
            className="size-3.5"
          />
          <span className={`text-xs ${s.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {s.title}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Row Actions ---

interface TaskRowActionsProps {
  task: TaskWithSubtasks;
  projectId: string;
  onEdit: (task: TaskWithSubtasks) => void;
  onDelete: (id: string, title: string) => void;
}

function TaskRowActions({ task, projectId, onEdit, onDelete }: TaskRowActionsProps) {
  const handleStatusChange = async (status: TaskStatus) => {
    const result = await updateTaskStatus(task.id, status, projectId);
    if (result.error) toast.error(result.error);
    else toast.success(`Status changed to ${statusConfig[status].label}`);
  };

  return (
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
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Set status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {allStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={task.status === status}
                onClick={() => handleStatusChange(status)}
              >
                {statusConfig[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id, task.title)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Create Task Dialog ---

interface CreateTaskDialogProps {
  projectId: string;
}

export function CreateTaskDialog({ projectId }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const boundCreateTask = createTask.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(boundCreateTask, {});
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Task created");
      setDescription("");
      setSubtasks([]);
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task to this project.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="subtasks" value={JSON.stringify(subtasks)} />
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Task description..."
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select name="priority" defaultValue="MEDIUM" disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subtasks</Label>
            <SubtaskEditor
              subtasks={subtasks}
              onChange={setSubtasks}
              disabled={isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              <Plus /> Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Task Dialog ---

interface EditTaskDialogProps {
  task: TaskWithSubtasks | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, projectId, open, onOpenChange }: EditTaskDialogProps) {
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const boundUpdateTask = task
    ? updateTask.bind(null, task.id, projectId)
    : async () => ({ error: "No task selected" });
  const [state, formAction, isPending] = useActionState(boundUpdateTask, {});
  const prevStateRef = useRef(state);

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setDescription(task.description || "");
      setSubtasks(
        task.subtasks.map((s) => ({ title: s.title, completed: s.completed }))
      );
    }
  }, [task]);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Task updated");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update this task&apos;s details.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="subtasks" value={JSON.stringify(subtasks)} />
          <input type="hidden" name="status" value={task.status} />
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={task.title}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Task description..."
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select name="priority" defaultValue={task.priority} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                name="status"
                defaultValue={task.status}
                disabled={isPending}
                onValueChange={(v) => {
                  const hidden = formRef.current?.querySelector<HTMLInputElement>(
                    'input[name="status"]'
                  );
                  if (hidden) hidden.value = v;
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subtasks</Label>
            <SubtaskEditor
              subtasks={subtasks}
              onChange={setSubtasks}
              disabled={isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Toolbar ---

function TaskTableToolbar({ table }: { table: Table<TaskWithSubtasks> }) {
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
      {table.getColumn("priority") && (
        <DataTableFacetedFilter
          column={table.getColumn("priority")}
          title="Priority"
          options={priorityOptions}
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

function getColumns(
  projectId: string,
  onEdit: (task: TaskWithSubtasks) => void,
  onDelete: (id: string, title: string) => void
): ColumnDef<TaskWithSubtasks>[] {
  return [
    {
      id: "done",
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <TaskDoneAllCheckbox
          tasks={table.getFilteredRowModel().rows.map((r) => r.original)}
          projectId={projectId}
        />
      ),
      cell: ({ row }) => (
        <TaskDoneCheckbox task={row.original} projectId={projectId} />
      ),
    },
    {
      accessorKey: "id",
      header: "Task",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const task = row.original;
        const plainDesc = task.description ? stripHtml(task.description) : "";
        return (
          <div className="max-w-[300px]">
            <div className="flex items-center gap-2">
              <span className="font-medium">{task.title}</span>
              <SubtaskProgressBadge subtasks={task.subtasks} />
            </div>
            {plainDesc && (
              <div className="text-xs text-muted-foreground truncate">
                {plainDesc}
              </div>
            )}
            <SubtaskToggleList subtasks={task.subtasks} projectId={projectId} />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as TaskStatus;
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
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => {
        const priority = row.getValue("priority") as TaskPriority;
        return (
          <Badge variant={priorityConfig[priority].variant}>
            {priorityConfig[priority].label}
          </Badge>
        );
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
      sortingFn: (rowA, rowB) => {
        const order: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };
        return order[rowA.original.priority] - order[rowB.original.priority];
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <TaskRowActions task={row.original} projectId={projectId} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
}

// --- Main Component ---

interface TaskListProps {
  tasks: TaskWithSubtasks[];
  projectId: string;
}

export function TaskList({ tasks, projectId }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteIdRef = useRef<string | null>(null);

  const handleEdit = useCallback((task: TaskWithSubtasks) => {
    setEditingTask(task);
    setEditOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string, title: string) => {
    deleteIdRef.current = id;
    setDeleteTitle(title);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteIdRef.current) return;
    setIsDeleting(true);
    const result = await deleteTask(deleteIdRef.current, projectId);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Task deleted");
      setDeleteOpen(false);
    }
  }, [projectId]);

  const columns = useMemo(() => getColumns(projectId, handleEdit, handleDeleteRequest), [projectId, handleEdit, handleDeleteRequest]);

  return (
    <>
      <DataTable
        columns={columns}
        data={tasks}
        searchKey="title"
        searchPlaceholder="Filter tasks..."
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconListCheck />
              </EmptyMedia>
              <EmptyTitle>No Tasks Found</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first task.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        toolbar={(table) => <TaskTableToolbar table={table} />}
      />
      <EditTaskDialog
        task={editingTask}
        projectId={projectId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTitle}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </>
  );
}
