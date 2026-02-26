"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  { href: "/time", label: "Timer", icon: Clock, hasTimerDot: true },
  { href: "/invoices", label: "Invoices", icon: FileText },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return parts[0];
}

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = userName || "User";
  const initials = getInitials(displayName);
  const shortName = getShortName(displayName);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      // Even on error, redirect to login
      router.push("/login");
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-200 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-900">TaskFlow</span>
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
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
          <div className="border-t border-gray-200 mb-3" />

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
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title={collapsed ? "Notifications" : undefined}
            >
              <div className="relative flex-shrink-0">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              {!collapsed && <span>Notifications</span>}
            </button>

            {/* Notification Panel */}
            {showNotifications && !collapsed && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10 max-h-[480px] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <button className="text-xs text-primary-500 hover:text-primary-700">Mark all read</button>
                </div>
                {[
                  { unread: true, title: "Budget alert", body: "Patient Portal Redesign is at 66% of its hourly budget.", time: "2h ago", icon: "warning" },
                  { unread: true, title: "Deadline approaching", body: "Annual Report Design for Northstar Financial is due in 23 days.", time: "1d ago", icon: "calendar" },
                  { unread: false, title: "Invoice overdue", body: "INV-040 for Verde Landscape Architecture is past due.", time: "3d ago", icon: "invoice" },
                ].map((n, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${n.unread ? "" : "opacity-60"}`}>
                    <div className="flex items-start gap-2">
                      {n.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                      {!n.unread && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{n.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 text-center">
                  <button className="text-sm text-primary-500 hover:text-primary-700">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Active Timer */}
          {!collapsed && (
            <div className="mt-3 bg-primary-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                <Play size={14} />
                <span className="font-mono text-sm font-semibold">01:23:45</span>
              </div>
              <p className="text-xs text-primary-600 mt-1 truncate">
                Build responsive nav...
              </p>
            </div>
          )}

          {/* User + Sign Out */}
          <div className="border-t border-gray-200 mt-3 pt-3">
            <div className="flex items-center gap-3 px-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-700">{initials}</span>
              </div>
              {!collapsed && (
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {shortName}
                </span>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-[env(safe-area-inset-bottom)]">
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
                  {item.hasTimerDot && (
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
            <div className="border-t border-gray-200 mt-4 pt-4">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut size={20} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const allItems = [
    ...navItems,
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">TF</span>
          </div>
          <span className="text-base font-bold text-gray-900">TaskFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/tasks" className="p-2 text-gray-400 hover:text-gray-600">
            <Search size={20} />
          </Link>
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-error text-white text-[8px] font-bold rounded-full flex items-center justify-center">3</span>
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
            <div className="border-t border-gray-200 mt-4 pt-4">
              {userName && (
                <p className="px-4 py-2 text-sm text-gray-500">
                  Signed in as <span className="font-medium text-gray-700">{userName}</span>
                </p>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut size={20} />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
