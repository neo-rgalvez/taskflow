"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { KanbanColumnSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Plus,
  Paperclip,
  Clock,
  CheckSquare,
  CalendarDays,
  X,
  Play,
  MessageSquare,
  Upload,
} from "lucide-react";
import { tasks, projects, type Task } from "@/lib/mock-data";
import Link from "next/link";

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

export default function ProjectDetailPage() {
  const project = projects[0]; // Patient Portal Redesign
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksByColumn = columns.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  return (
    <AppShell>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/projects" className="hover:text-primary-500">Projects</Link>
        <span className="text-gray-300">/</span>
        <Link href="/clients" className="hover:text-primary-500">{project.clientName}</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSkeleton(!showSkeleton); setShowEmpty(false); }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showSkeleton ? "Show Data" : "Skeleton"}
          </button>
          <button
            onClick={() => { setShowEmpty(!showEmpty); setShowSkeleton(false); }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showEmpty ? "Show Data" : "Empty"}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Project Overview Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-500">Client:</span>
          <span className="ml-2 font-medium text-gray-700">{project.clientName}</span>
        </div>
        <div>
          <span className="text-gray-500">Billing:</span>
          <span className="ml-2 font-medium text-gray-700 font-mono">${project.hourlyRate}/hr</span>
        </div>
        <div>
          <span className="text-gray-500">Budget:</span>
          <span className="ml-2 font-medium text-gray-700 font-mono">{project.hoursTracked}/{project.budgetHours}h</span>
        </div>
        <div>
          <span className="text-gray-500">Deadline:</span>
          <span className="ml-2 font-medium text-gray-700">{project.deadline}</span>
        </div>
        <div>
          <span className="text-gray-500">Tasks:</span>
          <span className="ml-2 font-medium text-gray-700">{project.taskCount}</span>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="tasks"
          headline="No tasks in this project"
          description="Break your work into tasks so nothing falls through the cracks."
          ctaLabel="+ Add Task"
        />
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {showSkeleton ? (
            <>
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
            </>
          ) : (
            tasksByColumn.map((column) => (
              <div key={column.key} className="bg-gray-50 rounded-lg p-3 min-w-[280px] sm:min-w-[300px] flex-1">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                    <h3 className="text-sm font-semibold text-gray-700">{column.label}</h3>
                    <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                      {column.tasks.length}
                    </span>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200">
                    <Plus size={14} />
                  </button>
                </div>

                {/* Task Cards */}
                <div className="space-y-2">
                  {column.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left bg-white rounded-lg border border-gray-200 p-3 border-l-[3px] ${
                        priorityBorderColor[task.priority]
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
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                          </span>
                        )}
                        {task.attachments > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip size={12} />
                            {task.attachments}
                          </span>
                        )}
                        {task.timeMinutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.timeLogged}
                          </span>
                        )}
                      </div>

                      {/* Due date and Priority */}
                      <div className="flex items-center justify-between">
                        {task.dueDate ? (
                          <span className={`text-xs flex items-center gap-1 ${
                            new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : "text-gray-400"
                          }`}>
                            <CalendarDays size={12} />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        ) : (
                          <span />
                        )}
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Task Slide-Over Panel */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTask(null)} />
          <div className="relative bg-white w-full max-w-md sm:max-w-lg shadow-xl animate-slide-in-right flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">Task Detail</h2>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Title & Status */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{selectedTask.title}</h3>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedTask.status} />
                  <PriorityBadge priority={selectedTask.priority} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status</label>
                  <select defaultValue={selectedTask.status} className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
                    {columns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Priority</label>
                  <select defaultValue={selectedTask.priority} className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
                    {["urgent", "high", "medium", "low"].map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Due Date</label>
                  <input
                    type="date"
                    defaultValue={selectedTask.dueDate || ""}
                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Time Logged</label>
                  <p className="h-9 flex items-center text-sm font-mono text-gray-700">{selectedTask.timeLogged}</p>
                </div>
              </div>

              {/* Subtasks */}
              {selectedTask.subtasks.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Subtasks ({selectedTask.subtasks.filter((s) => s.completed).length}/{selectedTask.subtasks.length})
                  </label>
                  <div className="space-y-2">
                    {selectedTask.subtasks.map((subtask) => (
                      <label key={subtask.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={subtask.completed}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                        />
                        <span className={`text-sm ${subtask.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                          {subtask.title}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button className="mt-2 text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1">
                    <Plus size={14} /> Add subtask
                  </button>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Attachments ({selectedTask.attachments})
                  </label>
                  <div className="space-y-2">
                    {[
                      { name: "wireframe-v2.fig", size: "4.2 MB" },
                      { name: "brand-colors.png", size: "1.1 MB" },
                      { name: "meeting-notes.pdf", size: "340 KB" },
                    ].slice(0, selectedTask.attachments).map((file) => (
                      <div key={file.name} className="flex items-center gap-3 p-2 border border-gray-200 rounded-md">
                        <Paperclip size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                        <span className="text-xs text-gray-400">{file.size}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1">
                    <Upload size={14} /> Upload file
                  </button>
                </div>
              )}

              {/* Notes / Comments */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary-700">SF</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">Sarah Fletcher</span>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-600">Client prefers the two-column layout for the dashboard. Let&apos;s go with option B from the mockups.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary-700">SF</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">Sarah Fletcher</span>
                      <span className="text-xs text-gray-400">Yesterday</span>
                    </div>
                    <p className="text-sm text-gray-600">Need to check WCAG contrast ratios on the navigation before finalizing colors.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    className="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  />
                  <button className="h-9 px-3 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                <Play size={14} /> Start Timer
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
