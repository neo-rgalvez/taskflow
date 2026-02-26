"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCardSkeleton, ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import {
  Users,
  FolderKanban,
  Clock,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react";
import { dashboardStats, recentActivity } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/format";
import Link from "next/link";

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  totalProjects: number;
}

interface ProjectClient {
  id: string;
  name: string;
}

interface DashboardProject {
  id: string;
  name: string;
  status: string;
  client: ProjectClient;
  deadline: string | null;
  budgetHours: string | null;
  billingType: string;
  hourlyRate: string | null;
  fixedPrice: string | null;
  color: string;
}

interface ProjectListResponse {
  data: DashboardProject[];
  totalCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeProjectsList, setActiveProjectsList] = useState<DashboardProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      const result = await apiFetch<DashboardStats>("/api/dashboard/stats");
      if (result.data) {
        setStats(result.data);
      }
      setStatsLoading(false);
    }

    async function fetchActiveProjects() {
      setProjectsLoading(true);
      const result = await apiFetch<ProjectListResponse>(
        "/api/projects?status=active&limit=5"
      );
      if (result.data) {
        setActiveProjectsList(result.data.data);
      }
      setProjectsLoading(false);
    }

    fetchStats();
    fetchActiveProjects();
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
      </div>

      {isEmpty ? (
        <EmptyState
          icon="projects"
          headline="Welcome to TaskFlow"
          description="Add your first client to get started. You'll be tracking time and sending invoices in no time."
          ctaLabel="+ Add Your First Client"
          ctaHref="/clients"
        />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsLoading ? (
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
                  <p className="text-sm text-gray-500 mt-1">{stats?.totalProjects ?? 0} total</p>
                </Link>

                <Link href="/time" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Hours This Week</p>
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.hoursThisWeek}<span className="text-lg">h</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">{dashboardStats.billableHours}h billable</span>
                    {" / "}
                    <span>{(dashboardStats.hoursThisWeek - dashboardStats.billableHours).toFixed(1)}h non-billable</span>
                  </p>
                </Link>

                <Link href="/invoices" className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Outstanding Invoices</p>
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-mono mt-2">{dashboardStats.outstandingInvoices}</p>
                  <p className="text-sm text-red-600 mt-1">{dashboardStats.invoiceTrend}</p>
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
                  {projectsLoading ? (
                    <div className="p-4 space-y-3">
                      <ProjectCardSkeleton />
                    </div>
                  ) : activeProjectsList.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-gray-500">No active projects yet.</p>
                      <Link
                        href="/projects"
                        className="mt-2 inline-block text-sm text-primary-500 hover:text-primary-700"
                      >
                        Create your first project
                      </Link>
                    </div>
                  ) : (
                    activeProjectsList.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                            <StatusBadge status={project.status} />
                          </div>
                          <p className="text-xs text-gray-500">{project.client.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {project.deadline && (
                            <p className="text-xs text-gray-500">Due {formatDate(project.deadline)}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {project.billingType === "hourly" && project.hourlyRate
                              ? formatCurrency(parseFloat(project.hourlyRate)) + "/hr"
                              : project.fixedPrice
                                ? formatCurrency(parseFloat(project.fixedPrice))
                                : "—"}
                          </p>
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
    </>
  );
}
