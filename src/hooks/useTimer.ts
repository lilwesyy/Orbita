"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  projectId: string | null;
  taskId: string | null;
  timeEntryId: string | null;
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  formattedTime: string;
  projectId: string | null;
  taskId: string | null;
  timeEntryId: string | null;
  start: (projectId: string, taskId: string | null, timeEntryId: string) => void;
  stop: () => string | null;
  reset: () => void;
}

const STORAGE_KEY = "orbita-timer";

function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

function loadTimerState(): TimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as TimerState;
    if (parsed.isRunning && parsed.startTime) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveTimerState(state: TimerState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or unavailable
  }
}

function clearTimerState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useTimer(): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback((startIso: string) => {
    clearInterval_();
    const startDate = new Date(startIso);
    const tick = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startDate.getTime()) / 1000);
      setElapsedSeconds(Math.max(diff, 0));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [clearInterval_]);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = loadTimerState();
    if (stored && stored.isRunning && stored.startTime) {
      setIsRunning(true);
      setStartTime(stored.startTime);
      setProjectId(stored.projectId);
      setTaskId(stored.taskId);
      setTimeEntryId(stored.timeEntryId);
      startInterval(stored.startTime);
    }

    return () => {
      clearInterval_();
    };
  }, [startInterval, clearInterval_]);

  const start = useCallback(
    (pId: string, tId: string | null, teId: string) => {
      const now = new Date().toISOString();
      setIsRunning(true);
      setStartTime(now);
      setProjectId(pId);
      setTaskId(tId);
      setTimeEntryId(teId);
      setElapsedSeconds(0);

      saveTimerState({
        isRunning: true,
        startTime: now,
        projectId: pId,
        taskId: tId,
        timeEntryId: teId,
      });

      startInterval(now);
    },
    [startInterval]
  );

  const stop = useCallback((): string | null => {
    clearInterval_();
    const currentEntryId = timeEntryId;
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setProjectId(null);
    setTaskId(null);
    setTimeEntryId(null);
    clearTimerState();
    return currentEntryId;
  }, [clearInterval_, timeEntryId]);

  const reset = useCallback(() => {
    clearInterval_();
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setProjectId(null);
    setTaskId(null);
    setTimeEntryId(null);
    clearTimerState();
  }, [clearInterval_]);

  const formattedTime = formatElapsedTime(elapsedSeconds);

  return {
    isRunning,
    elapsedSeconds,
    formattedTime,
    projectId,
    taskId,
    timeEntryId,
    start,
    stop,
    reset,
  };
}
