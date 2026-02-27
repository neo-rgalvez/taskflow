"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, SlidersHorizontal, Calendar, Clock, MessageSquare, ChevronDown, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/format";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskSubtask {
  id: string;
  isCompleted: boolean;
}

interface TaskProject {
  id: string;
  name: string;
  client: { id: string; name: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: TaskProject;
  subtasks: TaskSubtask[];
  totalMinutes: number;
  commentCount: number;
  timeEntryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  data: Task[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

interface Project {
  id: string;
  name: string;
}

interface ProjectsResponse {
  data: Project[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  review: "Review",
  done: "Done",
};

const sortOptions: { label: string; value: string }[] = [
  { label: "Due Date", value: "dueDate" },
  { label: "Priority", value: "priority" },
  { label: "Status", value: "status" },
  { label: "Project", value: "project" },
  { label: "Created", value: "createdAt" },
];

const statusFilterOptions = ["all", "todo", "in_progress", "waiting_on_client", "review", "done"];

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Hook: debounced value
// ---------------------------------------------------------------------------

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function TasksPage() {
  // Filter / sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Projects for filter dropdown
  const [projects, setProjects] = useState<Project[]>([]);

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search value (300ms)
  const debouncedSearch = useDebouncedValue(search, 300);

  // Track the current fetch to avoid races
  const fetchIdRef = useRef(0);

  // -------------------------------------------
  // Fetch projects for filter dropdown (once)
  // -------------------------------------------
  useEffect(() => {
    async function loadProjects() {
      const res = await apiFetch<ProjectsResponse>("/api/projects?limit=100");
      if (res.data) {
        setProjects(res.data.data);
      }
    }
    loadProjects();
  }, []);

  // -------------------------------------------
  // Build query string from current filters
  // -------------------------------------------
  const buildQueryString = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (projectFilter !== "all") params.set("projectId", projectFilter);
      params.set("sort", sortBy);
      params.set("order", sortOrder);
      params.set("limit", String(PAGE_SIZE));
      if (cursor) params.set("cursor", cursor);
      return params.toString();
    },
    [debouncedSearch, statusFilter, projectFilter, sortBy, sortOrder],
  );

  // -------------------------------------------
  // Fetch tasks (initial + filter changes)
  // -------------------------------------------
  const fetchTasks = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    const qs = buildQueryString();
    const res = await apiFetch<TasksResponse>(`/api/tasks?${qs}`);

    // Ignore stale responses
    if (id !== fetchIdRef.current) return;

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
      return;
    }

    if (res.data) {
      setTasks(res.data.data);
      setTotalCount(res.data.totalCount);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }

    setIsLoading(false);
  }, [buildQueryString]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // -------------------------------------------
  // Load more (cursor pagination)
  // -------------------------------------------
  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    const qs = buildQueryString(nextCursor);
    const res = await apiFetch<TasksResponse>(`/api/tasks?${qs}`);

    if (res.data) {
      setTasks((prev) => [...prev, ...res.data!.data]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }

    setIsLoadingMore(false);
  };

  // -------------------------------------------
  // Clear all filters helper
  // -------------------------------------------
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProjectFilter("all");
  };

  // -------------------------------------------
  // Render
  // -------------------------------------------
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? "Loading tasks\u2026" : `${totalCount} task${totalCount !== 1 ? "s" : ""} across all projects`}
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Failed to load tasks</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchTasks}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1 flex-wrap mb-6">
        {statusFilterOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              statusFilter === status
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "All" : statusLabels[status] || status}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      ) : !error && tasks.length === 0 ? (
        totalCount === 0 && !debouncedSearch && statusFilter === "all" && projectFilter === "all" ? (
          <EmptyState
            icon="tasks"
            headline="No tasks yet"
            description="Create your first task inside a project to start tracking work."
            ctaLabel="View Projects"
            ctaHref="/projects"
          />
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No tasks match your filters</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-primary-500 hover:text-primary-700"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <>
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}`}
                  className="block bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-medium">{task.project.name}</span>
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}
                          >
                            <Calendar size={11} />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {formatDuration(task.totalMinutes)}
                        </span>
                        {task.commentCount > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare size={11} />
                            {task.commentCount}
                          </span>
                        )}
                        {task.subtasks.length > 0 && (
                          <span>
                            {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length}{" "}
                            subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
