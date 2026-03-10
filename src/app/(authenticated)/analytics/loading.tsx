import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-4 w-56 mt-2 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-5 w-40 mb-4 rounded" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-5 w-40 mb-4 rounded" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
