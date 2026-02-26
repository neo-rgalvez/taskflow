"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowLeft,
  Mail,
  Phone,
  FolderKanban,
  FileText,
  Activity,
  CalendarDays,
} from "lucide-react";
import { clients, projects, invoices, recentActivity } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/format";
import Link from "next/link";

type Tab = "projects" | "invoices" | "activity";

export default function ClientDetailContent({ id }: { id: string }) {
  const client = clients.find((c) => c.id === id) || clients[0];

  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [showSkeleton, setShowSkeleton] = useState(false);

  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const clientInvoices = invoices.filter((i) =>
    i.clientName === client.name
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "projects", label: "Projects", icon: FolderKanban, count: clientProjects.length },
    { key: "invoices", label: "Invoices", icon: FileText, count: clientInvoices.length },
    { key: "activity", label: "Activity", icon: Activity, count: recentActivity.length },
  ];

  return (
    <>
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      {/* Client Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: client.color }}
            >
              {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{client.contactName}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-primary-500">
                  <Mail size={13} /> {client.email}
                </a>
                <span className="flex items-center gap-1">
                  <Phone size={13} /> {client.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {showSkeleton ? "Show Data" : "Skeleton"}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
              Edit Client
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Active Projects</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">{client.activeProjects}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Default Rate</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">${client.defaultRate}/hr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">{client.outstandingInvoices}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">{client.totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary-500 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {showSkeleton ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 rounded mb-2" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Projects Tab */}
          {activeTab === "projects" && (
            <>
              {clientProjects.length === 0 ? (
                <EmptyState
                  icon="projects"
                  headline="No projects for this client"
                  description="Create a new project to start tracking work for this client."
                  ctaLabel="+ Create Project"
                />
              ) : (
                <div className="space-y-3">
                  {clientProjects.map((project) => {
                    const budgetPercent = project.budgetHours
                      ? Math.round((project.hoursTracked / project.budgetHours) * 100)
                      : 0;
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-800">{project.name}</h3>
                            <StatusBadge status={project.status} />
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(project.deadline)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span>{project.taskCount} tasks</span>
                          {project.overdueTaskCount > 0 && (
                            <span className="text-red-500">{project.overdueTaskCount} overdue</span>
                          )}
                          <span className="font-mono">
                            {project.billingType === "hourly"
                              ? `$${project.hourlyRate}/hr`
                              : formatCurrency(project.fixedPrice || 0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Budget</span>
                            <span className="text-xs font-mono text-gray-500">
                              {project.hoursTracked} / {project.budgetHours}h ({budgetPercent}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                budgetPercent >= 100
                                  ? "bg-red-500"
                                  : budgetPercent >= 80
                                    ? "bg-amber-500"
                                    : "bg-primary-500"
                              }`}
                              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <>
              {clientInvoices.length === 0 ? (
                <EmptyState
                  icon="invoices"
                  headline="No invoices for this client"
                  description="Create an invoice to start billing this client."
                  ctaLabel="+ Create Invoice"
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Issued</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3 font-mono font-medium text-gray-800">{inv.number}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-800">{inv.amount}</td>
                          <td className="px-4 py-3 text-gray-500">{inv.issuedDate}</td>
                          <td className="px-4 py-3">
                            <span className={inv.status === "overdue" ? "text-red-600 font-semibold" : "text-gray-500"}>
                              {inv.dueDate}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <p className="text-sm text-gray-700">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
