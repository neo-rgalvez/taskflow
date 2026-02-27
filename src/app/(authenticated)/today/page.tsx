"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Play, CheckCircle2, Calendar, Clock, Sun } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  totalMinutes: number;
  updatedAt: string;
  project: { id: string; name: string; client: { id: string; name: string } } | null;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDisplay = formatDate(todayStr);

  const fetchTodayData = useCallback(async () => {
    setLoading(true);

    // Get tasks due today or overdue (not done)
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [todayResult, overdueResult] = await Promise.all([
      apiFetch<{ data: TaskItem[] }>(
        `/api/tasks?dueBefore=${endOfToday.toISOString()}&sort=priority&order=asc&limit=50`
      ),
      apiFetch<{ totalMinutes: number }>(
        `/api/time-entries?dateFrom=${todayStr}T00:00:00.000Z&dateTo=${endOfToday.toISOString()}&limit=1`
      ),
    ]);

    if (todayResult.data) {
      // Filter to only non-done tasks
      const allTasks = todayResult.data.data.filter(
        (t) => t.status !== "done"
      );
      setTasks(allTasks);
    }

    if (overdueResult.data) {
      setTodayMinutes(overdueResult.data.totalMinutes || 0);
    }

    setLoading(false);
  }, [todayStr]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeTasks = tasks.filter((t) => !completedIds.includes(t.id));
  const completedTasks = tasks.filter((t) => completedIds.includes(t.id));
  const totalHours = Math.round((todayMinutes / 60) * 100) / 100;

  const isEmpty = !loading && tasks.length === 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sun size={28} className="text-amber-500" />
            Today
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {todayDisplay} &middot; {tasks.length} tasks &middot; {totalHours}h logged
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-64 rounded mb-2" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon="time"
          headline="Nothing scheduled for today"
          description="Enjoy your free day, or add tasks from your project boards."
          ctaLabel="View Projects"
          ctaHref="/projects"
        />
      ) : (
        <div className="space-y-6">
          {/* Active Tasks */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              To Do ({activeTasks.length})
            </h2>
            <div className="space-y-2">
              {activeTasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center transition-colors flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{task.title}</p>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {task.project && (
                            <Link href={`/projects/${task.project.id}`} className="hover:text-primary-500 font-medium">
                              {task.project.name}
                            </Link>
                          )}
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
                              <Calendar size={11} />
                              {formatDate(task.dueDate.split("T")[0])}
                              {isOverdue && " (overdue)"}
                            </span>
                          )}
                          {task.totalMinutes > 0 && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={11} />
                              {formatDuration(task.totalMinutes)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={task.status} />
                        <button className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors">
                          <Play size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Completed ({completedTasks.length})
              </h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                      >
                        <CheckCircle2 size={14} className="text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 line-through">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.project?.name ?? "Unknown project"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Summary */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Daily Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono">{totalHours}h</p>
                <p className="text-xs text-gray-500">Hours Logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono">{tasks.length}</p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono">{completedIds.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
