import Link from "next/link";

type Props = {
  type?: "network" | "server" | "notfound" | "empty";
  headline?: string;
  subtext?: string;
  onRetry?: () => void;
};

const DEFAULTS = {
  network: {
    icon: "⚠️",
    headline: "Connection Lost",
    subtext: "We couldn't connect to our servers. Check your connection and try again.",
  },
  server: {
    icon: "⚡",
    headline: "Something Went Offside",
    subtext: "Our team has been notified. Try refreshing the page.",
  },
  notfound: {
    icon: "🔍",
    headline: "Not Found",
    subtext: "We couldn't find what you're looking for.",
  },
  empty: {
    icon: "📭",
    headline: "Nothing Here Yet",
    subtext: "This section is empty right now.",
  },
};

export function ErrorState({ type = "server", headline, subtext, onRetry }: Props) {
  const d = DEFAULTS[type];
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center rounded-2xl border border-[#F0F0F0] bg-white">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        style={{ background: "rgba(245,197,24,0.10)" }}
      >
        {d.icon}
      </div>
      <div>
        <h3
          className="font-black text-[#0D0D0D] mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px" }}
        >
          {headline ?? d.headline}
        </h3>
        <p className="text-[13px] text-[#888] max-w-xs leading-relaxed">
          {subtext ?? d.subtext}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="h-10 px-6 rounded-full font-bold text-[13px] text-[#0D0D0D] bg-[#F5C518] hover:brightness-105 transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
          >
            Retry
          </button>
        )}
        <Link
          href="/"
          className="h-10 px-6 rounded-full font-bold text-[13px] text-[#0D0D0D] border-2 border-[#E0E0E0] hover:border-[#0D0D0D] transition-all inline-flex items-center"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
