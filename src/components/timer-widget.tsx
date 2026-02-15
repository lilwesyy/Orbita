"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Clock, Play, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTimer } from "@/hooks/useTimer";
import { startTimer, stopTimer } from "@/actions/time-entries";

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

interface TimerWidgetProps {
  projects: ProjectWithTasks[];
}

interface TimerActionResult {
  error?: string;
  success?: boolean;
  timeEntryId?: string;
}

export function TimerWidget({ projects }: TimerWidgetProps) {
  const timer = useTimer();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isStopping, setIsStopping] = useState(false);

  const [startState, startFormAction, isStarting] = useActionState<
    TimerActionResult,
    FormData
  >(startTimer, {});

  const prevStartStateRef = useRef(startState);

  useEffect(() => {
    if (startState !== prevStartStateRef.current) {
      prevStartStateRef.current = startState;
      if (startState.success && startState.timeEntryId) {
        timer.start(
          selectedProjectId,
          selectedTaskId || null,
          startState.timeEntryId
        );
        toast.success("Timer started");
      } else if (startState.error) {
        toast.error(startState.error);
      }
    }
  }, [startState, selectedProjectId, selectedTaskId, timer]);

  const filteredTasks = projects.find(
    (p) => p.id === selectedProjectId
  )?.tasks ?? [];

  const runningProjectName = timer.isRunning
    ? projects.find((p) => p.id === timer.projectId)?.name ?? "—"
    : "";

  const runningTaskName = timer.isRunning && timer.taskId
    ? projects
        .find((p) => p.id === timer.projectId)
        ?.tasks.find((t) => t.id === timer.taskId)?.title ?? "—"
    : "";

  const handleStop = async () => {
    if (!timer.timeEntryId) return;
    setIsStopping(true);
    const result = await stopTimer(timer.timeEntryId);
    if (result.success) {
      timer.stop();
      toast.success("Timer stopped");
    } else if (result.error) {
      toast.error(result.error);
    }
    setIsStopping(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Timer
            </h2>
          </div>

          {timer.isRunning ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-4xl font-mono font-bold text-primary tracking-wider">
                {timer.formattedTime}
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  Project:{" "}
                  <span className="font-medium text-foreground">
                    {runningProjectName}
                  </span>
                </p>
                {runningTaskName && (
                  <p className="text-sm text-muted-foreground">
                    Task:{" "}
                    <span className="font-medium text-foreground">
                      {runningTaskName}
                    </span>
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleStop}
                loading={isStopping}
              >
                {!isStopping && <Square className="w-5 h-5 mr-1" />}
                Stop Timer
              </Button>
            </div>
          ) : (
            <form action={startFormAction}>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    name="projectId"
                    value={selectedProjectId}
                    onValueChange={(val) => {
                      setSelectedProjectId(val);
                      setSelectedTaskId("");
                    }}
                    disabled={isStarting}
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

                {filteredTasks.length > 0 && (
                  <div className="space-y-2">
                    <Label>Task (optional)</Label>
                    <Select
                      name="taskId"
                      value={selectedTaskId}
                      onValueChange={setSelectedTaskId}
                      disabled={isStarting}
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
                )}

                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  disabled={!selectedProjectId}
                  loading={isStarting}
                >
                  {!isStarting && <Play className="w-5 h-5 mr-1" />}
                  Start Timer
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
