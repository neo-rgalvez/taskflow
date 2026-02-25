"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 h-[140px]">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-9 w-32 mt-4" />
      <Skeleton className="h-3 w-20 mt-3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-1.5 w-full rounded-full mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 border-l-[3px] border-l-gray-200">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-2/3 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-3 min-w-[300px]">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}
