import { Skeleton } from "@/components/ui/Skeleton";

export default function AuthenticatedLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-64 mt-2 rounded" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-5 h-[120px]"
          >
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-32 mt-4 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton className="h-5 w-40 mb-4 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
