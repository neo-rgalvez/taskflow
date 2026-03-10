import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-4 w-48 mt-2 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={4} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
