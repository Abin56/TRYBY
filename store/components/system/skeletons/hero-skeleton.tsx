export function HeroSkeleton() {
  return (
    <div className="relative w-full bg-white overflow-hidden animate-pulse" style={{ minHeight: "420px" }}>
      {/* Mobile */}
      <div className="md:hidden flex flex-col">
        <div className="w-full bg-[#E8E8E8]" style={{ height: "240px" }} />
        <div className="px-5 py-6 space-y-4">
          <div className="h-6 w-36 rounded-full bg-[#E8E8E8]" />
          <div className="h-12 w-4/5 rounded bg-[#E8E8E8]" />
          <div className="h-12 w-3/5 rounded bg-[#E8E8E8]" />
          <div className="h-4 w-64 rounded bg-[#E8E8E8]" />
          <div className="flex gap-3">
            <div className="h-12 w-32 rounded-full bg-[#E8E8E8]" />
            <div className="h-12 w-32 rounded-full bg-[#E8E8E8]" />
          </div>
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:flex h-full" style={{ minHeight: "420px" }}>
        <div className="flex flex-col justify-center gap-4 pl-14 py-12 w-[40%]">
          <div className="h-6 w-36 rounded-full bg-[#E8E8E8]" />
          <div className="h-14 w-4/5 rounded bg-[#E8E8E8]" />
          <div className="h-14 w-3/5 rounded bg-[#E8E8E8]" />
          <div className="h-4 w-52 rounded bg-[#E8E8E8]" />
          <div className="flex gap-3">
            <div className="h-12 w-32 rounded-full bg-[#E8E8E8]" />
            <div className="h-12 w-32 rounded-full bg-[#E8E8E8]" />
          </div>
        </div>
        <div className="flex-1 bg-[#F0F0F0]" />
      </div>
    </div>
  );
}
