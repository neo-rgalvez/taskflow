"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { KanbanColumnSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Plus,
  Clock,
  CheckSquare,
  CalendarDays,
  X,
  MessageSquare,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/format";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface TimeEntryItem {
  id: string;
  description: string | null;
  durationMinutes: number;
  startTime: string;
  isBillable: boolean;
}

interface TaskData {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
  totalMinutes: number;
  commentCount: number;
  timeEntryCount: number;
  // Only on detail fetch:
  comments?: Comment[];
  timeEntries?: TimeEntryItem[];
  project?: { id: string; name: string; hourlyRate: string | null; billingType: string };
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  billingType: string;
  hourlyRate: string | null;
  budgetHours: number | null;
  deadline: string | null;
  client: { id: string; name: string };
}

const columns: { key: string; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "bg-gray-400" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { key: "waiting_on_client", label: "Waiting on Client", color: "bg-amber-500" },
  { key: "review", label: "Review", color: "bg-violet-500" },
  { key: "done", label: "Done", color: "bg-green-500" },
];

const priorityBorderColor: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-gray-400",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ProjectDetailContent({ id }: { id: string }) {
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [inlineCreating, setInlineCreating] = useState<string | null>(null); // column key

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchProject = useCallback(async () => {
    const res = await apiFetch<ProjectData>(`/api/projects/${id}`);
    if (res.data) setProject(res.data);
  }, [id]);

  const fetchTasks = useCallback(async () => {
    const res = await apiFetch<{ data: TaskData[]; totalCount: number }>(
      `/api/projects/${id}/tasks`
    );
    if (res.data) {
      setTasks(res.data.data);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchTasks()]);
      setLoading(false);
    };
    load();
  }, [fetchProject, fetchTasks]);

  // Revalidate on tab focus
  useEffect(() => {
    const onFocus = () => {
      fetchTasks();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchTasks]);

  // ─── Task Mutations ─────────────────────────────────────────────────────────

  const updateTaskInList = useCallback((taskId: string, updates: Partial<TaskData>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      const oldStatus = task.status;
      // Optimistic
      updateTaskInList(taskId, { status: newStatus });

      const res = await apiFetch(`/api/tasks/${taskId}/position`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          position: task.position,
          updatedAt: task.updatedAt,
        }),
      });

      if (res.error) {
        // Revert
        updateTaskInList(taskId, { status: oldStatus });
        if (res.status === 409) {
          toast("warning", "Task was modified. Refreshing...");
          fetchTasks();
        } else {
          toast("error", res.error);
        }
      } else {
        // Refresh to get latest updatedAt
        fetchTasks();
      }
    },
    [tasks, updateTaskInList, fetchTasks, toast]
  );

  // ─── Computed ───────────────────────────────────────────────────────────────

  const tasksByColumn = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.key)
      .sort((a, b) => a.position - b.position),
  }));

  const totalTrackedMinutes = tasks.reduce((sum, t) => sum + t.totalMinutes, 0);

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="projects"
        headline="Project not found"
        description="This project doesn't exist or you don't have access to it."
        ctaLabel="Back to Projects"
        ctaHref="/projects"
      />
    );
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/projects" className="hover:text-primary-500">Projects</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/clients/${project.client.id}`} className="hover:text-primary-500">
          {project.client.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <button
          onClick={() => setInlineCreating("todo")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Project Overview Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-500">Client:</span>
          <span className="ml-2 font-medium text-gray-700">{project.client.name}</span>
        </div>
        {project.hourlyRate && (
          <div>
            <span className="text-gray-500">Billing:</span>
            <span className="ml-2 font-medium text-gray-700 font-mono">
              ${Number(project.hourlyRate).toFixed(2)}/hr
            </span>
          </div>
        )}
        {project.budgetHours && (
          <div>
            <span className="text-gray-500">Budget:</span>
            <span className="ml-2 font-medium text-gray-700 font-mono">
              {formatDuration(totalTrackedMinutes)}/{project.budgetHours}h
            </span>
          </div>
        )}
        {project.deadline && (
          <div>
            <span className="text-gray-500">Deadline:</span>
            <span className="ml-2 font-medium text-gray-700">
              {formatDate(project.deadline.split("T")[0])}
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Tasks:</span>
          <span className="ml-2 font-medium text-gray-700">{tasks.length}</span>
        </div>
      </div>

      {tasks.length === 0 && !inlineCreating ? (
        <EmptyState
          icon="tasks"
          headline="No tasks in this project"
          description="Break your work into tasks so nothing falls through the cracks."
          ctaLabel="+ Add Task"
          onCta={() => setInlineCreating("todo")}
        />
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tasksByColumn.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              isCreating={inlineCreating === column.key}
              onStartCreate={() => setInlineCreating(column.key)}
              onCancelCreate={() => setInlineCreating(null)}
              onTaskCreated={(task) => {
                setTasks((prev) => [...prev, task]);
                setInlineCreating(null);
              }}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              onStatusChange={handleStatusChange}
              projectId={id}
            />
          ))}
        </div>
      )}

      {/* Task Detail Slide-Over */}
      {selectedTaskId && (
        <TaskDetailSlideOver
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            updateTaskInList(updated.id, updated);
          }}
          onTaskDeleted={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setSelectedTaskId(null);
          }}
        />
      )}
    </>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: { key: string; label: string; color: string; tasks: TaskData[] };
  isCreating: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onTaskCreated: (task: TaskData) => void;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  projectId: string;
}

