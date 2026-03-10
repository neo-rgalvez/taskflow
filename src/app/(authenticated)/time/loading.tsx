import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function TimeLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40 rounded" />
          <Skeleton className="h-4 w-56 mt-2 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 mt-3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
