"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDuration } from "@/lib/format";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  FileText,
  Activity,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  defaultHourlyRate: string | null;
  defaultPaymentTerms: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientSummary {
  activeProjectCount: number;
  totalProjects: number;
  draftInvoiceCount: number;
  outstandingInvoiceAmount: number;
  totalMinutes: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  billingType: string;
  hourlyRate: string | null;
  budgetHours: number | null;
  deadline: string | null;
  client: Client;
}

type Tab = "projects" | "invoices" | "activity";

// Color palette for client avatars
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

export default function ClientDetailContent({ id }: { id: string }) {
  const { toast } = useToast();
  const router = useRouter();

  // Data state
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("projects");

  // Summary & projects
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    rate: "",
    terms: "30",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

  // Fetch client
  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiFetch<Client>(`/api/clients/${id}`);
    if (result.status === 404) {
      setError("Client not found.");
      toast("error", "Client not found.");
    } else if (result.error) {
      setError(result.error);
      toast("error", result.error);
    } else if (result.data) {
      setClient(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // Fetch summary + projects
  const fetchSummaryAndProjects = useCallback(async () => {
    setProjectsLoading(true);
    const [summaryResult, projectsResult] = await Promise.all([
      apiFetch<ClientSummary>(`/api/clients/${id}/summary`),
      apiFetch<{ data: Project[]; totalCount: number }>(`/api/projects?clientId=${id}`),
    ]);
    if (summaryResult.data) {
      setSummary(summaryResult.data);
    }
    if (projectsResult.data) {
      setProjects(projectsResult.data.data);
    }
    setProjectsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSummaryAndProjects();
  }, [fetchSummaryAndProjects]);

  // Edit
  function openEditModal() {
    if (!client) return;
    setFormData({
      name: client.name,
      contactName: client.contactName || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
      rate: client.defaultHourlyRate
        ? String(parseFloat(client.defaultHourlyRate))
        : "",
      terms: String(client.defaultPaymentTerms),
    });
    setFormErrors({});
    setShowEditModal(true);
  }

  const savingRef = useRef(false);

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    if (savingRef.current) return;

    const errs: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) errs.name = "Client name is required.";
    else if (trimmedName.length > 200) errs.name = "Client name is too long.";
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      errs.email = "Please enter a valid email address.";
    if (
      formData.rate &&
      (isNaN(Number(formData.rate)) || Number(formData.rate) < 0)
    )
      errs.rate = "Hourly rate must be a positive number.";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    savingRef.current = true;

    const payload = {
      name: formData.name.trim(),
      contactName: formData.contactName.trim() || "",
      email: formData.email.trim() || "",
      phone: formData.phone.trim() || "",
      address: formData.address.trim() || "",
      notes: formData.notes.trim() || "",
      defaultHourlyRate: formData.rate ? Number(formData.rate) : null,
      defaultPaymentTerms: Number(formData.terms),
      updatedAt: client.updatedAt,
    };

    const result = await apiFetch<Client>(`/api/clients/${client.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (result.status === 409) {
      toast("warning", "This client was modified elsewhere. Refreshing...");
      fetchClient();
      setShowEditModal(false);
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
      setShowEditModal(false);
      fetchClient();
    }

    setSaving(false);
    savingRef.current = false;
  }

  // Archive
  async function handleArchive() {
    if (!client) return;
    const action = client.isArchived ? "unarchive" : "archive";

    let message: string;
    if (client.isArchived) {
      message = `Are you sure you want to unarchive "${client.name}"? They will appear in your active client list again.`;
    } else {
      const summary = await apiFetch<{ outstandingInvoiceAmount: number }>(
        `/api/clients/${client.id}/summary`
      );
      const outstanding = summary.data?.outstandingInvoiceAmount ?? 0;
      message = outstanding > 0
        ? `This client has $${outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })} in outstanding invoices. Archive anyway?`
        : `Are you sure you want to archive "${client.name}"? They will be hidden from your active client list.`;
    }

    setConfirmDialog({
      open: true,
      title: `${client.isArchived ? "Unarchive" : "Archive"} Client`,
      message,
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
          fetchClient();
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  // Delete
  async function handleDelete() {
    if (!client) return;

    const summary = await apiFetch<{ activeProjectCount: number }>(
      `/api/clients/${client.id}/summary`
    );
    const projectCount = summary.data?.activeProjectCount ?? 0;

    const message = projectCount > 0
      ? `This client has ${projectCount} active project${projectCount !== 1 ? "s" : ""}. Archiving is recommended. Delete anyway?\n\nThis will permanently remove this client and all associated data. This action cannot be undone.`
      : `Are you sure you want to delete "${client.name}"? This will permanently remove this client and all associated data. This action cannot be undone.`;

    setConfirmDialog({
      open: true,
      title: "Delete Client",
      message,
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
          router.push("/clients");
        }
        setConfirmLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "projects", label: "Projects", icon: FolderKanban },
    { key: "invoices", label: "Invoices", icon: FileText },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  // Loading state
  if (loading) {
    return (
      <>
        <div className="inline-flex items-center gap-1 text-sm text-gray-400 mb-4">
          <ArrowLeft size={14} /> Back to Clients
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-7 w-64 rounded mb-2" />
              <Skeleton className="h-4 w-40 rounded mb-2" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 rounded mb-2" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Clients
        </Link>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle size={48} className="text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {error || "Client not found"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            The client you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/clients"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Clients
            </Link>
          </div>
        </div>
      </>
    );
  }

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
              style={{ backgroundColor: getAvatarColor(client.name) }}
            >
              {getInitials(client.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.name}
                </h1>
                <StatusBadge
                  status={client.isArchived ? "archived" : "active"}
                />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {client.contactName || "No contact name"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-1 hover:text-primary-500"
                  >
                    <Mail size={13} /> {client.email}
                  </a>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {client.phone}
                  </span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {client.address}
                  </span>
                )}
              </div>
              {client.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  {client.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title={client.isArchived ? "Unarchive" : "Archive"}
            >
              {client.isArchived ? (
                <ArchiveRestore size={16} />
              ) : (
                <Archive size={16} />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-md hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
            >
              <Pencil size={14} /> Edit Client
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Default Rate</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {client.defaultHourlyRate
                ? `${formatCurrency(parseFloat(client.defaultHourlyRate))}/hr`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {client.defaultPaymentTerms
                ? `Net ${client.defaultPaymentTerms}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Hours Tracked</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {formatDuration(summary?.totalMinutes ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {formatCurrency(
                ((summary?.totalMinutes ?? 0) / 60) *
                  (client.defaultHourlyRate
                    ? parseFloat(client.defaultHourlyRate)
                    : 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {client.isArchived ? "Archived" : "Active"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900 mt-1.5">
              {new Date(client.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
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
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "projects" && (
        <>
          {projectsLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon="projects"
              headline="No projects for this client"
              description="Create a new project to start tracking work for this client."
              ctaLabel="+ Add Project"
              ctaHref="/projects"
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  Projects ({projects.length})
                </h3>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                >
                  + Add Project
                </Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderKanban size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                        {project.budgetHours != null && (
                          <span>{project.budgetHours}h budget</span>
                        )}
                        {project.deadline && (
                          <span>
                            Due{" "}
                            {new Date(project.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeTab === "invoices" && (
        <EmptyState
          icon="invoices"
          headline="No invoices for this client"
          description="Create an invoice to start billing this client."
          ctaLabel="+ Create Invoice"
        />
      )}

      {activeTab === "activity" && (
        <EmptyState
          icon="tasks"
          headline="No activity yet"
          description="Activity for this client will appear here as you work."
        />
      )}

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !saving && setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <button
              onClick={() => !saving && setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Edit Client
            </h2>
            <form onSubmit={handleSaveClient} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client / Company Name{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name)
                      setFormErrors((prev) => ({ ...prev, name: "" }));
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
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.name}
                  </p>
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
                      if (formErrors.email)
                        setFormErrors((prev) => ({ ...prev, email: "" }));
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Full mailing address"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Freeform notes about this client"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                  disabled={saving}
                />
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
                        if (formErrors.rate)
                          setFormErrors((prev) => ({ ...prev, rate: "" }));
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
                  onClick={() => setShowEditModal(false)}
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
                  Save Changes
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
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
      />
    </>
  );
}
