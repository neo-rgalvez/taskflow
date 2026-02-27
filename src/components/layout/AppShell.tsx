"use client";

import { Sidebar, MobileHeader } from "./Sidebar";
import { Pause, Square, X } from "lucide-react";

function ActiveTimerBar() {
  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 lg:left-60 z-[35] bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="font-mono text-sm font-semibold">01:23:45</span>
          <span className="text-primary-200 hidden sm:inline">|</span>
          <span className="text-sm text-primary-100 truncate hidden sm:inline">
            Build responsive navigation prototype
          </span>
          <span className="text-xs text-primary-200 truncate hidden sm:inline">
            — Patient Portal Redesign
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-1.5 rounded-md hover:bg-primary-500 transition-colors" title="Pause">
            <Pause size={16} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-primary-500 transition-colors" title="Stop">
            <Square size={16} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-primary-500 transition-colors" title="Discard">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileHeader />
      <main id="main-content" className="lg:pl-60 pb-28 lg:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <ActiveTimerBar />
    </div>
  );
}
