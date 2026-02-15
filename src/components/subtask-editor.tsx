"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

export interface SubtaskItem {
  title: string;
  completed: boolean;
}

interface SubtaskEditorProps {
  subtasks: SubtaskItem[];
  onChange: (subtasks: SubtaskItem[]) => void;
  disabled?: boolean;
}

export default function SubtaskEditor({
  subtasks,
  onChange,
  disabled = false,
}: SubtaskEditorProps) {
  const addSubtask = useCallback(() => {
    onChange([...subtasks, { title: "", completed: false }]);
  }, [subtasks, onChange]);

  const removeSubtask = useCallback(
    (index: number) => {
      onChange(subtasks.filter((_, i) => i !== index));
    },
    [subtasks, onChange]
  );

  const updateTitle = useCallback(
    (index: number, title: string) => {
      onChange(
        subtasks.map((s, i) => (i === index ? { ...s, title } : s))
      );
    },
    [subtasks, onChange]
  );

  const toggleCompleted = useCallback(
    (index: number) => {
      onChange(
        subtasks.map((s, i) =>
          i === index ? { ...s, completed: !s.completed } : s
        )
      );
    },
    [subtasks, onChange]
  );

  return (
    <div className="space-y-2">
      {subtasks.map((subtask, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={() => toggleCompleted(index)}
            disabled={disabled}
          />
          <Input
            value={subtask.title}
            onChange={(e) => updateTitle(index, e.target.value)}
            placeholder="Subtask title..."
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => removeSubtask(index)}
            disabled={disabled}
            aria-label="Remove subtask"
            className="text-destructive hover:text-destructive shrink-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={addSubtask}
        disabled={disabled}
      >
        <Plus className="size-4" />
        Add subtask
      </Button>
    </div>
  );
}
