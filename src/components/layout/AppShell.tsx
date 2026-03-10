"use client";

import { Sidebar, MobileHeader } from "./Sidebar";
import { Pause, Play, Square, X } from "lucide-react";
import { useTimer, formatElapsed } from "@/components/ui/TimerContext";

function ActiveTimerBar() {
  const { isActive, isRunning, elapsedSeconds, task, project, pause, resume, stop, discard } =
    useTimer();

  if (!isActive) return null;

  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 lg:left-60 z-[35] bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {isRunning ? (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
            </span>
          )}
          <span className="font-mono text-sm font-semibold">
            {formatElapsed(elapsedSeconds)}
          </span>
          {!isRunning && (
            <span className="text-xs text-yellow-200 font-medium">PAUSED</span>
          )}
          {task && (
            <>
              <span className="text-primary-200 hidden sm:inline">|</span>
              <span className="text-sm text-primary-100 truncate hidden sm:inline">
                {task.title}
              </span>
            </>
          )}
          {project && (
            <span className="text-xs text-primary-200 truncate hidden sm:inline">
              — {project.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isRunning ? (
            <button
              onClick={pause}
              className="p-1.5 rounded-md hover:bg-primary-500 transition-colors"
              title="Pause"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={resume}
              className="p-1.5 rounded-md hover:bg-primary-500 transition-colors"
              title="Resume"
            >
              <Play size={16} />
            </button>
          )}
          <button
            onClick={() => stop()}
            className="p-1.5 rounded-md hover:bg-primary-500 transition-colors"
            title="Stop"
          >
            <Square size={16} />
          </button>
          <button
            onClick={discard}
            className="p-1.5 rounded-md hover:bg-primary-500 transition-colors"
            title="Discard"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <MobileHeader />
      <main id="main-content" className="lg:pl-60 pb-28 lg:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <ActiveTimerBar />
    </div>
  );
}
