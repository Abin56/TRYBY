"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Heart } from "lucide-react";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const POSTS = [
  {
    id: "ig1",
    image: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=300&h=300&fit=crop",
    likes: 1247,
    caption: "Cricket season ready 🏏🔥 #TRYBY",
    handle: "@arjun.plays",
  },
  {
    id: "ig2",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=300&fit=crop",
    likes: 892,
    caption: "Match day kit sorted ⚽ #TRYBYSports",
    handle: "@rahul.fc",
  },
  {
    id: "ig3",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop",
    likes: 2103,
    caption: "Gym gains incoming 💪 @trybysports",
    handle: "@priya.fit",
  },
  {
    id: "ig4",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=300&fit=crop",
    likes: 673,
    caption: "Morning run, fresh kicks 🏃‍♂️ #TRYBY",
    handle: "@vikram.runs",
  },
  {
    id: "ig5",
    image: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=300&h=300&fit=crop",
    likes: 1589,
    caption: "Team colours on point 🏏🎉 #RCB",
    handle: "@meena.cricket",
  },
  {
    id: "ig6",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=300&fit=crop",
    likes: 3241,
    caption: "Blue is the colour ⚽💙 #TRYBY",
    handle: "@aditya.kicks",
  },
  {
    id: "ig7",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop",
    likes: 445,
    caption: "Post-workout ritual 🥤 @trybysports",
    handle: "@kavya.gym",
  },
  {
    id: "ig8",
    image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3b972?w=300&h=300&fit=crop",
    likes: 2876,
    caption: "New season, new jersey 🔴🔵 #Barça",
    handle: "@rohit.football",
  },
];

function InstagramPost({ post, index }: { post: typeof POSTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
      className="relative shrink-0 w-[200px] sm:w-[220px] aspect-square rounded-2xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={post.image}
        alt={post.caption}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />

      {/* Hover overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#111827]/70 flex flex-col items-center justify-center gap-2 p-3"
      >
        <div className="flex items-center gap-1.5 text-white">
          <Heart className="h-4 w-4" fill="white" />
          <span className="text-sm font-bold">{post.likes.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-white/90 text-xs text-center leading-snug line-clamp-2">{post.caption}</p>
        <p className="text-white/60 text-[10px]">{post.handle}</p>
      </motion.div>
    </motion.div>
  );
}

export function InstagramCommunitySection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-white" aria-labelledby="instagram-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="sport-label text-xs text-[#FF3B30] mb-2">#TRYBYSPORTS</p>
            <h2
              id="instagram-heading"
              className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827]"
            >
              Join the Community.
            </h2>
          </div>
          <a
            href="https://instagram.com/trybysports"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 h-10 px-5 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold text-[#374151] hover:border-[#FF3B30] hover:text-[#FF3B30] transition-all duration-200"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
          >
            <IconInstagram className="h-4 w-4" />
            FOLLOW @TRYBYSPORTS
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      </div>

      {/* Horizontal scroll grid */}
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        aria-label="Instagram community photos"
        role="list"
      >
        {POSTS.map((post, i) => (
          <div key={post.id} role="listitem">
            <InstagramPost post={post} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
