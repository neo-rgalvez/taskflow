"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/format";
import { statusLabels } from "@/lib/mock-data";

import {
  Search,
  Plus,
  CalendarDays,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProjectClient {
  id: string;
  name: string;
}

interface Project {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  billingType: string;
  hourlyRate: string | null;
  fixedPrice: string | null;
  budgetHours: number | null;
  deadline: string | null;
  budgetAlertThreshold: string;
  createdAt: string;
  updatedAt: string;
  client: ProjectClient;
  _count?: { tasks: number };
  trackedMinutes?: number;
}

interface ProjectListResponse {
  data: Project[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

interface ClientOption {
  id: string;
  name: string;
  defaultHourlyRate: string | null;
}

interface ClientListResponse {
  data: ClientOption[];
  totalCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const filterOptions = ["all", "active", "on_hold", "completed", "cancelled"];

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { toast } = useToast();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    description: "",
    billingType: "hourly" as "hourly" | "fixed_price",
    hourlyRate: "",
    fixedPrice: "",
    budgetHours: "",
    deadline: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Client options for dropdown
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

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

  // Fetch projects
  const fetchProjects = useCallback(
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

      const result = await apiFetch<ProjectListResponse>(
        `/api/projects?${params.toString()}`
      );

      if (result.error) {
        setError(result.error);
        toast("error", result.error);
      } else if (result.data) {
        if (cursor) {
          setProjects((prev) => [...prev, ...result.data!.data]);
        } else {
          setProjects(result.data.data);
        }
        setTotalCount(result.data.totalCount);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [searchDebounce, statusFilter, toast]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Close action menu on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = () => setActiveMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [activeMenu]);

  // Fetch clients for dropdown
  async function fetchClients() {
    setClientsLoading(true);
    const result = await apiFetch<ClientListResponse>(
      "/api/clients?limit=100"
    );
    if (result.data) {
      setClientOptions(result.data.data);
    }
    setClientsLoading(false);
  }

  // Form handlers
  function openCreateModal() {
    setEditingProject(null);
    setFormData({
      clientId: "",
      name: "",
      description: "",
      billingType: "hourly",
      hourlyRate: "",
      fixedPrice: "",
      budgetHours: "",
      deadline: "",
    });
    setFormErrors({});
    setShowModal(true);
    fetchClients();
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setFormData({
      clientId: project.clientId,
      name: project.name,
      description: project.description || "",
      billingType: project.billingType as "hourly" | "fixed_price",
      hourlyRate: project.hourlyRate
        ? String(parseFloat(project.hourlyRate))
        : "",
      fixedPrice: project.fixedPrice
        ? String(parseFloat(project.fixedPrice))
        : "",
      budgetHours: project.budgetHours ? String(project.budgetHours) : "",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().split("T")[0]
        : "",
    });
    setFormErrors({});
    setShowModal(true);
    setActiveMenu(null);
    fetchClients();
  }

  // When client selection changes, pre-fill hourly rate from client default
  function handleClientChange(clientId: string) {
    setFormData((prev) => {
      const client = clientOptions.find((c) => c.id === clientId);
      const newData = { ...prev, clientId };
      // Only pre-fill rate on create when field is empty
      if (
        !editingProject &&
        !prev.hourlyRate &&
        client?.defaultHourlyRate &&
        prev.billingType === "hourly"
      ) {
        newData.hourlyRate = String(parseFloat(client.defaultHourlyRate));
      }
      return newData;
    });
    if (formErrors.clientId)
      setFormErrors((prev) => ({ ...prev, clientId: "" }));
  }

  // Guard against double-submit
  const savingRef = useRef(false);

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!formData.clientId) errs.clientId = "Client is required.";
    if (!formData.name.trim()) errs.name = "Project name is required.";
    if (formData.name.length > 200)
      errs.name = "Project name must be 200 characters or fewer.";
    if (
      formData.billingType === "hourly" &&
      !formData.hourlyRate
    )
      errs.hourlyRate = "Hourly rate is required for hourly projects.";
    if (
      formData.hourlyRate &&
      (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0)
    )
      errs.hourlyRate = "Hourly rate must be a positive number.";
    if (
      formData.billingType === "fixed_price" &&
      !formData.fixedPrice
    )
      errs.fixedPrice = "Total price is required for fixed-price projects.";
    if (
      formData.fixedPrice &&
      (isNaN(Number(formData.fixedPrice)) || Number(formData.fixedPrice) <= 0)
    )
      errs.fixedPrice = "Total price must be a positive number.";
    if (
      formData.budgetHours &&
      (isNaN(Number(formData.budgetHours)) ||
        Number(formData.budgetHours) <= 0 ||
        !Number.isInteger(Number(formData.budgetHours)))
    )
      errs.budgetHours = "Budget hours must be a positive whole number.";

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    savingRef.current = true;

    const payload: Record<string, unknown> = {
      clientId: formData.clientId,
      name: formData.name.trim(),
      description: formData.description.trim() || "",
      billingType: formData.billingType,
      hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : null,
      fixedPrice: formData.fixedPrice ? Number(formData.fixedPrice) : null,
      budgetHours: formData.budgetHours ? Number(formData.budgetHours) : null,
      deadline: formData.deadline
        ? new Date(formData.deadline + "T00:00:00Z").toISOString()
        : null,
    };

    if (editingProject) {
      // Update
      payload.updatedAt = editingProject.updatedAt;
      const result = await apiFetch<Project>(
        `/api/projects/${editingProject.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      if (result.status === 409) {
        toast("warning", "This project was modified elsewhere. Refreshing...");
        fetchProjects();
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
        fetchProjects();
      }
    } else {
      // Create
      const result = await apiFetch<Project>("/api/projects", {
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
        fetchProjects();
      }
    }

    setSaving(false);
    savingRef.current = false;
  }

  // Delete
  function handleDelete(project: Project) {
    setActiveMenu(null);
    setConfirmDialog({
      open: true,
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? This will permanently remove this project and all associated data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmLoading(true);
        const result = await apiFetch(`/api/projects/${project.id}`, {
          method: "DELETE",
        });
        if (result.error) {
          toast("error", result.error);
        } else {
          toast("success", `"${project.name}" deleted successfully.`);
          fetchProjects();
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${totalCount} total project${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state (no projects at all) */}
      {!loading && !error && totalCount === 0 && !searchDebounce && statusFilter === "all" ? (
        <EmptyState
          icon="projects"
          headline="No projects yet"
          description="Create your first project to start tracking tasks, time, and budgets."
          ctaLabel="+ Create Project"
          onCta={openCreateModal}
        />
      ) : !loading || projects.length > 0 ? (
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
                placeholder="Search projects..."
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

          {/* Project Cards Grid */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading && projects.length === 0 ? (
              <>
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </>
            ) : projects.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-gray-500">
                  No projects match your filters
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-2 text-sm text-primary-500 hover:text-primary-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              projects.map((project) => {
                const trackedHours = (project.trackedMinutes || 0) / 60;
                const budgetPercent = project.budgetHours
                  ? Math.round((trackedHours / project.budgetHours) * 100)
                  : 0;
                const isOverdue =
                  project.deadline &&
                  new Date(project.deadline) < new Date() &&
                  project.status !== "completed" &&
                  project.status !== "cancelled";

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all relative group"
                  >
                    {/* Action menu */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(
                            activeMenu === project.id ? null : project.id
                          );
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(project);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between mb-3 pr-6">
                        <StatusBadge status={project.status} />
                        {project.deadline && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              isOverdue
                                ? "text-red-500 font-semibold"
                                : "text-gray-500"
                            }`}
                          >
                            <CalendarDays size={12} />
                            {formatDate(
                              project.deadline.split("T")[0]
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[8px] font-semibold"
                          style={{
                            backgroundColor: getAvatarColor(
                              project.client.name
                            ),
                          }}
                        >
                          {getInitials(project.client.name)}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {project.client.name}
                        </p>
                      </div>

                      {/* Budget Progress */}
                      {project.budgetHours && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              Budget
                            </span>
                            <span className="text-xs font-mono text-gray-500">
                              {budgetPercent}%
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
                              style={{
                                width: `${Math.min(budgetPercent, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            0 / {project.budgetHours} hrs
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-4 pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>{project._count?.tasks ?? 0} tasks</span>
                        <span className="ml-auto font-mono">
                          {project.billingType === "hourly"
                            ? `${formatCurrency(
                                parseFloat(project.hourlyRate || "0")
                              )}/hr`
                            : formatCurrency(
                                parseFloat(project.fixedPrice || "0")
                              )}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination / Load More */}
          {!loading && projects.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {projects.length} of {totalCount}
              </p>
              {hasMore && (
                <button
                  onClick={() => nextCursor && fetchProjects(nextCursor)}
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
        </>
      ) : null}

      {/* Project Form Modal (Create / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !saving && setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <button
              onClick={() => !saving && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingProject ? "Edit Project" : "New Project"}
            </h2>
            <form onSubmit={handleSaveProject} className="space-y-5">
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client <span className="text-red-500">*</span>
                </label>
                {clientsLoading ? (
                  <div className="w-full h-10 bg-gray-100 rounded-md animate-pulse" />
                ) : (
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 ${
                      formErrors.clientId
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                    }`}
                    disabled={saving}
                  >
                    <option value="">Select a client...</option>
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.clientId && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.clientId}
                  </p>
                )}
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name)
                      setFormErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g., Website Redesign"
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-none"
                  disabled={saving}
                />
              </div>

              {/* Billing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Billing Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        billingType: "hourly",
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        hourlyRate: "",
                        fixedPrice: "",
                      }));
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                      formData.billingType === "hourly"
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                    disabled={saving}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        billingType: "fixed_price",
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        hourlyRate: "",
                        fixedPrice: "",
                      }));
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                      formData.billingType === "fixed_price"
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                    disabled={saving}
                  >
                    Fixed Price
                  </button>
                </div>
              </div>

              {/* Hourly Rate / Fixed Price (conditional) */}
              <div className="grid grid-cols-2 gap-4">
                {formData.billingType === "hourly" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Hourly Rate <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.hourlyRate}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            hourlyRate: e.target.value,
                          });
                          if (formErrors.hourlyRate)
                            setFormErrors((prev) => ({
                              ...prev,
                              hourlyRate: "",
                            }));
                        }}
                        placeholder="0.00"
                        className={`w-full h-10 pl-7 pr-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                          formErrors.hourlyRate
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                        }`}
                        disabled={saving}
                      />
                    </div>
                    {formErrors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.hourlyRate}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fixed Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.fixedPrice}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            fixedPrice: e.target.value,
                          });
                          if (formErrors.fixedPrice)
                            setFormErrors((prev) => ({
                              ...prev,
                              fixedPrice: "",
                            }));
                        }}
                        placeholder="0.00"
                        className={`w-full h-10 pl-7 pr-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                          formErrors.fixedPrice
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                        }`}
                        disabled={saving}
                      />
                    </div>
                    {formErrors.fixedPrice && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.fixedPrice}
                      </p>
                    )}
                  </div>
                )}

                {/* Budget Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Budget Hours
                  </label>
                  <input
                    type="text"
                    value={formData.budgetHours}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        budgetHours: e.target.value,
                      });
                      if (formErrors.budgetHours)
                        setFormErrors((prev) => ({
                          ...prev,
                          budgetHours: "",
                        }));
                    }}
                    placeholder="e.g., 80"
                    className={`w-full h-10 px-3 border rounded-md text-base font-mono focus:outline-none focus:ring-2 ${
                      formErrors.budgetHours
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                    }`}
                    disabled={saving}
                  />
                  {formErrors.budgetHours && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.budgetHours}
                    </p>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                  disabled={saving}
                />
              </div>

              {/* Actions */}
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
                  {editingProject ? "Save Changes" : "Create Project"}
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
