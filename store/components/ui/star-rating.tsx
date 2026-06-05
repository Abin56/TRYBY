import { cn } from "@/lib/cn";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };

export function StarRating({ value, max = 5, size = "sm", className }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => {
    const filled = i < Math.floor(value);
    const partial = !filled && i < value;
    const percent = partial ? Math.round((value - Math.floor(value)) * 100) : 0;

    return (
      <span key={i} className="relative inline-block" style={{ color: "#FBBF24" }}>
        {/* Background star */}
        <svg className={cn(sizeMap[size], "text-[#374151]")} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {/* Foreground star (filled or partial) */}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: filled ? "100%" : `${percent}%` }}
        >
          <svg className={cn(sizeMap[size], "text-[#FBBF24]")} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      </span>
    );
  });

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {stars}
    </span>
  );
}
