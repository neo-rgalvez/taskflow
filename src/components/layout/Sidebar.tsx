"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useTimer, formatElapsed } from "@/components/ui/TimerContext";
import {
  LayoutDashboard,
  Sun,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Play,
  Menu,
  X,
  Home,
  MoreHorizontal,
  LogOut,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const bottomItems = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Style guide 2.6: mobile bottom nav = Home, Tasks, Timer, Invoices, More
const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/time", label: "Timer", icon: Clock, hasTimerDot: true as boolean },
  { href: "/invoices", label: "Invoices", icon: FileText },
];

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "deadline_reminder":
      return <Calendar size={14} className="text-amber-500" />;
    case "budget_alert":
      return <AlertTriangle size={14} className="text-amber-500" />;
    case "overdue_invoice":
      return <FileText size={14} className="text-red-500" />;
    case "time_tracking_reminder":
      return <Clock size={14} className="text-blue-500" />;
    default:
      return <Bell size={14} className="text-gray-400" />;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SidebarTimerWidget({ collapsed }: { collapsed: boolean }) {
  const { isActive, isRunning, elapsedSeconds, task } = useTimer();
  if (!isActive || collapsed) return null;
  return (
    <div className="mt-3 bg-primary-50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-primary-700">
        {isRunning ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
          </span>
        )}
        <Play size={14} />
        <span className="font-mono text-sm font-semibold">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
      {task && (
        <p className="text-xs text-primary-600 mt-1 truncate">
          {task.title}
        </p>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isActive: timerIsActive } = useTimer();

  const loadNotifications = useCallback(() => {
    apiFetch<{ items: NotificationItem[]; unreadCount: number }>(
      "/api/notifications?limit=10"
    ).then(({ data }) => {
      if (data) {
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      }
    });
  }, []);

  useEffect(() => {
    apiFetch<{ name: string }>("/api/settings/account").then(({ data }) => {
      if (data?.name) {
        setUserName(data.name);
      }
    });
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications when panel is opened
  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, loadNotifications]);

  async function handleMarkAllRead() {
    const { data } = await apiFetch<{ success: boolean }>(
      "/api/notifications/mark-all-read",
      { method: "POST" }
    );
    if (data?.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }

  async function handleMarkRead(id: string) {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">TaskFlow</span>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 space-y-1 flex-shrink-0">
          <div className="border-t border-gray-200 dark:border-gray-700 mb-3" />

          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title={collapsed ? "Notifications" : undefined}
            >
              <div className="relative flex-shrink-0">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span>Notifications</span>}
            </button>

            {/* Notification Panel */}
            {showNotifications && !collapsed && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 max-h-[480px] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary-500 hover:text-primary-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-400">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${n.isRead ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead ? (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                        ) : (
                          <span className="mt-1.5 w-2 h-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {getNotificationIcon(n.type)}
                              <p className="text-sm font-medium text-gray-800">{n.title}</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 text-center">
                    <Link
                      href="/settings"
                      onClick={() => setShowNotifications(false)}
                      className="text-sm text-primary-500 hover:text-primary-700"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Timer */}
          <SidebarTimerWidget collapsed={collapsed} />

          {/* User */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
            <div className="flex items-center gap-3 px-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-700">{userName ? getInitials(userName) : ""}</span>
              </div>
              {!collapsed && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">
                  {userName}
                </span>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={handleLogout}
                title="Log out"
                className="w-full flex items-center justify-center px-3 py-2 mt-1 rounded-md text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-2"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation — per Style Guide 2.6: Home, Tasks, Timer, Invoices, More */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${
                  isActive ? "text-primary-500" : "text-gray-400"
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {item.hasTimerDot && timerIsActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${mobileMoreOpen ? "text-primary-500" : "text-gray-400"}`}
          >
            {mobileMoreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Menu Overlay */}
      {mobileMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-white" style={{ bottom: "56px" }}>
          <div className="px-4 py-6 space-y-1 overflow-y-auto h-full">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">All Pages</p>
            {[...navItems, ...bottomItems].map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                    isActive ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
              <button
                onClick={() => { setMobileMoreOpen(false); handleLogout(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 w-full"
              >
                <LogOut size={20} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUnreadCount, setMobileUnreadCount] = useState(0);

  useEffect(() => {
    apiFetch<{ unreadCount: number }>("/api/notifications?limit=1").then(
      ({ data }) => {
        if (data) setMobileUnreadCount(data.unreadCount);
      }
    );
  }, []);

  const allItems = [
    ...navItems,
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">TF</span>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">TaskFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/tasks" className="p-2 text-gray-400 hover:text-gray-600">
            <Search size={20} />
          </Link>
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell size={20} />
            {mobileUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-error text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {mobileUnreadCount > 99 ? "99+" : mobileUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-14">
          <nav className="px-4 py-6 space-y-1">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                    isActive ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
