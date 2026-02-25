"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertTriangle, User, Lock, Bell, Building } from "lucide-react";

type Tab = "profile" | "password" | "notifications" | "business" | "danger";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showSkeleton, setShowSkeleton] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "business", label: "Business", icon: Building },
    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {showSkeleton ? "Show Data" : "Skeleton"}
        </button>
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
          {showSkeleton ? (
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
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <form className="space-y-5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-700">SF</span>
                      </div>
                      <div>
                        <button className="text-sm text-primary-500 hover:text-primary-700 font-medium">
                          Change avatar
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG. Max 2MB.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        defaultValue="Sarah Fletcher"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        defaultValue="sarah@fletcherdesign.co"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                      <p className="mt-1 text-xs text-gray-400">Changing your email will require re-verification.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                      <select className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200">
                        <option>America/New_York (EST)</option>
                        <option>America/Chicago (CST)</option>
                        <option>America/Denver (MST)</option>
                        <option>America/Los_Angeles (PST)</option>
                        <option>Europe/London (GMT)</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                  <form className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                      <p className="mt-1 text-xs text-gray-400">At least 8 characters with uppercase, lowercase, and a number.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-sm text-amber-700">
                        Changing your password will sign you out of all other devices.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    {[
                      { label: "Deadline reminders", description: "Get notified when task or project deadlines are approaching", defaultOn: true },
                      { label: "Budget alerts", description: "Alert when a project reaches 80% of its budget", defaultOn: true },
                      { label: "Overdue invoice reminders", description: "Remind when invoices pass their due date", defaultOn: true },
                      { label: "Weekly time tracking summary", description: "Receive a summary of your tracked hours each week", defaultOn: false },
                    ].map((setting) => (
                      <div key={setting.label} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{setting.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input type="checkbox" defaultChecked={setting.defaultOn} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500" />
                        </label>
                      </div>
                    ))}

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Reminder Timing</h3>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Send deadline reminders</label>
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
              )}

              {/* Business Tab */}
              {activeTab === "business" && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Profile</h2>
                  <p className="text-sm text-gray-500 mb-6">This information appears on your invoices.</p>
                  <form className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                      <input
                        type="text"
                        defaultValue="Fletcher Design Co."
                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                      <textarea
                        defaultValue={"142 Maple Street, Suite 3B\nBrooklyn, NY 11201"}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200 resize-vertical"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Tax Rate (%)</label>
                        <input
                          type="text"
                          defaultValue="8.875"
                          className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Prefix</label>
                        <input
                          type="text"
                          defaultValue="INV-"
                          className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Invoice Number</label>
                        <input
                          type="text"
                          defaultValue="042"
                          className="w-full h-10 px-3 border border-gray-300 rounded-md text-base font-mono focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Instructions</label>
                      <textarea
                        defaultValue={"Wire transfer: Chase Bank\nRouting: 021000021\nAccount: ****4589\n\nOr pay via PayPal: sarah@fletcherdesign.co"}
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
              )}

              {/* Danger Zone Tab */}
              {activeTab === "danger" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-500" />
                      Danger Zone
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">Irreversible actions. Please proceed with caution.</p>

                    <div className="space-y-6">
                      {/* Export Data */}
                      <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Export all data</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Download a copy of all your clients, projects, tasks, time entries, and invoices.
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
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 flex-shrink-0">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
