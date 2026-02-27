"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  User,
  Lock,
  Bell,
  Building,
  Upload,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Tab = "profile" | "password" | "notifications" | "business" | "danger";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  timezone: string;
  emailVerified: boolean;
  createdAt: string;
}

// ─── Password strength helpers ──────────────────────────────────────────────

interface StrengthCheck {
  label: string;
  test: (pw: string) => boolean;
}

const strengthChecks: StrengthCheck[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Contains a number", test: (pw) => /\d/.test(pw) },
];

function getStrengthScore(pw: string): number {
  if (!pw) return 0;
  return strengthChecks.filter((c) => c.test(pw)).length;
}

function getStrengthLabel(score: number): { text: string; color: string } {
  if (score === 0) return { text: "", color: "" };
  if (score <= 1) return { text: "Weak", color: "bg-red-500" };
  if (score <= 2) return { text: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { text: "Good", color: "bg-yellow-400" };
  return { text: "Strong", color: "bg-green-500" };
}

// ─── Timezones ──────────────────────────────────────────────────────────────

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<UserAccount | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "business", label: "Business", icon: Building },
    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  const loadAccount = useCallback(async () => {
    setLoading(true);
    const { data, error } = await apiFetch<UserAccount>(
      "/api/settings/account"
    );
    if (data) {
      setAccount(data);
    } else if (error) {
      toast("error", error);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary-50 text-primary-700"
                      : tab.key === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
              <Skeleton className="h-6 w-40 rounded" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2 rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2 rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2 rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded" />
            </div>
          ) : (
            <>
              {activeTab === "profile" && account && (
                <ProfileTab
                  account={account}
                  onSaved={(updated) => {
                    setAccount(updated);
                    toast("success", "Profile updated successfully.");
                  }}
                />
              )}

              {activeTab === "password" && (
                <PasswordTab />
              )}

              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "business" && <BusinessTab />}

              {activeTab === "danger" && (
                <DangerZoneTab
                  onDeleted={() => {
                    router.push("/login");
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab({
  account,
  onSaved,
}: {
  account: UserAccount;
  onSaved: (updated: UserAccount) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [timezone, setTimezone] = useState(account.timezone);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const hasChanges =
    name !== account.name ||
    email !== account.email ||
    timezone !== account.timezone;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFieldErrors({});
    setSaving(true);

    const body: Record<string, string> = {};
    if (name !== account.name) body.name = name;
    if (email !== account.email) body.email = email;
    if (timezone !== account.timezone) body.timezone = timezone;

    if (Object.keys(body).length === 0) {
      setSaving(false);
      return;
    }

    const { data, error, errors } = await apiFetch<UserAccount>(
      "/api/settings/account",
      { method: "PATCH", body: JSON.stringify(body) }
    );

    if (data) {
      onSaved(data);
    } else {
      if (errors) setFieldErrors(errors);
      toast("error", error || "Failed to save changes.");
    }
    setSaving(false);
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Profile Information
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary-700">
              {initials}
            </span>
          </div>
          <div>
            <button
              type="button"
              className="text-sm text-primary-500 hover:text-primary-700 font-medium"
            >
              Change avatar
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG. Max 2MB.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              fieldErrors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-primary-500"
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-primary-500"
            }`}
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Changing your email will require re-verification.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Password Tab ───────────────────────────────────────────────────────────

function PasswordTab() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const strengthScore = getStrengthScore(newPassword);
  const strength = getStrengthLabel(strengthScore);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    strengthScore === 4 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFieldErrors({});
    setSaving(true);

    const { error, errors, data } = await apiFetch<{ success: boolean }>(
      "/api/settings/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      }
    );

    if (data?.success) {
      toast("success", "Password changed. Other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      if (errors) setFieldErrors(errors);
      toast("error", error || "Failed to change password.");
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Change Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={`w-full h-10 px-3 pr-10 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                fieldErrors.currentPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.currentPassword[0]}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={`w-full h-10 px-3 pr-10 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                fieldErrors.newPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.newPassword[0]}
            </p>
          )}

          {/* Strength Indicator */}
          {newPassword.length > 0 && (
            <div className="mt-3">
              {/* Bar */}
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strengthScore ? strength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs font-medium ${
                  strengthScore <= 1
                    ? "text-red-600"
                    : strengthScore <= 2
                      ? "text-amber-600"
                      : strengthScore <= 3
                        ? "text-yellow-600"
                        : "text-green-600"
                }`}
              >
                {strength.text}
              </p>

              {/* Checklist */}
              <ul className="mt-2 space-y-1">
                {strengthChecks.map((check) => {
                  const passes = check.test(newPassword);
                  return (
                    <li
                      key={check.label}
                      className={`flex items-center gap-1.5 text-xs ${
                        passes ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {passes ? <Check size={12} /> : <X size={12} />}
                      {check.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={`w-full h-10 px-3 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              confirmPassword.length > 0 && !passwordsMatch
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : fieldErrors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary-500"
            }`}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-600">
              Passwords do not match.
            </p>
          )}
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm text-amber-700">
            Changing your password will sign you out of all other devices.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Danger Zone Tab ────────────────────────────────────────────────────────

function DangerZoneTab({ onDeleted }: { onDeleted: () => void }) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [cascadeCounts, setCascadeCounts] = useState<{
    clients: number;
    projects: number;
    tasks: number;
    timeEntries: number;
  } | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  async function loadCascadeCounts() {
    setLoadingCounts(true);
    // Gather counts client-side from existing endpoints
    const [clients, projects, tasks, timeEntries] = await Promise.all([
      apiFetch<{ totalCount: number }>("/api/clients?limit=1"),
      apiFetch<{ totalCount: number }>("/api/projects?limit=1"),
      apiFetch<{ totalCount: number }>("/api/tasks?limit=1"),
      apiFetch<{ totalCount: number }>("/api/time-entries?limit=1"),
    ]);
    setCascadeCounts({
      clients: clients.data?.totalCount ?? 0,
      projects: projects.data?.totalCount ?? 0,
      tasks: tasks.data?.totalCount ?? 0,
      timeEntries: timeEntries.data?.totalCount ?? 0,
    });
    setLoadingCounts(false);
  }

  function openDeleteDialog() {
    setShowDeleteDialog(true);
    setDeletePassword("");
    setDeleteError("");
    loadCascadeCounts();
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleteError("");
    setDeleting(true);

    const { data, error } = await apiFetch<{ success: boolean }>(
      "/api/settings/delete-account",
      {
        method: "POST",
        body: JSON.stringify({ password: deletePassword }),
      }
    );

    if (data?.success) {
      toast(
        "info",
        "Account scheduled for deletion. You have been signed out."
      );
      onDeleted();
    } else {
      setDeleteError(error || "Failed to delete account.");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          Danger Zone
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Irreversible actions. Please proceed with caution.
        </p>

        <div className="space-y-6">
          {/* Export Data */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Export all data
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Download a copy of all your clients, projects, tasks, time
                entries, and invoices.
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
              Export
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-700">Delete account</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <button
              onClick={openDeleteDialog}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 flex-shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !deleting && setShowDeleteDialog(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <button
              onClick={() => !deleting && setShowDeleteDialog(false)}
              disabled={deleting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete your account?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  This will schedule your account and all data for permanent
                  deletion in 30 days. You will be immediately logged out and
                  cannot log back in.
                </p>

                {/* Cascade counts */}
                {loadingCounts ? (
                  <div className="mt-3 space-y-1">
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                ) : (
                  cascadeCounts && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-md p-3">
                      <p className="text-xs font-medium text-red-700 mb-1">
                        The following data will be deleted:
                      </p>
                      <ul className="text-xs text-red-600 space-y-0.5">
                        <li>
                          {cascadeCounts.clients} client
                          {cascadeCounts.clients !== 1 ? "s" : ""}
                        </li>
                        <li>
                          {cascadeCounts.projects} project
                          {cascadeCounts.projects !== 1 ? "s" : ""}
                        </li>
                        <li>
                          {cascadeCounts.tasks} task
                          {cascadeCounts.tasks !== 1 ? "s" : ""}
                        </li>
                        <li>
                          {cascadeCounts.timeEntries} time entr
                          {cascadeCounts.timeEntries !== 1 ? "ies" : "y"}
                        </li>
                      </ul>
                    </div>
                  )
                )}

                {/* Password confirmation */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    disabled={deleting}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-red-500 focus:ring-red-200"
                  />
                  {deleteError && (
                    <p className="mt-1 text-xs text-red-600">{deleteError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deletePassword.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting
                  ? "Deleting..."
                  : "Permanently Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications Tab (unchanged – still presentation-only) ────────────────

function NotificationsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Notification Preferences
      </h2>
      <div className="space-y-6">
        {/* Notification Channels */}
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Notification Channels
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Email notifications
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  In-app notifications
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Show notifications in the sidebar bell
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        {[
          {
            label: "Deadline reminders",
            description:
              "Get notified when task or project deadlines are approaching",
            defaultOn: true,
          },
          {
            label: "Budget alerts",
            description:
              "Alert when a project reaches 80% of its budget",
            defaultOn: true,
          },
          {
            label: "Overdue invoice reminders",
            description:
              "Remind when invoices pass their due date",
            defaultOn: true,
          },
          {
            label: "Weekly time tracking summary",
            description:
              "Receive a summary of your tracked hours each week",
            defaultOn: false,
          },
        ].map((setting) => (
          <div
            key={setting.label}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">
                {setting.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {setting.description}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                defaultChecked={setting.defaultOn}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500" />
            </label>
          </div>
        ))}

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Reminder Timing
          </h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Send deadline reminders
            </label>
            <select className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
              <option>1 day before</option>
              <option>2 days before</option>
              <option>3 days before</option>
              <option>1 week before</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Business Tab (unchanged – still presentation-only) ─────────────────────

function BusinessTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Business Profile
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This information appears on your invoices.
      </p>
      <form className="space-y-5">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
              <Upload size={20} />
              <span className="text-[10px] mt-1">Logo</span>
            </div>
            <div>
              <button
                type="button"
                className="text-sm text-primary-500 hover:text-primary-700 font-medium"
              >
                Upload logo
              </button>
              <p className="text-xs text-gray-400 mt-0.5">
                PNG, SVG. Max 1MB. Appears on invoices.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business Name
          </label>
          <input
            type="text"
            defaultValue="Fletcher Design Co."
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address
          </label>
          <textarea
            defaultValue={"142 Maple Street, Suite 3B\nBrooklyn, NY 11201"}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-vertical"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Default Tax Rate (%)
            </label>
            <input
              type="text"
              defaultValue="8.875"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Currency
            </label>
            <select className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Invoice Prefix
            </label>
            <input
              type="text"
              defaultValue="INV-"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Next Invoice Number
            </label>
            <input
              type="text"
              defaultValue="042"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Instructions
          </label>
          <textarea
            defaultValue={
              "Wire transfer: Chase Bank\nRouting: 021000021\nAccount: ****4589\n\nOr pay via PayPal: sarah@fletcherdesign.co"
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-vertical"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
            Save Business Profile
          </button>
        </div>
      </form>
    </div>
  );
}
