"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, FileText, Send, Download } from "lucide-react";
import { invoices, statusLabels } from "@/lib/mock-data";

const filterOptions = ["all", "draft", "sent", "overdue", "partial", "paid"];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = "$14,500.00";
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.length} invoices &middot; {totalOutstanding} outstanding
            {overdueCount > 0 && <span className="text-red-500"> &middot; {overdueCount} overdue</span>}
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
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="invoices"
          headline="No invoices yet"
          description="Create your first invoice to start billing your clients."
          ctaLabel="+ Create Invoice"
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
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

          {/* Invoice Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Issued</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {showSkeleton ? (
                    <>
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                    </>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No invoices match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400" />
                            <span className="font-mono font-medium text-gray-800">{invoice.number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{invoice.clientName}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">{invoice.amount}</td>
                        <td className="px-4 py-3 text-gray-500">{invoice.issuedDate}</td>
                        <td className="px-4 py-3">
                          <span className={invoice.status === "overdue" ? "text-red-600 font-semibold" : "text-gray-500"}>
                            {invoice.dueDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors">
                              <Send size={14} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
              <p className="text-lg font-bold font-mono text-gray-900">{totalOutstanding}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Overdue</p>
              <p className="text-lg font-bold font-mono text-red-600">{overdueCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Paid (Last 30d)</p>
              <p className="text-lg font-bold font-mono text-green-600">$4,800.00</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Avg. Payment Time</p>
              <p className="text-lg font-bold font-mono text-gray-900">18 days</p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
