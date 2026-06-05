import Link from "next/link";

type Btn = { label: string; href: string; primary?: boolean };

type Props = {
  illustration?: React.ReactNode;
  headline: string;
  subtext: string;
  buttons?: Btn[];
  children?: React.ReactNode;
};

export function EmptyState({ illustration, headline, subtext, buttons, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      {illustration && (
        <div className="mb-2">{illustration}</div>
      )}
      <div>
        <h2
          className="font-black text-[#0D0D0D] mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(22px, 4vw, 28px)", letterSpacing: "-0.01em" }}
        >
          {headline}
        </h2>
        <p className="text-[14px] text-[#888] max-w-xs mx-auto leading-relaxed">{subtext}</p>
      </div>
      {buttons && buttons.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {buttons.map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className={
                btn.primary
                  ? "inline-flex items-center justify-center h-11 px-7 rounded-full font-bold text-[14px] text-white bg-[#0D0D0D] hover:opacity-85 transition-opacity"
                  : "inline-flex items-center justify-center h-11 px-7 rounded-full font-bold text-[14px] text-[#0D0D0D] border-2 border-[#E0E0E0] hover:border-[#0D0D0D] transition-colors"
              }
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
