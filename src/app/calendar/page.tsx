"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarEvents } from "@/lib/mock-data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(1); // February = 1 (0-indexed)
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date(2026, 1, 25); // Feb 25, 2026

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Deadlines, invoices, and milestones</p>
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
        </div>
      </div>

      {showEmpty ? (
        <EmptyState
          icon="time"
          headline="No events on the calendar"
          description="Your project deadlines and invoice due dates will appear here automatically."
          ctaLabel="View Projects"
          ctaHref="/projects"
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {showSkeleton ? (
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square p-1">
                    <Skeleton className="w-full h-full rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2 sm:p-5">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-t border-l border-gray-200">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 bg-gray-50" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const events = getEventsForDay(day);
                  const todayCell = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-1 ${
                        todayCell ? "bg-primary-50/50" : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                          todayCell
                            ? "bg-primary-500 text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-[10px] sm:text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: event.type === "invoice" ? "#FEF2F2" : `${event.color}15`,
                              color: event.type === "invoice" ? "#DC2626" : event.color,
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <p className="text-[10px] text-gray-400 pl-1">+{events.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty cells after last day */}
                {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
                  <div key={`end-${i}`} className="min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 bg-gray-50" />
                ))}
              </div>
            </div>
          )}

          {/* Event Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              Deadline
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Invoice Due
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Meeting
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
