"use client";

import { useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Clock, Play, AlertCircle, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/api";
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
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors">
            <Play size={16} /> Start Timer
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
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
    </>
  );
}
