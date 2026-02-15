"use client";

import { useState, useTransition, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { GripVertical, Pencil, ListTodo, Loader, CheckCircle2 } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTaskStatus } from "@/actions/tasks";
import { stripHtml } from "@/lib/utils";
import {
  statusConfig,
  priorityConfig,
  type TaskWithSubtasks,
} from "@/components/task-list";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

// --- Priority sort order ---

const priorityOrder: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function sortByPriorityThenDate(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
  return [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// --- Column ---

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

const emptyStateConfig: Record<TaskStatus, { icon: typeof ListTodo; title: string; description: string }> = {
  TODO: { icon: ListTodo, title: "No tasks yet", description: "Create a new task or drag one here" },
  IN_PROGRESS: { icon: Loader, title: "Nothing in progress", description: "Drag a task here to start working on it" },
  DONE: { icon: CheckCircle2, title: "No completed tasks", description: "Drag finished tasks here" },
};

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: TaskWithSubtasks[];
  onEdit: (task: TaskWithSubtasks) => void;
}

function KanbanColumn({ status, label, tasks, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-muted/30 min-h-[300px] transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3 border-b">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 p-2 flex-1">
        {tasks.length === 0 ? (
          <ColumnEmpty status={status} />
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}

function ColumnEmpty({ status }: { status: TaskStatus }) {
  const cfg = emptyStateConfig[status];
  const Icon = cfg.icon;

  return (
    <Empty className="border-0 bg-transparent py-8 min-h-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-sm">{cfg.title}</EmptyTitle>
        <EmptyDescription className="text-xs">{cfg.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// --- Draggable Card ---

interface KanbanCardProps {
  task: TaskWithSubtasks;
  onEdit: (task: TaskWithSubtasks) => void;
  overlay?: boolean;
}

function KanbanCard({ task, onEdit, overlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const pCfg = priorityConfig[task.priority];
  const PriorityIcon = pCfg.icon;
  const plainDesc = task.description ? stripHtml(task.description) : "";
  const subtasksDone = task.subtasks.filter((s) => s.completed).length;
  const subtasksTotal = task.subtasks.length;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      } ${overlay ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""}`}
      {...(overlay ? {} : { ...attributes, ...listeners })}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="size-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{task.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 ml-auto"
              onClick={() => onEdit(task)}
            >
              <Pencil className="size-3" />
            </Button>
          </div>
          {plainDesc && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {plainDesc}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={pCfg.variant} className="text-[10px] px-1.5 py-0 gap-0.5">
              <PriorityIcon className="size-3" />
              {pCfg.label}
            </Badge>
            {subtasksTotal > 0 && (
              <Badge
                variant={subtasksDone === subtasksTotal ? "success" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {subtasksDone}/{subtasksTotal}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Board ---

interface KanbanBoardProps {
  tasks: TaskWithSubtasks[];
  projectId: string;
  onEdit: (task: TaskWithSubtasks) => void;
}

export function KanbanBoard({ tasks, projectId, onEdit }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithSubtasks | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;
      const task = tasks.find((t) => t.id === taskId);

      if (!task || task.status === newStatus) return;

      startTransition(async () => {
        const result = await updateTaskStatus(taskId, newStatus, projectId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            `Moved to ${statusConfig[newStatus].label}`
          );
        }
      });
    },
    [tasks, projectId]
  );

  const tasksByStatus = (status: TaskStatus) =>
    sortByPriorityThenDate(tasks.filter((t) => t.status === status));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasksByStatus(col.status)}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <KanbanCard task={activeTask} onEdit={onEdit} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
