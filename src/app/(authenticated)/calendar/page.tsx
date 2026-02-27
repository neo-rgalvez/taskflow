"use client";

import { useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "task" | "project";
  color: string;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  project: { id: string; name: string } | null;
}

interface ProjectItem {
  id: string;
  name: string;
  deadline: string | null;
  status: string;
}

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const [tasksResult, projectsResult] = await Promise.all([
      apiFetch<{ data: TaskItem[] }>(
        `/api/tasks?dueAfter=${monthStart.toISOString()}&dueBefore=${monthEnd.toISOString()}&limit=100`
      ),
      apiFetch<{ data: ProjectItem[] }>(
        `/api/projects?limit=100`
      ),
    ]);

    const calEvents: CalendarEvent[] = [];

    // Add task due dates
    if (tasksResult.data) {
      for (const task of tasksResult.data.data) {
        if (task.dueDate) {
          const dateStr = task.dueDate.split("T")[0];
          calEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            date: dateStr,
            type: "task",
            color: task.priority === "urgent" ? "#DC2626" : task.priority === "high" ? "#F97316" : "#6366F1",
          });
        }
      }
    }

    // Add project deadlines
    if (projectsResult.data) {
      for (const project of projectsResult.data.data) {
        if (project.deadline) {
          const dateStr = project.deadline.split("T")[0];
          const deadlineDate = new Date(dateStr);
          if (deadlineDate >= monthStart && deadlineDate <= monthEnd) {
            calEvents.push({
              id: `project-${project.id}`,
              title: `${project.name} deadline`,
              date: dateStr,
              type: "project",
              color: "#6366F1",
            });
          }
        }
      }
    }

    setEvents(calEvents);
    setLoading(false);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

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
    return events.filter((e) => e.date === dateStr);
  };

  const isToday = (day: number) => {
    return (
      now.getFullYear() === currentYear &&
      now.getMonth() === currentMonth &&
      now.getDate() === day
    );
  };

  const isEmpty = !loading && events.length === 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Deadlines, tasks, and milestones</p>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon="time"
          headline="No events on the calendar"
          description="Your task due dates and project deadlines will appear here automatically."
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

          {loading ? (
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
                  const dayEvents = getEventsForDay(day);
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
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-[10px] sm:text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: `${event.color}15`,
                              color: event.color,
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 2} more</p>
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
              Project Deadline
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Urgent Task
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              High Priority
            </div>
          </div>
        </div>
      )}
    </>
  );
}
