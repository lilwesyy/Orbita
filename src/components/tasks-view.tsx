"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { TaskList, type TaskWithSubtasks } from "@/components/task-list";
import { KanbanBoard } from "@/components/kanban-board";
import { EditTaskDialog } from "@/components/task-list";

interface TasksViewProps {
  tasks: TaskWithSubtasks[];
  projectId: string;
}

export function TasksView({ tasks, projectId }: TasksViewProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "table";
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = useCallback((task: TaskWithSubtasks) => {
    setEditingTask(task);
    setEditOpen(true);
  }, []);

  if (view === "kanban") {
    return (
      <>
        <KanbanBoard tasks={tasks} projectId={projectId} onEdit={handleEdit} />
        <EditTaskDialog
          task={editingTask}
          projectId={projectId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      </>
    );
  }

  return <TaskList tasks={tasks} projectId={projectId} />;
}
