"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, SlidersHorizontal, Calendar, Clock, Paperclip } from "lucide-react";
import { tasks, projects, statusLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

const sortOptions = ["Due Date", "Priority", "Status", "Project"];
const statusFilterOptions = ["all", "todo", "in_progress", "waiting_on_client", "review", "done"];

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [sortBy, setSortBy] = useState("Due Date");

  const filtered = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesProject = projectFilter === "all" || t.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "Due Date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "Priority") {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }
    return 0;
  });

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks across all projects</p>
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
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="tasks"
          headline="No tasks yet"
          description="Create your first task inside a project to start tracking work."
          ctaLabel="View Projects"
        />
      ) : (
        <>
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
                <option key={p.id} value={p.id}>{p.name}</option>
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
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
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
                {status === "all" ? "All" : statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Task List */}
          {showSkeleton ? (
            <div className="space-y-3">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No tasks match your filters</p>
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); setProjectFilter("all"); }}
                className="mt-2 text-sm text-primary-500 hover:text-primary-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{task.title}</p>
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span style={{ color: project?.color }} className="font-medium">
                            {project?.name}
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
                              <Calendar size={11} />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={11} />
                            {task.timeLogged}
                          </span>
                          {task.attachments > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip size={11} />
                              {task.attachments}
                            </span>
                          )}
                          {task.subtasks.length > 0 && (
                            <span>
                              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
