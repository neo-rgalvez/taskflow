"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { usePageTitle } from "@/lib/usePageTitle";
import { statusLabels } from "@/lib/status";
import {
  Search,
  Plus,
  FileText,
  Send,
  Download,
  MoreHorizontal,
  Trash2,
  DollarSign,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  clientId: string;
  projectId: string;
  status: string;
  issuedDate: string | null;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  currency: string;
  notes: string | null;
  paymentInstructions: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
}

interface InvoiceListResponse {
  data: Invoice[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
  stats: {
    totalOutstanding: string;
    overdueCount: number;
    paidLast30Days: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  _count?: { projects: number };
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

const filterOptions = ["all", "draft", "sent", "overdue", "partial", "paid"];

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num || 0);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicesPage() {
  usePageTitle("Invoices");
  const { toast } = useToast();

  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOutstanding: "0",
    overdueCount: 0,
    paidLast30Days: "0",
  });

  // Search and filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Action menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createForm, setCreateForm] = useState({
    clientId: "",
    projectId: "",
    subtotal: "",
    taxRate: "0",
    dueDate: "",
    notes: "",
    paymentInstructions: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: "danger" | "warning";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "",
    variant: "danger",
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch invoices
  const fetchInvoices = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (searchDebounce) params.set("search", searchDebounce);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (cursor) params.set("cursor", cursor);

      const result = await apiFetch<InvoiceListResponse>(
        `/api/invoices?${params.toString()}`
      );

      if (result.error) {
        setError(result.error);
        toast("error", result.error);
      } else if (result.data) {
        if (cursor) {
          setInvoices((prev) => [...prev, ...result.data!.data]);
        } else {
          setInvoices(result.data.data);
        }
        setTotalCount(result.data.totalCount);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
        setStats(result.data.stats);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [searchDebounce, statusFilter, toast]
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Close action menu on outside click or scroll
  useEffect(() => {
    if (!activeMenu) return;
    const close = () => {
      setActiveMenu(null);
      setMenuPos(null);
    };
    document.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [activeMenu]);

  // Load clients when create modal opens
  async function openCreateModal() {
    setShowCreateModal(true);
    setCreateForm({
      clientId: "",
      projectId: "",
      subtotal: "",
      taxRate: "0",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      notes: "",
      paymentInstructions: "",
    });
    setCreateErrors({});

    const result = await apiFetch<{ data: Client[] }>("/api/clients?limit=100");
    if (result.data) {
      setClients(result.data.data);
    }
  }

  // Load projects when client changes
  async function handleClientChange(clientId: string) {
    setCreateForm((prev) => ({ ...prev, clientId, projectId: "" }));
    if (!clientId) {
      setProjects([]);
      return;
    }
    const result = await apiFetch<{ data: Project[] }>(
      `/api/projects?clientId=${clientId}&limit=100`
    );
    if (result.data) {
      setProjects(result.data.data);
    }
  }

  // Guard against double-submit
  const savingRef = useRef(false);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;

    const errs: Record<string, string> = {};
    if (!createForm.clientId) errs.clientId = "Please select a client.";
    if (!createForm.projectId) errs.projectId = "Please select a project.";
    if (!createForm.subtotal || isNaN(Number(createForm.subtotal)) || Number(createForm.subtotal) <= 0)
      errs.subtotal = "Enter a valid amount.";
    if (!createForm.dueDate) errs.dueDate = "Due date is required.";
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreating(true);
    savingRef.current = true;

    const result = await apiFetch<Invoice>("/api/invoices", {
      method: "POST",
      body: JSON.stringify({
        clientId: createForm.clientId,
        projectId: createForm.projectId,
        subtotal: Number(createForm.subtotal),
        taxRate: Number(createForm.taxRate) || 0,
        dueDate: createForm.dueDate,
        notes: createForm.notes,
        paymentInstructions: createForm.paymentInstructions,
      }),
    });

    if (result.error) {
      if (result.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(result.errors)) {
          fieldErrors[key] = (msgs as string[])[0];
        }
        setCreateErrors(fieldErrors);
      } else {
        toast("error", result.error);
      }
    } else {
      toast("success", `Invoice created successfully.`);
      setShowCreateModal(false);
      fetchInvoices();
    }

    setCreating(false);
    savingRef.current = false;
  }

