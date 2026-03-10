import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-4 w-48 mt-2 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28 mt-3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={5} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
