// Status labels and colors used across the application

export const statusLabels: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  todo: "To Do",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  review: "Review",
  done: "Done",
  draft: "Draft",
  sent: "Sent",
  overdue: "Overdue",
  partial: "Partial",
  paid: "Paid",
  archived: "Archived",
};

export const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  on_hold: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  cancelled: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
  todo: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  waiting_on_client: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  review: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  done: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  draft: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  partial: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  archived: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
};