function KanbanColumn({
  column,
  isCreating,
  onStartCreate,
  onCancelCreate,
  onTaskCreated,
  onTaskClick,
  onStatusChange,
  projectId,
}: KanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 min-w-[280px] sm:min-w-[300px] flex-1">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
          <h3 className="text-sm font-semibold text-gray-700">{column.label}</h3>
          <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={onStartCreate}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
          aria-label={`Add task to ${column.label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task Cards */}
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {/* Inline Create */}
      {isCreating && (
        <InlineTaskCreate
          projectId={projectId}
          status={column.key}
          onCreated={onTaskCreated}
          onCancel={onCancelCreate}
        />
      )}
    </div>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
  onStatusChange,
}: {
  task: TaskData;
  onClick: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}) {
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`w-full text-left bg-white rounded-lg border border-gray-200 p-3 border-l-[3px] ${
        priorityBorderColor[task.priority] || "border-l-gray-400"
      } hover:shadow-md hover:border-gray-300 transition-all cursor-pointer`}
    >
      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
        {task.title}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
        {task.subtasks.length > 0 && (
          <span className="flex items-center gap-1">
            <CheckSquare size={12} />
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {task.commentCount}
          </span>
        )}
        {task.totalMinutes > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(task.totalMinutes)}
          </span>
        )}
      </div>

      {/* Due date and Priority */}
      <div className="flex items-center justify-between">
        {task.dueDate ? (
          <span
            className={`text-xs flex items-center gap-1 ${
              new Date(task.dueDate) < new Date()
                ? "text-red-500 font-medium"
                : "text-gray-400"
            }`}
          >
            <CalendarDays size={12} />
            {formatDate(task.dueDate.split("T")[0])}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {/* Quick status change on mobile */}
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="sm:hidden text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
            aria-label="Change status"
          >
            {columns.map((col) => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Task Create ─────────────────────────────────────────────────────────

function InlineTaskCreate({
  projectId,
  status,
  onCreated,
  onCancel,
}: {
  projectId: string;
  status: string;
  onCreated: (task: TaskData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (saving) return;

    setSaving(true);
    const res = await apiFetch<TaskData>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title: trimmed, status }),
    });

    if (res.data) {
      onCreated(res.data);
      toast("success", "Task created");
    } else {
      toast("error", res.error || "Failed to create task");
    }
    setSaving(false);
  };

  return (
    <div className="mt-2 bg-white rounded-lg border border-primary-300 p-3 shadow-sm">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task title..."
        className="w-full text-sm border-none outline-none placeholder-gray-400"
        disabled={saving}
        maxLength={500}
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || saving}
          className="px-3 py-1 text-xs font-medium text-white bg-primary-500 rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Task Detail Slide-Over ─────────────────────────────────────────────────────

function TaskDetailSlideOver({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: {
  taskId: string;
  projectId?: string;
  onClose: () => void;
  onTaskUpdated: (task: Partial<TaskData> & { id: string }) => void;
  onTaskDeleted: (taskId: string) => void;
}) {
  const { toast } = useToast();
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Auto-save debounce refs
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTaskRef = useRef<TaskData | null>(null);

  const fetchTaskDetail = useCallback(async () => {
    const res = await apiFetch<TaskData>(`/api/tasks/${taskId}`);
    if (res.data) {
      setTask(res.data);
      latestTaskRef.current = res.data;
    } else if (res.status === 404) {
      toast("error", "Task not found");
      onClose();
    }
    setLoading(false);
  }, [taskId, toast, onClose]);

  useEffect(() => {
    fetchTaskDetail();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [fetchTaskDetail]);

  // ─── Auto-save helper ──────────────────────────────────────────────────────

  const autoSave = useCallback(
    (field: string, value: unknown) => {
      if (!task) return;

      // Clear pending save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        const body: Record<string, unknown> = {
          [field]: value,
          updatedAt: latestTaskRef.current?.updatedAt || task.updatedAt,
        };

        const res = await apiFetch<TaskData>(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        if (res.data) {
          latestTaskRef.current = { ...latestTaskRef.current!, ...res.data };
          setTask((prev) => prev ? { ...prev, ...res.data, comments: prev.comments, timeEntries: prev.timeEntries } : prev);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _taskId, ...rest } = res.data;
          onTaskUpdated({ id: task.id, ...rest });
        } else if (res.status === 409) {
          toast("warning", "Task was modified. Refreshing...");
          fetchTaskDetail();
        } else {
          toast("error", res.error || "Failed to save");
        }
      }, 600);
    },
    [task, onTaskUpdated, fetchTaskDetail, toast]
  );

  // ─── Field Handlers ────────────────────────────────────────────────────────

  const handleFieldChange = (field: string, value: unknown) => {
    if (!task) return;
    setTask((prev) => prev ? { ...prev, [field]: value } : prev);

    // For date fields, convert to ISO
    if (field === "dueDate") {
      const dateValue = value ? new Date(value as string).toISOString() : null;
      autoSave(field, dateValue);
    } else {
      autoSave(field, value);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!task || deleting) return;
    if (!window.confirm("Delete this task? This cannot be undone.")) return;

    setDeleting(true);
    const res = await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.error) {
      toast("error", res.error);
      setDeleting(false);
    } else {
      toast("success", "Task deleted");
      onTaskDeleted(task.id);
    }
  };

  // ─── Subtask Handlers ──────────────────────────────────────────────────────

  const toggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!task) return;
    // Optimistic
    setTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, isCompleted } : s
        ),
      };
    });

    const res = await apiFetch(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify({ isCompleted }),
    });

    if (res.error) {
      // Revert
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, isCompleted: !isCompleted } : s
          ),
        };
      });
      toast("error", "Failed to update subtask");
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    const prev = task.subtasks;
    setTask((t) => t ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t);

    const res = await apiFetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
    if (res.error) {
      setTask((t) => t ? { ...t, subtasks: prev } : t);
      toast("error", "Failed to delete subtask");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md sm:max-w-lg shadow-xl animate-slide-in-right flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">Task Detail</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Title (editable) */}
              <div>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="text-xl font-semibold text-gray-900 w-full border-none outline-none bg-transparent hover:bg-gray-50 focus:bg-gray-50 rounded px-1 -mx-1 transition-colors"
                  maxLength={500}
                />
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>

              {/* Description (editable) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  value={task.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value || null)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full text-sm text-gray-600 leading-relaxed border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                  maxLength={10000}
                />
              </div>

              {/* Meta fields (editable) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  >
                    {columns.map((col) => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  >
                    {(["urgent", "high", "medium", "low"] as const).map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                    onChange={(e) => handleFieldChange("dueDate", e.target.value || null)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Time Logged</label>
                  <p className="h-9 flex items-center text-sm font-mono text-gray-700">
                    {formatDuration(task.totalMinutes)}
                  </p>
                </div>
              </div>

              {/* Subtasks */}
              <SubtaskSection
                taskId={task.id}
                subtasks={task.subtasks}
                onToggle={toggleSubtask}
                onDelete={deleteSubtask}
                onSubtaskAdded={(subtask) => {
                  setTask((prev) =>
                    prev ? { ...prev, subtasks: [...prev.subtasks, subtask] } : prev
                  );
                }}
              />

              {/* Time Entry Logging */}
              <TimeEntrySection
                taskId={task.id}
                timeEntries={task.timeEntries || []}
                totalMinutes={task.totalMinutes}
                onEntryAdded={(entry) => {
                  setTask((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      timeEntries: [entry, ...(prev.timeEntries || [])],
                      totalMinutes: prev.totalMinutes + entry.durationMinutes,
                    };
                  });
                  onTaskUpdated({ id: task.id, totalMinutes: task.totalMinutes + entry.durationMinutes });
                }}
              />

              {/* Comments */}
              <CommentSection
                taskId={task.id}
                comments={task.comments || []}
                onCommentAdded={(comment) => {
                  setTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          comments: [...(prev.comments || []), comment],
                          commentCount: (prev.commentCount || 0) + 1,
                        }
                      : prev
                  );
                  onTaskUpdated({ id: task.id, commentCount: (task.commentCount || 0) + 1 });
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="text-xs text-gray-400">
                Changes saved automatically
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Subtask Section ────────────────────────────────────────────────────────────

function SubtaskSection({
  taskId,
  subtasks,
  onToggle,
  onDelete,
  onSubtaskAdded,
}: {
  taskId: string;
  subtasks: Subtask[];
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onSubtaskAdded: (subtask: Subtask) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    const res = await apiFetch<Subtask>(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title: trimmed }),
    });

    if (res.data) {
      onSubtaskAdded(res.data);
      setNewTitle("");
    } else {
      toast("error", res.error || "Failed to add subtask");
    }
    setAdding(false);
  };

  const completedCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Subtasks {subtasks.length > 0 && `(${completedCount}/${subtasks.length})`}
      </label>
      {subtasks.length > 0 && (
        <div className="space-y-1 mb-2 max-h-60 overflow-y-auto">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 group">
              <input
                type="checkbox"
                checked={subtask.isCompleted}
                onChange={() => onToggle(subtask.id, !subtask.isCompleted)}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200 cursor-pointer"
              />
              <span
                className={`text-sm flex-1 ${
                  subtask.isCompleted ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                title="Delete subtask"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add subtask..."
          className="flex-1 h-8 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          maxLength={500}
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || adding}
          className="h-8 px-3 text-sm text-primary-500 hover:text-primary-700 disabled:opacity-50 flex items-center gap-1"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Time Entry Section ─────────────────────────────────────────────────────────

function TimeEntrySection({
  taskId,
  timeEntries,
  totalMinutes,
  onEntryAdded,
}: {
  taskId: string;
  timeEntries: TimeEntryItem[];
  totalMinutes: number;
  onEntryAdded: (entry: TimeEntryItem) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleLog = async () => {
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const total = h * 60 + m;

    if (total < 1 || total > 1440) {
      toast("error", "Duration must be between 1 minute and 24 hours.");
      return;
    }

    if (saving) return;
    setSaving(true);

    const res = await apiFetch<TimeEntryItem>(`/api/tasks/${taskId}/time-entries`, {
      method: "POST",
      body: JSON.stringify({
        durationMinutes: total,
        description: description.trim() || undefined,
        isBillable: billable,
      }),
    });

    if (res.data) {
      onEntryAdded(res.data);
      setHours("");
      setMinutes("");
      setDescription("");
      setShowForm(false);
      toast("success", "Time logged");
    } else {
      toast("error", res.error || "Failed to log time");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Time Entries
          {totalMinutes > 0 && (
            <span className="text-gray-400 font-normal ml-2">
              ({formatDuration(totalMinutes)} total)
            </span>
          )}
        </label>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1"
        >
          <Clock size={14} /> Log Time
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                min="0"
                max="24"
                className="w-14 h-8 px-2 border border-gray-300 rounded-md text-sm font-mono text-center focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
              />
              <span className="text-xs text-gray-500">h</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                max="59"
                className="w-14 h-8 px-2 border border-gray-300 rounded-md text-sm font-mono text-center focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
              />
              <span className="text-xs text-gray-500">m</span>
            </div>
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
              />
              <span className="text-xs text-gray-500">Billable</span>
            </label>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full h-8 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleLog}
              disabled={saving || (!hours && !minutes)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-500 rounded hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Log Time
            </button>
          </div>
        </div>
      )}

      {timeEntries.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 p-2 text-sm border border-gray-100 rounded-md">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate">
                  {entry.description || "No description"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(entry.startTime.split("T")[0])}
                  {entry.isBillable && " · Billable"}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-600 flex-shrink-0">
                {formatDuration(entry.durationMinutes)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-gray-400">No time logged yet</p>
        )
      )}
    </div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────────

function CommentSection({
  taskId,
  comments,
  onCommentAdded,
}: {
  taskId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    const res = await apiFetch<Comment>(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: trimmed }),
    });

    if (res.data) {
      onCommentAdded(res.data);
      setContent("");
    } else {
      toast("error", res.error || "Failed to add comment");
    }
    setSaving(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr.split("T")[0]);
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Comments {comments.length > 0 && `(${comments.length})`}
      </label>

      {comments.length > 0 && (
        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary-700">
                    {getInitials(comment.user.name)}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-700">{comment.user.name}</span>
                <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
          placeholder="Add a comment..."
          className="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          maxLength={5000}
        />
        <button
          onClick={handlePost}
          disabled={!content.trim() || saving}
          className="h-9 px-3 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
