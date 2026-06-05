export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#F5F5F5] animate-pulse">
      <div className="aspect-square bg-[#E8E8E8]" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-16 rounded bg-[#E0E0E0]" />
        <div className="h-3.5 w-full rounded bg-[#E0E0E0]" />
        <div className="h-3.5 w-3/4 rounded bg-[#E0E0E0]" />
        <div className="h-3 w-20 rounded bg-[#E0E0E0]" />
        <div className="h-4 w-24 rounded bg-[#E0E0E0]" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TrendingCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#F5F5F5] shrink-0 animate-pulse" style={{ width: "168px" }}>
      <div className="bg-[#E8E8E8]" style={{ aspectRatio: "1/1" }} />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 w-full rounded bg-[#E0E0E0]" />
        <div className="h-3 w-3/4 rounded bg-[#E0E0E0]" />
        <div className="h-2.5 w-16 rounded bg-[#E0E0E0]" />
        <div className="h-3.5 w-20 rounded bg-[#E0E0E0]" />
      </div>
    </div>
  );
}
