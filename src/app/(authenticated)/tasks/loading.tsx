import { Skeleton, TaskCardSkeleton } from "@/components/ui/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-4 w-48 mt-2 rounded" />
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
