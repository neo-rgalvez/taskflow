"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import {
  Users,
  FolderKanban,
  Clock,
  CalendarDays,
  ArrowRight,
  Activity,
  Building,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import Link from "next/link";

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  hoursThisWeek: number;
  billableHours: number;
  totalTasks: number;
  upcomingDeadlines: number;
}

interface DashboardProject {
  id: string;
  name: string;
  status: string;
  budgetHours: number | null;
  deadline: string | null;
  client: { id: string; name: string };
  _count?: { tasks: number };
}

interface ProjectListResponse {
  data: DashboardProject[];
  totalCount: number;
}

interface RecentTaskActivity {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  project: { id: string; name: string; client: { id: string; name: string } } | null;
}

export default function DashboardPage() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeProjectsList, setActiveProjectsList] = useState<DashboardProject[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTaskActivity[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      setStatsLoading(true);
      const [statsResult, projectsResult, recentResult] = await Promise.all([
        apiFetch<DashboardStats>("/api/dashboard/stats"),
        apiFetch<ProjectListResponse>("/api/projects?status=active&limit=5"),
        apiFetch<{ data: RecentTaskActivity[] }>("/api/tasks?limit=5&sort=createdAt&order=desc"),
      ]);
      if (statsResult.data) {
        setStats(statsResult.data);
      }
      if (projectsResult.data) {
        setActiveProjectsList(projectsResult.data.data);
      }
      if (recentResult.data) {
        setRecentTasks(recentResult.data.data);
      }
      setStatsLoading(false);
    }
    fetchDashboard();
  }, []);

  // Show empty state if no clients
  const isEmpty = !statsLoading && stats && stats.totalClients === 0;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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

      {showEmpty || isEmpty ? (
        <div className="space-y-6">
          <EmptyState
            icon="projects"
            headline="Welcome to TaskFlow"
            description="Add your first client to get started. You'll be tracking time and sending invoices in no time."
            ctaLabel="+ Add Your First Client"
            ctaHref="/clients"
          />
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center gap-3">
            <Building size={20} className="text-primary-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-800">Set up your business profile</p>
              <p className="text-xs text-primary-600 mt-0.5">Add your business details so they appear on invoices.</p>
            </div>
            <Link
              href="/settings?tab=business"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 whitespace-nowrap"
            >
              Set up →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {showSkeleton || statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Link href="/clients" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Total Clients</p>
                    <Users size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{stats?.totalClients ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Active clients</p>
                </Link>

                <Link href="/projects" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <FolderKanban size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{stats?.activeProjects ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">{stats?.totalTasks ?? 0} total tasks</p>
                </Link>

                <Link href="/time" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Hours This Week</p>
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{stats?.hoursThisWeek ?? 0}<span className="text-lg">h</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">{stats?.billableHours ?? 0}h billable</span>
                    {" / "}
                    <span>{((stats?.hoursThisWeek ?? 0) - (stats?.billableHours ?? 0)).toFixed(1)}h non-billable</span>
                  </p>
                </Link>

                <Link href="/calendar" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Upcoming Deadlines</p>
                    <CalendarDays size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{stats?.upcomingDeadlines ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Due in next 7 days</p>
                </Link>
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
                  {activeProjectsList.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500">
                      No active projects yet.{" "}
                      <Link href="/projects" className="text-primary-500 hover:text-primary-700">
                        Create one
                      </Link>
                    </div>
                  ) : (
                    activeProjectsList.map((project) => (
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
                          <p className="text-xs text-gray-500">{project.client.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {project.deadline && (
                            <p className="text-xs text-gray-500">Due {formatDate(project.deadline.split("T")[0])}</p>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
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
                  {recentTasks.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500">
                      No recent activity yet.
                    </div>
                  ) : (
                    recentTasks.map((task) => (
                      <div key={task.id} className="px-5 py-3">
                        <p className="text-sm text-gray-700">Task &ldquo;{task.title}&rdquo; updated</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {task.project?.name ?? "Unknown project"} · <StatusBadge status={task.status} />
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(task.updatedAt.split("T")[0])}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
