"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface TimerTask {
  id: string;
  title: string;
}

export interface TimerProject {
  id: string;
  name: string;
}

interface TimerState {
  /** Whether a timer session exists (running or paused) */
  isActive: boolean;
  /** Whether the timer is currently ticking (false when paused) */
  isRunning: boolean;
  /** Elapsed seconds since the timer started (excluding paused time) */
  elapsedSeconds: number;
  /** The task being timed, if any */
  task: TimerTask | null;
  /** The project being timed, if any */
  project: TimerProject | null;
}

interface TimerActions {
  /** Start a new timer, optionally for a specific task/project */
  start: (opts?: { task?: TimerTask; project?: TimerProject }) => void;
  /** Pause the running timer */
  pause: () => void;
  /** Resume a paused timer */
  resume: () => void;
  /** Stop the timer and return the elapsed seconds */
  stop: () => number;
  /** Discard the current timer without saving */
  discard: () => void;
}

type TimerContextValue = TimerState & TimerActions;

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimer must be used within a <TimerProvider>");
  }
  return ctx;
}

/** Format elapsed seconds as HH:MM:SS */
export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [task, setTask] = useState<TimerTask | null>(null);
  const [project, setProject] = useState<TimerProject | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(
    (opts?: { task?: TimerTask; project?: TimerProject }) => {
      setTask(opts?.task ?? null);
      setProject(opts?.project ?? null);
      setElapsedSeconds(0);
      setIsActive(true);
      setIsRunning(true);
    },
    [],
  );

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsActive(false);
    const seconds = elapsedSeconds;
    setElapsedSeconds(0);
    setTask(null);
    setProject(null);
    return seconds;
  }, [elapsedSeconds]);

  const discard = useCallback(() => {
    setIsRunning(false);
    setIsActive(false);
    setElapsedSeconds(0);
    setTask(null);
    setProject(null);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        isActive,
        isRunning,
        elapsedSeconds,
        task,
        project,
        start,
        pause,
        resume,
        stop,
        discard,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
