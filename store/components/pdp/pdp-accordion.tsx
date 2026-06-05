"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Section = { title: string; content: string };

const SECTIONS: Section[] = [
  {
    title: "Overview",
    content:
      "This is an officially licensed replica jersey crafted for passionate fans. Designed with breathable performance fabric, it delivers comfort both on and off the pitch. Features include the club crest, sponsor logo, and season-specific detailing.",
  },
  {
    title: "Material & Fabric",
    content:
      "100% recycled polyester with moisture-wicking DryFit technology. Lightweight mesh panels for ventilation. The fabric is pre-shrunk and colourfast — vibrant washes after repeated washes.",
  },
  {
    title: "Care Instructions",
    content:
      "Machine wash cold (30°C) with similar colours. Do not bleach. Tumble dry on low heat. Do not iron directly on print or crest. Do not dry clean.",
  },
  {
    title: "Shipping & Returns",
    content:
      "Ships within 24 hours. Standard delivery: 3–5 business days. Express delivery: 1–2 business days. Free returns within 7 days of delivery — no questions asked. Refund processed in 3–5 business days.",
  },
];

function AccordionItem({ section, defaultOpen }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-[#F0F0F0] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span
          className="text-[14px] font-bold text-[#0D0D0D]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}
        >
          {section.title}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-250", open && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-[13px] text-[#555] leading-relaxed">{section.content}</p>
      </div>
    </div>
  );
}

export function PDPAccordion({ description }: { description?: string }) {
  const sections = description
    ? [{ title: "Overview", content: description }, ...SECTIONS.slice(1)]
    : SECTIONS;
  return (
    <div className="rounded-2xl border border-[#F0F0F0] px-5 py-1">
      {sections.map((s, i) => (
        <AccordionItem key={s.title} section={s} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
