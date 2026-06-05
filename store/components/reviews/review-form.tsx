"use client";

import { useState, useCallback, useRef } from "react";
import { Star, Upload, X, CheckCircle2, Loader2, Image as ImageIcon, Video, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface ReviewFormProps {
  productId:    string;
  productName:  string;
  orderItemId?: string;
  onSubmitted?: () => void;
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function ReviewForm({ productId, productName, orderItemId, onSubmitted }: ReviewFormProps) {
  const [rating,     setRating]    = useState(0);
  const [hover,      setHover]     = useState(0);
  const [title,      setTitle]     = useState("");
  const [body,       setBody]      = useState("");
  const [imageUrls,  setImageUrls] = useState<string[]>([]);
  const [videoUrls,  setVideoUrls] = useState<string[]>([]);
  const [uploading,  setUploading] = useState<"image" | "video" | null>(null);
  const [loading,    setLoading]   = useState(false);
  const [success,    setSuccess]   = useState(false);
  const [error,      setError]     = useState("");

  const imgInputRef   = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Upload to Cloudinary via existing /api/upload endpoint
  const uploadFile = useCallback(async (file: File, type: "image" | "video") => {
    setUploading(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "reviews");
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return data.url as string;
    } finally {
      setUploading(null);
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (imageUrls.length + files.length > 8) { setError("Maximum 8 images allowed"); return; }
    setError("");
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { setError("Each image must be under 10 MB"); continue; }
      const url = await uploadFile(file, "image");
      if (url) setImageUrls(prev => [...prev, url]);
    }
    e.target.value = "";
  }, [imageUrls.length, uploadFile]);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrls.length >= 2) { setError("Maximum 2 videos allowed"); return; }
    if (file.size > 50 * 1024 * 1024) { setError("Video must be under 50 MB"); return; }
    setError("");
    const url = await uploadFile(file, "video");
    if (url) setVideoUrls(prev => [...prev, url]);
    e.target.value = "";
  }, [videoUrls.length, uploadFile]);

  const submit = useCallback(async () => {
    if (!rating)             { setError("Please select a star rating"); return; }
    if (body.trim().length < 10) { setError("Review must be at least 10 characters"); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productId, orderItemId, rating,
          title:     title.trim() || undefined,
          body:      body.trim(),
          imageUrls,
          videoUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuccess(true);
      onSubmitted?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [productId, orderItemId, rating, title, body, imageUrls, videoUrls, onSubmitted]);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-10 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-[#22C55E] mb-4" />
        <h3 className="text-[18px] font-black text-[#0D0D0D] mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Review Submitted!
        </h3>
        <p className="text-[13px] text-[#9CA3AF]">
          Thank you — your review will appear after moderation (usually within 24 hours).
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Verified purchase banner */}
      {orderItemId && (
        <div className="flex items-center gap-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
          <p className="text-[12px] font-semibold text-[#15803D]">Verified Purchase — your review will be marked verified</p>
        </div>
      )}

      {/* Star rating */}
      <div>
        <p className="text-[12px] font-bold text-[#0D0D0D] mb-2 uppercase tracking-wide">Your Rating *</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
            >
              <Star
                className="h-8 w-8 transition-colors duration-100"
                fill={(hover || rating) >= s ? "#F5C518" : "none"}
                stroke={(hover || rating) >= s ? "#F5C518" : "#D1D5DB"}
                strokeWidth={1.5}
              />
            </button>
          ))}
          {(hover || rating) > 0 && (
            <span className="ml-2 text-[13px] font-semibold text-[#555]">
              {LABELS[hover || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[12px] font-bold text-[#0D0D0D] mb-1.5 uppercase tracking-wide">
          Review Title
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={100}
          className="w-full h-10 rounded-xl border border-[#E0E0E0] bg-white px-4 text-[13px] text-[#0D0D0D] placeholder:text-[#C0C0C0] outline-none focus:border-[#0D0D0D] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] transition-all"
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-bold text-[#0D0D0D] uppercase tracking-wide">Your Review *</label>
          <span className={cn("text-[11px] font-medium", body.length > 1800 ? "text-[#DC2626]" : "text-[#9CA3AF]")}>
            {body.length}/2000
          </span>
        </div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={`What did you think of ${productName}? Quality, fit, sizing, delivery…`}
          className="w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-[13px] text-[#0D0D0D] placeholder:text-[#C0C0C0] outline-none focus:border-[#0D0D0D] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] resize-none transition-all"
        />
      </div>

      {/* Media uploads */}
      <div>
        <p className="text-[12px] font-bold text-[#0D0D0D] mb-3 uppercase tracking-wide">Add Photos &amp; Videos</p>

        {/* Image grid */}
        <div className="flex flex-wrap gap-2 mb-3">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover border border-[#E0E0E0]" />
              <button
                onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0D0D0D] text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {imageUrls.length < 8 && (
            <button
              onClick={() => imgInputRef.current?.click()}
              disabled={uploading === "image"}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E0E0E0] text-[#9CA3AF] hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-all disabled:opacity-50"
            >
              {uploading === "image" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              <span className="text-[9px] mt-0.5 font-medium">Photo</span>
            </button>
          )}
          {videoUrls.length < 2 && (
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading === "video"}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E0E0E0] text-[#9CA3AF] hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-all disabled:opacity-50"
            >
              {uploading === "video" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
              <span className="text-[9px] mt-0.5 font-medium">Video</span>
            </button>
          )}
        </div>

        {/* Video thumbnails */}
        {videoUrls.length > 0 && (
          <div className="flex gap-2 mb-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="relative group flex h-16 w-16 items-center justify-center rounded-xl bg-[#0D0D0D] overflow-hidden">
                <Video className="h-6 w-6 text-white" />
                <button
                  onClick={() => setVideoUrls(p => p.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-[#9CA3AF]">Up to 8 photos (max 10 MB each) · Up to 2 videos (max 50 MB each)</p>
      </div>

      <input ref={imgInputRef}   type="file" accept="image/*"              multiple className="hidden" onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden"          onChange={handleVideoUpload} />

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-[#DC2626] font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || !rating || !!uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-black text-[14px] transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: "#0D0D0D", color: "#FFFFFF", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "SUBMITTING…" : "SUBMIT REVIEW"}
      </button>
    </div>
  );
}
