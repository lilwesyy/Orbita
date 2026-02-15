"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createTimeEntry } from "@/actions/time-entries";

interface TaskOption {
  id: string;
  title: string;
  status: string;
}

interface ProjectWithTasks {
  id: string;
  name: string;
  tasks: TaskOption[];
}

interface TimeEntryFormProps {
  projects: ProjectWithTasks[];
}

interface TimeEntryActionResult {
  error?: string;
  success?: boolean;
}

export function TimeEntryForm({ projects }: TimeEntryFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [useManualDuration, setUseManualDuration] = useState(false);

  const [state, formAction, isPending] = useActionState<
    TimeEntryActionResult,
    FormData
  >(createTimeEntry, {});

  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Time entry created");
      setSelectedProjectId("");
      setSelectedTaskId("");
    }
  }, [state]);

  const filteredTasks = projects.find(
    (p) => p.id === selectedProjectId
  )?.tasks ?? [];

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Manual Entry
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                name="projectId"
                value={selectedProjectId}
                onValueChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedTaskId("");
                }}
                disabled={isPending}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task (optional)</Label>
              <Select
                name="taskId"
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
                disabled={isPending || filteredTasks.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Date &amp; Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                name="startTime"
                required
                disabled={isPending}
              />
            </div>

            {!useManualDuration ? (
              <div className="space-y-2">
                <Label htmlFor="endTime">End Date &amp; Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  name="endTime"
                  disabled={isPending}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  name="duration"
                  min={1}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setUseManualDuration(!useManualDuration)}
            >
              {useManualDuration
                ? "Use end time"
                : "Enter duration manually"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (EUR)</Label>
              <Input
                id="hourlyRate"
                type="number"
                name="hourlyRate"
                step="0.01"
                min={0}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional notes..."
              disabled={isPending}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              loading={isPending}
              disabled={!selectedProjectId}
            >
              <Clock /> Log Time
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
