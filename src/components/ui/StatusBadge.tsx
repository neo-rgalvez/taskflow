"use client";

import { statusColors, statusLabels } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.active;
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
