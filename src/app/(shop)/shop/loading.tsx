import { Skeleton } from "@/components/ui/skeleton";

/** Shop loading state — skeleton grid shown while the catalog query resolves. */
export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <Skeleton className="h-9 w-48" />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-9 w-full sm:w-52" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
