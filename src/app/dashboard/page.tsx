"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FolderKanban,
  Clock,
  FileText,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  Activity,
} from "lucide-react";
import { dashboardStats, recentActivity, projects } from "@/lib/mock-data";
import Link from "next/link";

export default function DashboardPage() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Good morning, Sarah</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening across your projects today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSkeleton(!showSkeleton); setShowEmpty(false); }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {showSkeleton ? "Show Data" : "Show Skeleton"}
          </button>
          <button
            onClick={() => { setShowEmpty(!showEmpty); setShowSkeleton(false); }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {showEmpty ? "Show Data" : "Show Empty"}
          </button>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="projects"
          headline="Welcome to TaskFlow"
          description="Add your first client to get started. You'll be tracking time and sending invoices in no time."
          ctaLabel="+ Add Your First Client"
        />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {showSkeleton ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Link href="/projects" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <FolderKanban size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.activeProjects}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={14} /> {dashboardStats.activeProjectsTrend}
                  </p>
                </Link>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Hours This Week</p>
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.hoursThisWeek}<span className="text-lg">h</span></p>
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={14} /> {dashboardStats.hoursTrend}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Outstanding Invoices</p>
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.outstandingInvoices}</p>
                  <p className="text-sm text-red-600 mt-1">{dashboardStats.invoiceTrend}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Upcoming Deadlines</p>
                    <CalendarDays size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.upcomingDeadlines}</p>
                  <p className="text-sm text-gray-500 mt-1 truncate">{dashboardStats.nextDeadline}</p>
                </div>
              </>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active Projects */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Active Projects</h2>
                  <Link href="/projects" className="text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {projects.filter((p) => p.status === "active").map((project) => {
                    const budgetPercent = project.budgetHours ? Math.round((project.hoursTracked / project.budgetHours) * 100) : 0;
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                            <StatusBadge status={project.status} />
                          </div>
                          <p className="text-xs text-gray-500">{project.clientName}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 max-w-[200px]">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    budgetPercent >= 100 ? "bg-red-500" : budgetPercent >= 80 ? "bg-amber-500" : "bg-primary-500"
                                  }`}
                                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">{budgetPercent}%</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">Due {project.deadline}</p>
                          <p className="text-xs text-gray-400 mt-1">{project.taskCount} tasks</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                  <Activity size={18} className="text-gray-400" />
                </div>
                <div className="divide-y divide-gray-100">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="px-5 py-3">
                      <p className="text-sm text-gray-700">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
