"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  Plus,
  MoreHorizontal,
  X,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  defaultHourlyRate: string | null;
  defaultPaymentTerms: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientListResponse {
  data: Client[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

// Color palette for client avatars (deterministic based on name)
const avatarColors = [
  "#6366F1", "#EC4899", "#14B8A6", "#F97316", "#8B5CF6",
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#06B6D4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ClientsPage() {
  const { toast } = useToast();

  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    rate: "",
    terms: "30",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Action menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  // Fetch clients
  const fetchClients = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (searchDebounce) params.set("search", searchDebounce);
      if (showArchived) params.set("archived", "true");
      if (cursor) params.set("cursor", cursor);

      const result = await apiFetch<ClientListResponse>(
        `/api/clients?${params.toString()}`
      );

      if (result.error) {
        setError(result.error);
        toast("error", result.error);
      } else if (result.data) {
        if (cursor) {
          setClients((prev) => [...prev, ...result.data!.data]);
        } else {
          setClients(result.data.data);
        }
        setTotalCount(result.data.totalCount);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [searchDebounce, showArchived, toast]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Close action menu on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = () => setActiveMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [activeMenu]);

  // Form handlers
  function openCreateModal() {
    setEditingClient(null);
    setFormData({ name: "", contactName: "", email: "", phone: "", rate: "", terms: "30" });
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contactName: client.contactName || "",
      email: client.email || "",
      phone: client.phone || "",
      rate: client.defaultHourlyRate ? String(parseFloat(client.defaultHourlyRate)) : "",
      terms: client.defaultPaymentTerms ? String(client.defaultPaymentTerms) : "30",
    });
    setFormErrors({});
    setShowModal(true);
    setActiveMenu(null);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Client name is required.";
    if (formData.name.length > 200) errs.name = "Client name must be 200 characters or fewer.";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "Please enter a valid email address.";
    if (formData.rate && (isNaN(Number(formData.rate)) || Number(formData.rate) < 0))
      errs.rate = "Hourly rate must be a positive number.";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      contactName: formData.contactName.trim() || "",
      email: formData.email.trim() || "",
      phone: formData.phone.trim() || "",
      defaultHourlyRate: formData.rate ? Number(formData.rate) : null,
      defaultPaymentTerms: Number(formData.terms),
    };

    if (editingClient) {
      // Update
      payload.updatedAt = editingClient.updatedAt;
      const result = await apiFetch<Client>(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (result.status === 409) {
        toast("warning", "This client was modified elsewhere. Refreshing...");
        fetchClients();
        setShowModal(false);
      } else if (result.error) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.errors)) {
            fieldErrors[key] = (msgs as string[])[0];
          }
          setFormErrors(fieldErrors);
        } else {
          toast("error", result.error);
        }
      } else {
        toast("success", `"${formData.name}" updated successfully.`);
        setShowModal(false);
        fetchClients();
      }
    } else {
      // Create
      const result = await apiFetch<Client>("/api/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.error) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.errors)) {
            fieldErrors[key] = (msgs as string[])[0];
          }
          setFormErrors(fieldErrors);
        } else {
          toast("error", result.error);
        }
      } else {
        toast("success", `"${formData.name}" created successfully.`);
        setShowModal(false);
        fetchClients();
      }
    }

    setSaving(false);
  }

  // Archive / Unarchive
  function handleArchive(client: Client) {
    setActiveMenu(null);
    const action = client.isArchived ? "unarchive" : "archive";
    setConfirmDialog({
      open: true,
      title: `${client.isArchived ? "Unarchive" : "Archive"} Client`,
      message: client.isArchived
        ? `Are you sure you want to unarchive "${client.name}"? They will appear in your active client list again.`
        : `Are you sure you want to archive "${client.name}"? They will be hidden from your active client list.`,
      confirmLabel: client.isArchived ? "Unarchive" : "Archive",
      variant: "warning",
      onConfirm: async () => {
        setConfirmLoading(true);
        const result = await apiFetch(`/api/clients/${client.id}/archive`, {
          method: "PATCH",
          body: JSON.stringify({ isArchived: !client.isArchived }),
        });
        if (result.error) {
          toast("error", result.error);
        } else {
          toast("success", `"${client.name}" ${action}d successfully.`);
          fetchClients();
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  // Delete
  function handleDelete(client: Client) {
    setActiveMenu(null);
    setConfirmDialog({
      open: true,
      title: "Delete Client",
      message: `Are you sure you want to delete "${client.name}"? This will permanently remove this client and all associated data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmLoading(true);
        const result = await apiFetch(`/api/clients/${client.id}`, {
          method: "DELETE",
        });
        if (result.error) {
          toast("error", result.error);
        } else {
          toast("success", `"${client.name}" deleted successfully.`);
          fetchClients();
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading..." : `${totalCount} ${showArchived ? "archived" : "total"} client${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              showArchived
                ? "bg-gray-700 text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => fetchClients()}
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state (no clients at all) */}
      {!loading && !error && totalCount === 0 && !searchDebounce ? (
        <EmptyState
          icon="clients"
          headline={showArchived ? "No archived clients" : "No clients yet"}
          description={
            showArchived
              ? "Archived clients will appear here."
              : "Add a client to organize your projects, track time, and generate invoices."
          }
          ctaLabel={showArchived ? undefined : "+ Add Client"}
          onCta={showArchived ? undefined : openCreateModal}
        />
      ) : !loading || clients.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase text-gray-500 tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase text-gray-500 tracking-wider hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase text-gray-500 tracking-wider hidden md:table-cell">
                    Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase text-gray-500 tracking-wider hidden lg:table-cell">
                    Terms
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase text-gray-500 tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && clients.length === 0 ? (
                  <>
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                    <TableRowSkeleton cols={6} />
                  </>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-gray-500">
                        No results match your search
                      </p>
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-sm text-primary-500 hover:text-primary-700"
                      >
                        Clear search
                      </button>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/clients/${client.id}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
                            style={{
                              backgroundColor: getAvatarColor(client.name),
                            }}
                          >
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600">
                              {client.name}
                            </p>
                            <p className="text-xs text-gray-500 sm:hidden">
                              {client.contactName || "—"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm text-gray-700">
                          {client.contactName || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {client.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-mono text-gray-700">
                          {client.defaultHourlyRate
                            ? `${formatCurrency(parseFloat(client.defaultHourlyRate))}/hr`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-700">
                          {client.defaultPaymentTerms
                            ? `Net ${client.defaultPaymentTerms}`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={client.isArchived ? "archived" : "active"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(
                                activeMenu === client.id ? null : client.id
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {activeMenu === client.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(client);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(client);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {client.isArchived ? (
                                  <>
                                    <ArchiveRestore size={14} /> Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive size={14} /> Archive
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination / Load More */}
          {!loading && clients.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {clients.length} of {totalCount}
              </p>
              {hasMore && (
                <button
                  onClick={() => nextCursor && fetchClients(nextCursor)}
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
      ) : null}

      {/* Client Form Modal (Create / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !saving && setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <button
              onClick={() => !saving && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingClient ? "Edit Client" : "Add New Client"}
            </h2>
            <form onSubmit={handleSaveClient} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g., Acme Corp"
                  className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  disabled={saving}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="e.g., Jane Smith"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="e.g., jane@acme.com"
                    className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                      formErrors.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                    }`}
                    disabled={saving}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="e.g., (555) 123-4567"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Default Hourly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      value={formData.rate}
                      onChange={(e) => {
                        setFormData({ ...formData, rate: e.target.value });
                        if (formErrors.rate) setFormErrors((prev) => ({ ...prev, rate: "" }));
                      }}
                      placeholder="0.00"
                      className={`w-full h-10 pl-7 pr-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                        formErrors.rate
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                      }`}
                      disabled={saving}
                    />
                  </div>
                  {formErrors.rate && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.rate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Payment Terms
                  </label>
                  <select
                    value={formData.terms}
                    onChange={(e) =>
                      setFormData({ ...formData, terms: e.target.value })
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    disabled={saving}
                  >
                    <option value="15">Net 15</option>
                    <option value="30">Net 30</option>
                    <option value="45">Net 45</option>
                    <option value="60">Net 60</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingClient ? "Save Changes" : "Save Client"}
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
