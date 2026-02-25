"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, CalendarDays } from "lucide-react";
import { projects, statusLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import Link from "next/link";

const filterOptions = ["all", "active", "on_hold", "completed", "cancelled"];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} total projects</p>
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
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="projects"
          headline="No projects yet"
          description="Create your first project to start tracking tasks, time, and budgets."
          ctaLabel="+ Create Project"
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {filterOptions.map((status) => (
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
          </div>

          {/* Project Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {showSkeleton ? (
              <>
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </>
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-gray-500">No projects match your filters</p>
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="mt-2 text-sm text-primary-500 hover:text-primary-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((project) => {
                const budgetPercent = project.budgetHours ? Math.round((project.hoursTracked / project.budgetHours) * 100) : 0;
                const isOverdue = new Date(project.deadline) < new Date();

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge status={project.status} />
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : "text-gray-500"}`}>
                        <CalendarDays size={12} />
                        {formatDate(project.deadline)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{project.clientName}</p>

                    {/* Budget Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Budget</span>
                        <span className="text-xs font-mono text-gray-500">{budgetPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            budgetPercent >= 100 ? "bg-red-500" : budgetPercent >= 80 ? "bg-amber-500" : "bg-primary-500"
                          }`}
                          style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {project.hoursTracked} / {project.budgetHours} hrs
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>{project.taskCount} tasks</span>
                      {project.overdueTaskCount > 0 && (
                        <span className="text-red-500">{project.overdueTaskCount} overdue</span>
                      )}
                      <span className="ml-auto font-mono">
                        {project.billingType === "hourly" ? `$${project.hourlyRate}/hr` : `$${project.fixedPrice?.toLocaleString()}`}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}
    </>
  );
}
