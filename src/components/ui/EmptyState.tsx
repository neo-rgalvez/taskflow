"use client";

import { FolderOpen, Clock, FileText, Users, CheckSquare, Calendar } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icons: Record<string, any> = {
  projects: FolderOpen,
  time: Clock,
  invoices: FileText,
  clients: Users,
  tasks: CheckSquare,
  calendar: Calendar,
  default: FolderOpen,
};

interface EmptyStateProps {
  icon?: string;
  headline: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon = "default", headline, description, ctaLabel, onCta }: EmptyStateProps) {
  const Icon = icons[icon] || icons.default;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{headline}</h3>
      <p className="text-sm text-gray-500 max-w-[360px] text-center mb-6">{description}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
