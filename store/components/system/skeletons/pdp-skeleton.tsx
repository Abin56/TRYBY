export function PDPSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-pulse">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 w-12 rounded bg-[#E8E8E8]" />
          <div className="h-3 w-3 rounded bg-[#E8E8E8]" />
          <div className="h-3 w-16 rounded bg-[#E8E8E8]" />
          <div className="h-3 w-3 rounded bg-[#E8E8E8]" />
          <div className="h-3 w-32 rounded bg-[#E8E8E8]" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="w-full lg:w-[55%] shrink-0">
            <div className="flex gap-3">
              <div className="hidden md:flex flex-col gap-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-20 h-20 rounded-xl bg-[#E8E8E8]" />
                ))}
              </div>
              <div className="flex-1 aspect-square rounded-2xl bg-[#E8E8E8]" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="h-5 w-24 rounded-full bg-[#E8E8E8]" />
            <div className="h-8 w-4/5 rounded bg-[#E8E8E8]" />
            <div className="h-8 w-2/3 rounded bg-[#E8E8E8]" />
            <div className="h-4 w-32 rounded bg-[#E8E8E8]" />
            <div className="h-10 w-40 rounded bg-[#E8E8E8]" />
            <div className="h-px bg-[#F0F0F0]" />
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-10 w-12 rounded-xl bg-[#E8E8E8]" />
              ))}
            </div>
            <div className="flex gap-3">
              <div className="h-12 flex-1 rounded-full bg-[#E8E8E8]" />
              <div className="h-12 flex-1 rounded-full bg-[#E8E8E8]" />
              <div className="h-12 w-12 rounded-full bg-[#E8E8E8]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