  // Send invoice (mark as sent)
  async function handleSend(invoice: Invoice) {
    setActiveMenu(null);

    if (invoice.status !== "draft") {
      toast("warning", "Only draft invoices can be sent.");
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Send Invoice",
      message: `Mark ${invoice.invoiceNumber} as sent to ${invoice.clientName}?`,
      confirmLabel: "Send",
      variant: "warning",
      onConfirm: async () => {
        setConfirmLoading(true);
        const result = await apiFetch<Invoice>(`/api/invoices/${invoice.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "sent",
            updatedAt: invoice.updatedAt,
          }),
        });

        if (result.error) {
          toast("error", result.error);
        } else {
          toast("success", `${invoice.invoiceNumber} marked as sent.`);
          fetchInvoices();
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  // Record payment
  function openPaymentModal(invoice: Invoice) {
    setActiveMenu(null);
    setPaymentInvoice(invoice);
    setPaymentForm({
      amount: parseFloat(invoice.balanceDue).toString(),
      paymentDate: new Date().toISOString().split("T")[0],
      method: "",
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentInvoice) return;

    const errs: Record<string, string> = {};
    if (!paymentForm.amount || isNaN(Number(paymentForm.amount)) || Number(paymentForm.amount) <= 0)
      errs.amount = "Enter a valid payment amount.";
    if (!paymentForm.paymentDate) errs.paymentDate = "Date is required.";
    setPaymentErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setRecordingPayment(true);

    const result = await apiFetch<Invoice>(
      `/api/invoices/${paymentInvoice.id}/payment`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          method: paymentForm.method,
        }),
      }
    );

    if (result.error) {
      toast("error", result.error);
    } else {
      toast("success", `Payment of ${formatCurrency(paymentForm.amount)} recorded.`);
      setShowPaymentModal(false);
      fetchInvoices();
    }

    setRecordingPayment(false);
  }

  // Mark as overdue
  async function handleMarkOverdue(invoice: Invoice) {
    setActiveMenu(null);

    const result = await apiFetch<Invoice>(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "overdue",
        updatedAt: invoice.updatedAt,
      }),
    });

    if (result.error) {
      toast("error", result.error);
    } else {
      toast("success", `${invoice.invoiceNumber} marked as overdue.`);
      fetchInvoices();
    }
  }

  // Delete invoice
  function handleDelete(invoice: Invoice) {
    setActiveMenu(null);

    setConfirmDialog({
      open: true,
      title: "Delete Invoice",
      message: `Are you sure you want to delete ${invoice.invoiceNumber}? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmLoading(true);
        const result = await apiFetch(`/api/invoices/${invoice.id}`, {
          method: "DELETE",
        });

        if (result.error) {
          toast("error", result.error);
        } else {
          toast("success", `${invoice.invoiceNumber} deleted.`);
          fetchInvoices();
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  // Download as PDF
  function handleDownload(invoice: Invoice) {
    setActiveMenu(null);
    const doc = generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      projectName: invoice.project?.name,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      status: invoice.status,
      currency: invoice.currency,
      notes: invoice.notes,
      paymentInstructions: invoice.paymentInstructions,
    });
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast("success", `${invoice.invoiceNumber} downloaded.`);
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${totalCount} invoice${totalCount !== 1 ? "s" : ""} \u00b7 ${formatCurrency(stats.totalOutstanding)} outstanding`}
            {stats.overdueCount > 0 && (
              <span className="text-red-500">
                {" "}
                &middot; {stats.overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => fetchInvoices()}
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalCount === 0 && !searchDebounce ? (
        <EmptyState
          icon="invoices"
          headline="No invoices yet"
          description="Create your first invoice to start billing your clients."
          ctaLabel="+ Create Invoice"
          onCta={openCreateModal}
        />
      ) : !loading || invoices.length > 0 ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
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
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Invoice
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Client
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                      Issued
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Due
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && invoices.length === 0 ? (
                    <>
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                      <TableRowSkeleton cols={7} />
                    </>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No invoices match your filters
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400" />
                            <span className="font-mono font-medium text-gray-800">
                              {invoice.invoiceNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {invoice.clientName}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {formatDate(invoice.issuedDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              invoice.status === "overdue"
                                ? "text-red-600 font-semibold"
                                : "text-gray-500"
                            }
                          >
                            {formatDate(invoice.dueDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              ref={(el) => {
                                menuButtonRefs.current[invoice.id] = el;
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeMenu === invoice.id) {
                                  setActiveMenu(null);
                                  setMenuPos(null);
                                } else {
                                  const rect =
                                    menuButtonRefs.current[
                                      invoice.id
                                    ]?.getBoundingClientRect();
                                  if (rect) {
                                    setMenuPos({
                                      top: rect.bottom + 4,
                                      left: rect.right - 208,
                                    });
                                  }
                                  setActiveMenu(invoice.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {activeMenu === invoice.id &&
                              menuPos &&
                              createPortal(
                                <div
                                  className="fixed w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                  style={{
                                    top: menuPos.top,
                                    left: menuPos.left,
                                  }}
                                >
                                  {invoice.status === "draft" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSend(invoice);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Send size={14} /> Mark as Sent
                                    </button>
                                  )}
                                  {(invoice.status === "sent" ||
                                    invoice.status === "overdue" ||
                                    invoice.status === "partial") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPaymentModal(invoice);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <DollarSign size={14} /> Record Payment
                                    </button>
                                  )}
                                  {invoice.status === "sent" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkOverdue(invoice);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <AlertCircle size={14} /> Mark Overdue
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(invoice);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Download size={14} /> Download
                                  </button>
                                  {invoice.status === "draft" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(invoice);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  )}
                                </div>,
                                document.body
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && invoices.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {invoices.length} of {totalCount}
                </p>
                {hasMore && (
                  <button
                    onClick={() => nextCursor && fetchInvoices(nextCursor)}
                    disabled={loadingMore}
                    className="px-4 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Load more"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
                <p className="text-lg font-bold font-mono text-gray-900">
                  {formatCurrency(stats.totalOutstanding)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Overdue</p>
                <p className="text-lg font-bold font-mono text-red-600">
                  {stats.overdueCount}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Paid (Last 30d)</p>
                <p className="text-lg font-bold font-mono text-green-600">
                  {formatCurrency(stats.paidLast30Days)}
                </p>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !creating && setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <button
              onClick={() => !creating && setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={creating}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              New Invoice
            </h2>
            <form onSubmit={handleCreateInvoice} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                    createErrors.clientId
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  disabled={creating}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {createErrors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{createErrors.clientId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.projectId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                  className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                    createErrors.projectId
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  disabled={creating || !createForm.clientId}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {createErrors.projectId && (
                  <p className="mt-1 text-sm text-red-600">
                    {createErrors.projectId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      value={createForm.subtotal}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          subtotal: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className={`w-full h-10 pl-7 pr-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                        createErrors.subtotal
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                      }`}
                      disabled={creating}
                    />
                  </div>
                  {createErrors.subtotal && (
                    <p className="mt-1 text-sm text-red-600">
                      {createErrors.subtotal}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="text"
                    value={createForm.taxRate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        taxRate: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    disabled={creating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                    createErrors.dueDate
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  disabled={creating}
                />
                {createErrors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {createErrors.dueDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional notes for the client"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                  disabled={creating}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !recordingPayment && setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <button
              onClick={() => !recordingPayment && setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={recordingPayment}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Record Payment
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {paymentInvoice.invoiceNumber} &middot; Balance due:{" "}
              {formatCurrency(paymentInvoice.balanceDue)}
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className={`w-full h-10 pl-7 pr-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                      paymentErrors.amount
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                    }`}
                    disabled={recordingPayment}
                  />
                </div>
                {paymentErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {paymentErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  disabled={recordingPayment}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Method
                </label>
                <input
                  type="text"
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                  placeholder="e.g., Bank transfer, PayPal"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  disabled={recordingPayment}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={recordingPayment}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {recordingPayment && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        loading={confirmLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
