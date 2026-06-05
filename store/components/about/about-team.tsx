"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const team = [
  {
    name: "Arjun Mehta",
    role: "Co-Founder & CEO",
    bio: "Ex-Flipkart category manager. 8 years in sports retail. Built and sold a cricket equipment brand before TRYBY.",
    initials: "AM",
    gradient: "linear-gradient(135deg, #FF3B30 0%, #FF9800 100%)",
    sport: "Cricket",
  },
  {
    name: "Priya Nair",
    role: "Co-Founder & COO",
    bio: "Former operations lead at Nykaa. Obsessed with logistics, supplier relationships, and building systems that scale.",
    initials: "PN",
    gradient: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
    sport: "Marathon Runner",
  },
  {
    name: "Rohan Sharma",
    role: "Head of Supplier Partnerships",
    bio: "Spent 6 years in B2B sales at Decathlon India. Knows every major sports distributor in the country personally.",
    initials: "RS",
    gradient: "linear-gradient(135deg, #059669 0%, #00BCD4 100%)",
    sport: "Football",
  },
  {
    name: "Aisha Khan",
    role: "Head of Brand & Product",
    bio: "Designed product experiences at Nike India. Joined TRYBY to build the brand she always wanted as an athlete.",
    initials: "AK",
    gradient: "linear-gradient(135deg, #D97706 0%, #FFB800 100%)",
    sport: "Badminton",
  },
];

export function AboutTeam() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30] mb-3">
            The Team
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#111827] tracking-tight">
            Built by Athletes. Run by Operators.
          </h2>
          <p className="mt-4 text-base text-[#6B7280] max-w-2xl mx-auto">
            Our team combines deep sports passion with serious commerce and logistics
            expertise. We&apos;ve been on both sides of the transaction — as buyers who were
            frustrated, and as operators who knew how to fix it.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((person, i) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <div className="group rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,_0_4px_16px_rgba(0,0,0,0.06)] card-lift h-full flex flex-col">
                {/* Avatar */}
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-5 shadow-md"
                  style={{ background: person.gradient }}
                >
                  {person.initials}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-base font-bold text-[#111827]">{person.name}</h3>
                    <a
                      href="#"
                      aria-label={`${person.name} profile`}
                      className="text-[#9CA3AF] hover:text-[#2563EB] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-xs font-semibold text-[#FF3B30] mb-3">{person.role}</p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{person.bio}</p>
                </div>

                {/* Sport tag */}
                <div className="mt-5 pt-4 border-t border-[#F3F4F6]">
                  <span className="text-xs text-[#9CA3AF]">Plays: </span>
                  <span className="text-xs font-semibold text-[#374151]">{person.sport}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
