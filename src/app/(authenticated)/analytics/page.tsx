"use client";

import { useState, useEffect, useCallback } from "react";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

type TimeRange = "6m" | "3m" | "1y";

interface AnalyticsData {
  hasData: boolean;
  summary: {
    totalRevenue: number;
    avgMonthlyRevenue: number;
    hoursThisMonth: number;
    billableHoursThisMonth: number;
    activeClients: number;
  };
  revenueByMonth: { month: string; revenue: number; hours: number }[];
  revenueByClient: { name: string; value: number; color: string }[];
  weeklyHours: { day: string; hours: number }[];
  projectBudgets: {
    name: string;
    budget: number;
    used: number;
    percentage: number;
  }[];
  topProjects: {
    id: string;
    name: string;
    clientName: string;
    totalHours: number;
    revenue: number;
    completedTasks: number;
    totalTasks: number;
    budgetHours: number | null;
    deadline: string | null;
  }[];
  overdueTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    projectName: string;
    projectId: string;
  }[];
}

const RANGE_LABELS: Record<TimeRange, string> = {
  "6m": "Last 6 months",
  "3m": "Last 3 months",
  "1y": "This year",
};

export default function AnalyticsPage() {
  usePageTitle("Analytics");
  const [range, setRange] = useState<TimeRange>("6m");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    const { data: result, error: err } = await apiFetch<AnalyticsData>(
      `/api/analytics?range=${r}`
    );
    if (result) {
      setData(result);
    } else {
      setError(err || "Failed to load analytics.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  function handleRangeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRange(e.target.value as TimeRange);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={handleRangeChange}
            className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          >
            {Object.entries(RANGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      ) : !data?.hasData ? (
        <EmptyState
          icon="time"
          headline="No data to show yet"
          description="Start tracking time and sending invoices to see your analytics here."
          ctaLabel="Go to Dashboard"
          ctaHref="/dashboard"
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <DollarSign size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">
                ${data.summary.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp size={14} /> {RANGE_LABELS[range]}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Avg Monthly Revenue</p>
                <TrendingUp size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">
                ${data.summary.avgMonthlyRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Per active month</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Hours This Month</p>
                <Clock size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">
                {data.summary.hoursThisMonth}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.summary.billableHoursThisMonth}h billable
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Active Clients</p>
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">
                {data.summary.activeClients}
              </p>
              <p className="text-sm text-gray-500 mt-1">Non-archived</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Over Time */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue Over Time
              </h3>
              {data.revenueByMonth.some((m) => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">
                  No revenue data for this period
                </div>
              )}
            </div>

            {/* Revenue by Client */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue by Client
              </h3>
              {data.revenueByClient.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.revenueByClient}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        label={false}
                      >
                        {data.revenueByClient.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `$${Number(value).toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          fontSize: "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {data.revenueByClient.map((client) => (
                      <div
                        key={client.name}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: client.color }}
                        />
                        {client.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">
                  No client revenue for this period
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hours by Day of Week */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Hours by Day (This Week)
              </h3>
              {data.weeklyHours.some((d) => d.hours > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.weeklyHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value)}h`, "Hours"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#22C55E"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-sm text-gray-400">
                  No hours tracked this week
                </div>
              )}
            </div>

            {/* Project Budget Utilization */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Project Budget Utilization
              </h3>
              {data.projectBudgets.length > 0 ? (
                <div className="space-y-4">
                  {data.projectBudgets.map((project) => (
                    <div key={project.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">
                          {project.name}
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          {project.used}/{project.budget}h ({project.percentage}
                          %)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.percentage >= 100
                              ? "bg-red-500"
                              : project.percentage >= 80
                                ? "bg-amber-500"
                                : "bg-primary-500"
                          }`}
                          style={{
                            width: `${Math.min(project.percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-sm text-gray-400">
                  No active projects with budgets
                </div>
              )}
            </div>
          </div>

          {/* Hours & Revenue Trend */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Hours & Revenue Trend
            </h3>
            {data.revenueByMonth.some(
              (m) => m.revenue > 0 || m.hours > 0
            ) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="hours"
                    stroke="#22C55E"
                    strokeWidth={2}
                    name="Hours"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
                No trend data for this period
              </div>
            )}
          </div>

          {/* Top Projects Table */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen size={20} className="text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800">
                Top Projects
              </h3>
            </div>
            {data.topProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium text-right">Hours</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                      <th className="pb-3 font-medium text-right">Tasks</th>
                      <th className="pb-3 font-medium text-right">Budget</th>
                      <th className="pb-3 font-medium text-right">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 font-medium text-gray-900">
                          {project.name}
                        </td>
                        <td className="py-3 text-gray-600">
                          {project.clientName}
                        </td>
                        <td className="py-3 text-right font-mono text-gray-700">
                          {project.totalHours}h
                        </td>
                        <td className="py-3 text-right font-mono text-gray-700">
                          ${project.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {project.completedTasks}/{project.totalTasks}
                        </td>
                        <td className="py-3 text-right font-mono text-gray-600">
                          {project.budgetHours
                            ? `${project.budgetHours}h`
                            : "—"}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[120px] text-sm text-gray-400">
                No active projects
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Overdue Tasks
              </h3>
              {data.overdueTasks.length > 0 && (
                <span className="ml-auto text-xs font-medium bg-red-100 text-red-700 rounded-full px-2.5 py-0.5">
                  {data.overdueTasks.length} overdue
                </span>
              )}
            </div>
            {data.overdueTasks.length > 0 ? (
              <div className="space-y-2">
                {data.overdueTasks.map((task) => {
                  const daysOverdue = Math.floor(
                    (Date.now() - new Date(task.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {task.projectName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            task.priority === "urgent"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                          {daysOverdue}d overdue
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[120px] text-sm text-gray-400">
                No overdue tasks — you&apos;re on track!
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
