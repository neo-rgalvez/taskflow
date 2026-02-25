"use client";

import { priorityColors } from "@/lib/mock-data";

export function PriorityBadge({ priority }: { priority: string }) {
  const colors = priorityColors[priority] || priorityColors.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {colors.label}
    </span>
  );
}
