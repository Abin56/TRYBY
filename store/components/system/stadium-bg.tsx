/* Reusable dark stadium atmosphere background — use as a full-screen wrapper */
export function StadiumBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#080808" }}>

      {/* Stadium spotlight 1 — top left */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(245,197,24,0.35) 0%, transparent 65%)", filter: "blur(60px)" }}
        aria-hidden="true"
      />
      {/* Stadium spotlight 2 — top right */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(245,197,24,0.25) 0%, transparent 65%)", filter: "blur(80px)" }}
        aria-hidden="true"
      />
      {/* Bottom glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, rgba(245,197,24,0.3) 0%, transparent 70%)", filter: "blur(80px)" }}
        aria-hidden="true"
      />
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
