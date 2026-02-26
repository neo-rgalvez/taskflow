"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Clock, Play } from "lucide-react";
import { timeEntries, projects } from "@/lib/mock-data";
import { formatDate, formatHoursDecimal } from "@/lib/format";

export default function TimePage() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState<"all" | "billable" | "non-billable">("all");

  const filtered = timeEntries.filter((te) => {
    const matchesProject = projectFilter === "all" || te.projectId === projectFilter;
    const matchesBillable =
      billableFilter === "all" ||
      (billableFilter === "billable" && te.billable) ||
      (billableFilter === "non-billable" && !te.billable);
    return matchesProject && matchesBillable;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof timeEntries>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const totalHours = filtered.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = filtered.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalHours.toFixed(1)}h total &middot; {billableHours.toFixed(1)}h billable
          </p>
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
            <Play size={16} /> Start Timer
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            <Plus size={16} /> Manual Entry
          </button>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="time"
          headline="No time entries yet"
          description="Start a timer or add a manual entry to begin tracking your work hours."
          ctaLabel="Start Timer"
        />
      ) : (
        <>
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

          {/* Time Entries grouped by date */}
          {showSkeleton ? (
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
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, entries]) => {
                  const dayTotal = entries.reduce((sum, e) => sum + e.hours, 0);
                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">{formatDate(date)}</h3>
                        <span className="text-sm font-mono text-gray-500">{formatHoursDecimal(dayTotal)}</span>
                      </div>
                      <div className="space-y-2">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-1 self-stretch rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium text-gray-800">{entry.taskTitle}</p>
                                  {!entry.billable && (
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                      Non-billable
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {entry.projectName} &middot; {entry.clientName}
                                </p>
                                {entry.description && (
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{entry.description}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold font-mono text-gray-800 flex items-center gap-1">
                                  <Clock size={13} className="text-gray-400" />
                                  {formatHoursDecimal(entry.hours)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </>
  );
}
