"use client";

import { useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTimer } from "@/components/ui/TimerContext";
import { useToast } from "@/components/ui/Toast";
import { Plus, Clock, Play, Square, AlertCircle, DollarSign, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/lib/usePageTitle";
import { formatDate, formatDuration } from "@/lib/format";

// ---- Types matching the API response ----

interface TimeEntryProject {
  id: string;
  name: string;
  hourlyRate: string | null;
  client: { id: string; name: string };
}

interface TimeEntryTask {
  id: string;
  title: string;
}

interface TimeEntry {
  id: string;
  description: string | null;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  isBillable: boolean;
  isInvoiced: boolean;
  projectId: string;
  taskId: string | null;
  project: TimeEntryProject;
  task: TimeEntryTask | null;
}

interface TimeEntriesResponse {
  data: TimeEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
  totalMinutes: number;
  billableMinutes: number;
}

interface Project {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ProjectsResponse {
  data: Project[];
  [key: string]: unknown;
}

interface TaskOption {
  id: string;
  title: string;
}

interface TasksResponse {
  data: TaskOption[];
  [key: string]: unknown;
}

// ---- Helpers ----

/** Extract a YYYY-MM-DD date string from an ISO datetime for grouping. */
function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Group entries by their start-date. */
function groupByDate(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  return entries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const key = dateKey(entry.startTime);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
}

// ---- Component ----

export default function TimePage() {
  usePageTitle("Time Tracking");
  const timer = useTimer();
  const { toast } = useToast();

  // Filter state
  const [projectFilter, setProjectFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState<"all" | "billable" | "non-billable">("all");

  // Data state
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [billableMinutes, setBillableMinutes] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual entry modal state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProjectId, setManualProjectId] = useState("");
  const [manualTaskId, setManualTaskId] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualBillable, setManualBillable] = useState(true);
  const [manualTasks, setManualTasks] = useState<TaskOption[]>([]);
  const [manualTasksLoading, setManualTasksLoading] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ---- Fetch projects (once on mount) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiFetch<ProjectsResponse>("/api/projects?limit=100");
      if (!cancelled && res.data) {
        setProjects(res.data.data);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Fetch time entries (whenever filters change) ----
  const fetchEntries = useCallback(async (cursor?: string) => {
    const isLoadMore = !!cursor;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    const params = new URLSearchParams();
    params.set("limit", "50");

    if (projectFilter !== "all") {
      params.set("projectId", projectFilter);
    }
    if (billableFilter === "billable") {
      params.set("billable", "true");
    } else if (billableFilter === "non-billable") {
      params.set("billable", "false");
    }
    if (cursor) {
      params.set("cursor", cursor);
    }

    const res = await apiFetch<TimeEntriesResponse>(`/api/time-entries?${params.toString()}`);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (res.data) {
      const payload = res.data;
      if (isLoadMore) {
        setEntries((prev: TimeEntry[]) => [...prev, ...payload.data]);
      } else {
        setEntries(payload.data);
        setTotalMinutes(payload.totalMinutes);
        setBillableMinutes(payload.billableMinutes);
      }
      setNextCursor(payload.nextCursor);
      setHasMore(payload.hasMore);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [projectFilter, billableFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ---- Manual entry helpers ----

  // Fetch tasks when a project is selected in the manual entry form
  useEffect(() => {
    if (!manualProjectId) {
      setManualTasks([]);
      setManualTaskId("");
      return;
    }

    let cancelled = false;
    setManualTasksLoading(true);
    (async () => {
      const res = await apiFetch<TasksResponse>(`/api/projects/${manualProjectId}/tasks`);
      if (!cancelled && res.data) {
        setManualTasks(res.data.data.map((t) => ({ id: t.id, title: t.title })));
      }
      if (!cancelled) setManualTasksLoading(false);
    })();
    return () => { cancelled = true; };
  }, [manualProjectId]);

  function resetManualForm() {
    setManualProjectId("");
    setManualTaskId("");
    setManualHours("");
    setManualMinutes("");
    setManualDescription("");
    setManualBillable(true);
    setManualTasks([]);
    setManualError(null);
  }

  function openManualEntry() {
    resetManualForm();
    setShowManualEntry(true);
  }

  function closeManualEntry() {
    setShowManualEntry(false);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);

    const h = parseInt(manualHours || "0", 10);
    const m = parseInt(manualMinutes || "0", 10);

    if (isNaN(h) || isNaN(m) || h < 0 || m < 0) {
      setManualError("Please enter valid hours and minutes.");
      return;
    }

    const durationMinutes = h * 60 + m;

    if (durationMinutes < 1) {
      setManualError("Duration must be at least 1 minute.");
      return;
    }

    if (durationMinutes > 1440) {
      setManualError("Duration must be 24 hours or less.");
      return;
    }

    if (!manualProjectId) {
      setManualError("Please select a project.");
      return;
    }

    setManualSubmitting(true);

    const res = await apiFetch("/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        projectId: manualProjectId,
        taskId: manualTaskId || null,
        description: manualDescription.trim() || undefined,
        durationMinutes,
        isBillable: manualBillable,
      }),
    });

    setManualSubmitting(false);

    if (res.error) {
      setManualError(res.error);
      return;
    }

    toast("success", "Time entry added.");
    closeManualEntry();
    fetchEntries();
  }

  // ---- Derived data ----
  const grouped = groupByDate(entries);
  const totalHours = totalMinutes / 60;
  const billableHours = billableMinutes / 60;

  // ---- Render ----
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalHours.toFixed(1)}h total &middot; {billableHours.toFixed(1)}h billable
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timer.isActive ? (
            <button
              onClick={() => timer.stop()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
            >
              <Square size={16} /> Stop Timer
            </button>
          ) : (
            <button
              onClick={() => timer.start()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
            >
              <Play size={16} /> Start Timer
            </button>
          )}
          <button
            onClick={openManualEntry}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} /> Manual Entry
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Failed to load time entries</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchEntries()}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {(["all", "billable", "non-billable"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setBillableFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                billableFilter === filter
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter === "all" ? "All" : filter === "billable" ? "Billable" : "Non-billable"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 rounded mb-3" />
              <div className="space-y-2">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-1 h-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 rounded mb-2" />
                      <Skeleton className="h-3 w-64 rounded" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-1 h-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-52 rounded mb-2" />
                      <Skeleton className="h-3 w-56 rounded" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && entries.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon="time"
          headline="No time entries yet"
          description="Start a timer or add a manual entry to begin tracking your work hours."
          ctaLabel="Start Timer"
        />
      ) : !error ? (
        /* Time entries grouped by date */
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateEntries]) => {
              const dayTotalMinutes = dateEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">{formatDate(date)}</h3>
                    <span className="text-sm font-mono text-gray-500">{formatDuration(dayTotalMinutes)}</span>
                  </div>
                  <div className="space-y-2">
                    {dateEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                              entry.isBillable ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-800">
                                {entry.task?.title ?? entry.description ?? "Untitled entry"}
                              </p>
                              {entry.isBillable ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                  <DollarSign size={9} />
                                  Billable
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  Non-billable
                                </span>
                              )}
                              {entry.isInvoiced && (
                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  Invoiced
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {entry.project.name} &middot; {entry.project.client.name}
                            </p>
                            {entry.description && entry.task && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{entry.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold font-mono text-gray-800 flex items-center gap-1">
                              <Clock size={13} className="text-gray-400" />
                              {formatDuration(entry.durationMinutes)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchEntries(nextCursor ?? undefined)}
                disabled={loadingMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more entries"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeManualEntry} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <button
              onClick={closeManualEntry}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Time Entry</h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Project */}
              <div>
                <label htmlFor="manual-project" className="block text-sm font-medium text-gray-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="manual-project"
                  value={manualProjectId}
                  onChange={(e) => {
                    setManualProjectId(e.target.value);
                    setManualTaskId("");
                  }}
                  required
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Task (optional) */}
              <div>
                <label htmlFor="manual-task" className="block text-sm font-medium text-gray-700 mb-1">
                  Task <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  id="manual-task"
                  value={manualTaskId}
                  onChange={(e) => setManualTaskId(e.target.value)}
                  disabled={!manualProjectId || manualTasksLoading}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{manualTasksLoading ? "Loading tasks..." : "No task"}</option>
                  {manualTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      placeholder="0"
                      className="w-20 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    />
                    <span className="text-sm text-gray-500">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      placeholder="0"
                      className="w-20 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    />
                    <span className="text-sm text-gray-500">m</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="manual-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="manual-description"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="What did you work on?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                />
              </div>

              {/* Billable toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManualBillable(!manualBillable)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    manualBillable ? "bg-primary-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      manualBillable ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">Billable</span>
              </div>

              {/* Error */}
              {manualError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {manualError}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeManualEntry}
                  disabled={manualSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {manualSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
