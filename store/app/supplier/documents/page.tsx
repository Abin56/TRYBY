"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  FileText, RefreshCw, Upload, CheckCircle2, XCircle,
  Clock, Trash2, ExternalLink, AlertCircle,
} from "lucide-react";

type SupplierDoc = {
  id: string;
  type: string;
  label: string | null;
  url: string;
  isVerified: boolean;
  verifiedAt: string | null;
  uploadedAt: string;
};

const DOC_TYPES = [
  { value: "GST_CERTIFICATE", label: "GST Certificate",  desc: "GSTIN registration certificate" },
  { value: "PAN_CARD",        label: "PAN Card",         desc: "Business or individual PAN" },
  { value: "BANK_STATEMENT",  label: "Bank Statement",   desc: "Latest 3-month statement" },
  { value: "ADDRESS_PROOF",   label: "Address Proof",    desc: "Utility bill or lease" },
  { value: "IDENTITY_PROOF",  label: "Identity Proof",   desc: "Aadhaar / Passport / Voter ID" },
  { value: "AGREEMENT",       label: "Supplier Agreement", desc: "Signed platform agreement" },
  { value: "OTHER",           label: "Other",            desc: "Any other relevant document" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map(d => [d.value, d.label])
);

export default function SupplierDocumentsPage() {
  const [docs, setDocs]         = useState<SupplierDoc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState("GST_CERTIFICATE");
  const [uploadLabel, setUploadLabel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState("");
  const fileRef                 = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/supplier/documents");
    const data = await res.json();
    setDocs(data.documents ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file."); return; }

    setUploading(true);

    try {
      // Upload to Cloudinary via /api/upload
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "supplier-docs");

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const url        = uploadData.url ?? uploadData.secure_url;
      const publicId   = uploadData.publicId ?? uploadData.public_id;

      // Save doc record
      const saveRes = await fetch("/api/supplier/documents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: uploadType, label: uploadLabel || undefined, url, publicId }),
      });
      if (!saveRes.ok) throw new Error("Save failed");

      setShowForm(false);
      setUploadLabel("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/supplier/documents", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    load();
  }

  const verified   = docs.filter(d => d.isVerified);
  const unverified = docs.filter(d => !d.isVerified);
  const uploaded   = new Set(docs.map(d => d.type));

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
          >
            Document Center
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            {verified.length} verified · {unverified.length} pending review
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-80"
          style={{ background: "#F5C518", color: "#0D0D0D" }}
        >
          <Upload className="h-3.5 w-3.5" /> Upload Document
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.20)" }}
        >
          <p className="text-[#F5C518] text-[13px] font-bold mb-4">Upload a New Document</p>
          {error && (
            <div
              className="mb-3 px-3 py-2.5 rounded-xl text-[13px]"
              style={{ background: "rgba(248,113,113,0.10)", color: "#F87171" }}
            >
              {error}
            </div>
          )}
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/40 text-[11px] mb-1">Document Type</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/40 text-[11px] mb-1">Label (optional)</label>
                <input
                  value={uploadLabel}
                  onChange={e => setUploadLabel(e.target.value)}
                  placeholder="e.g. Updated Oct 2025"
                  className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-white/40 text-[11px] mb-1">File (PDF, JPG, PNG — max 10 MB)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-[13px] text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-bold file:cursor-pointer"
                style={{ fileBackground: "rgba(245,197,24,0.12)", color: "#F5C518" } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-bold disabled:opacity-40"
                style={{ background: "#F5C518", color: "#0D0D0D" }}
              >
                {uploading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : <><Upload className="h-3.5 w-3.5" /> Upload</>}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-[13px] text-white/40 hover:text-white/70"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Required docs checklist */}
      <div className="mb-6">
        <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-3">Required Documents</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DOC_TYPES.slice(0, 5).map(d => {
            const has = uploaded.has(d.value);
            const ver = docs.find(doc => doc.type === d.value && doc.isVerified);
            return (
              <div
                key={d.value}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ver ? "rgba(74,222,128,0.25)" : has ? "rgba(245,197,24,0.20)" : "rgba(255,255,255,0.07)"}` }}
              >
                {ver
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
                  : has
                  ? <Clock className="h-3.5 w-3.5 shrink-0 text-[#F5C518]" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white/20" />
                }
                <div>
                  <p className="text-white/80 text-[12px] font-semibold">{d.label}</p>
                  <p className="text-white/25 text-[10px]">{d.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin text-[#F5C518]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-[14px]">No documents uploaded yet</div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-white/25 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-[14px]">{TYPE_LABEL[doc.type] ?? doc.type}</p>
                    {doc.label && <span className="text-white/35 text-[12px]">— {doc.label}</span>}
                  </div>
                  <p className="text-white/30 text-[11px]">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {doc.isVerified && doc.verifiedAt &&
                      ` · Verified ${new Date(doc.verifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: doc.isVerified ? "rgba(74,222,128,0.12)" : "rgba(245,197,24,0.12)",
                    color:      doc.isVerified ? "#4ADE80" : "#F5C518",
                  }}
                >
                  {doc.isVerified
                    ? <><CheckCircle2 className="h-3 w-3" /> Verified</>
                    : <><Clock className="h-3 w-3" /> Pending</>
                  }
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl text-white/30 hover:text-white/70 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {!doc.isVerified && (
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 rounded-xl text-white/20 hover:text-[#F87171] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
