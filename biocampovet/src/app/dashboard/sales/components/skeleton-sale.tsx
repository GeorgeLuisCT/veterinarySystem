import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonSale() {
  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-36" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-6 gap-2">
          <Skeleton className="h-6 col-span-1" />
          <Skeleton className="h-6 col-span-1" />
          <Skeleton className="h-6 col-span-2" />
          <Skeleton className="h-6 col-span-1" />
          <Skeleton className="h-6 col-span-1" />
        </div>
        <div className="h-[100px]">
          <Skeleton className="h-full w-full" />
        </div>
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
