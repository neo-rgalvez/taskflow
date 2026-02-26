"use client";

import { useState } from "react";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp, DollarSign, Clock, Users } from "lucide-react";
import { analyticsData } from "@/lib/mock-data";
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

export default function AnalyticsPage() {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const totalRevenue = analyticsData.revenueByClient.reduce((sum, c) => sum + c.value, 0);
  const avgMonthlyRevenue = Math.round(analyticsData.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) / analyticsData.revenueByMonth.length);
  const totalHoursThisMonth = analyticsData.revenueByMonth[analyticsData.revenueByMonth.length - 1].hours;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your business performance</p>
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
          <select className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
            <option>Last 6 months</option>
            <option>Last 3 months</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="time"
          headline="No data to show yet"
          description="Start tracking time and sending invoices to see your analytics here."
          ctaLabel="Go to Dashboard"
          ctaHref="/dashboard"
        />
      ) : showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <DollarSign size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">${totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp size={14} /> All time
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Avg Monthly Revenue</p>
                <TrendingUp size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">${avgMonthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+8% vs prior period</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Hours This Month</p>
                <Clock size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">{totalHoursThisMonth}h</p>
              <p className="text-sm text-gray-500 mt-1">28h billable</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[140px]">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Active Clients</p>
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono mt-2">4</p>
              <p className="text-sm text-green-600 mt-1">+1 this month</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Over Time */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analyticsData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                  />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Client */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Client</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={analyticsData.revenueByClient}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="value"
                    label={false}
                  >
                    {analyticsData.revenueByClient.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {analyticsData.revenueByClient.map((client) => (
                  <div key={client.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: client.color }} />
                    {client.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hours by Day of Week */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours by Day (This Week)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analyticsData.weeklyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    formatter={(value) => [`${Number(value)}h`, "Hours"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                  />
                  <Bar dataKey="hours" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Project Budget Utilization */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Budget Utilization</h3>
              <div className="space-y-4">
                {analyticsData.projectBudgets.map((project) => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{project.name}</span>
                      <span className="text-xs font-mono text-gray-500">
                        {project.used}/{project.budget}h ({project.percentage}%)
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
                        style={{ width: `${Math.min(project.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hours & Revenue Trend */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours & Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `${v}h`} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#22C55E" strokeWidth={2} name="Hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}
