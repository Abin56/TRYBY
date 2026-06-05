"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, CreditCard, FileText, CheckCircle2,
  ArrowRight, AlertTriangle, Upload, X,
} from "lucide-react";
import Link from "next/link";

type Step = "business" | "bank" | "agreement" | "done";

const STEP_ORDER: Step[] = ["business", "bank", "agreement", "done"];

export default function SupplierApplyPage() {
  const router = useRouter();
  const [step, setStep]     = useState<Step>("business");
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName:     "",
    gstin:           "",
    panNumber:       "",
    websiteUrl:      "",
    businessAddress: "",
    bankAccountName: "",
    bankAccountNo:   "",
    bankIfsc:        "",
  });

  const [agreementChecked, setAgreementChecked] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);

    const payload: Record<string, string> = { companyName: form.companyName };
    if (form.gstin)           payload.gstin           = form.gstin;
    if (form.panNumber)       payload.panNumber       = form.panNumber;
    if (form.websiteUrl)      payload.websiteUrl      = form.websiteUrl;
    if (form.businessAddress) payload.businessAddress = form.businessAddress;
    if (form.bankAccountName) payload.bankAccountName = form.bankAccountName;
    if (form.bankAccountNo)   payload.bankAccountNo   = form.bankAccountNo;
    if (form.bankIfsc)        payload.bankIfsc        = form.bankIfsc;

    const res = await fetch("/api/supplier/apply", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error?.formErrors?.[0] ?? d.error ?? "Submission failed. Please try again.");
      return;
    }

    setStep("done");
  }

  const stepIndex   = STEP_ORDER.indexOf(step);
  const totalSteps  = STEP_ORDER.length - 1; // exclude "done"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#0A0A0A" }}>

      {/* Brand */}
      <div className="mb-10 text-center">
        <p
          className="text-white font-black mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", letterSpacing: "0.14em" }}
        >
          TRYBY
        </p>
        <p className="text-white/35 text-[13px]">Supplier Partner Programme</p>
      </div>

      {step === "done" ? (
        <SuccessCard onDashboard={() => router.push("/supplier/dashboard")} />
      ) : (
        <div className="w-full max-w-lg">

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {["Business Info", "Bank Details", "Agreement"].map((label, i) => {
              const done    = stepIndex > i;
              const current = stepIndex === i;
              return (
                <div key={label} className="flex-1 flex flex-col gap-1.5">
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ background: done || current ? "#F5C518" : "rgba(255,255,255,0.10)" }}
                  />
                  <p
                    className="text-[10px] font-bold"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.08em",
                      color: done || current ? "#F5C518" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {step === "business" && (
              <BusinessStep form={form} onChange={handleChange} onNext={() => {
                if (!form.companyName.trim()) { setError("Company name is required"); return; }
                setError("");
                setStep("bank");
              }} error={error} />
            )}
            {step === "bank" && (
              <BankStep form={form} onChange={handleChange}
                onBack={() => setStep("business")}
                onNext={() => { setError(""); setStep("agreement"); }}
                error={error}
              />
            )}
            {step === "agreement" && (
              <AgreementStep
                checked={agreementChecked}
                onToggle={() => setAgreementChecked(c => !c)}
                onBack={() => setStep("bank")}
                onSubmit={handleSubmit}
                saving={saving}
                error={error}
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Step 1: Business Info ─────────────────────────────────────────── */
function BusinessStep({ form, onChange, onNext, error }: {
  form: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onNext: () => void;
  error: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,197,24,0.12)" }}>
          <Building2 className="h-4 w-4 text-[#F5C518]" />
        </div>
        <div>
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Business Information
          </h2>
          <p className="text-[11px] text-white/35">Tell us about your company</p>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="space-y-4">
        <Field label="Company Name *" name="companyName" value={form.companyName} onChange={onChange} placeholder="ACME Sports Pvt. Ltd." />
        <div className="grid grid-cols-2 gap-4">
          <Field label="GSTIN" name="gstin" value={form.gstin} onChange={onChange} placeholder="22AAAAA0000A1Z5" mono />
          <Field label="PAN Number" name="panNumber" value={form.panNumber} onChange={onChange} placeholder="ABCDE1234F" mono />
        </div>
        <Field label="Business Address" name="businessAddress" value={form.businessAddress} onChange={onChange} placeholder="123, MG Road, Mumbai 400001" />
        <Field label="Website URL" name="websiteUrl" value={form.websiteUrl} onChange={onChange} placeholder="https://yourcompany.com" type="url" />
      </div>

      <button
        onClick={onNext}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black text-[14px] transition-all hover:brightness-110"
        style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
      >
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

/* ── Step 2: Bank Details ──────────────────────────────────────────── */
function BankStep({ form, onChange, onBack, onNext, error }: {
  form: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(96,165,250,0.12)" }}>
          <CreditCard className="h-4 w-4 text-[#60A5FA]" />
        </div>
        <div>
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Bank Details
          </h2>
          <p className="text-[11px] text-white/35">Required for payout processing</p>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="space-y-4">
        <Field label="Account Holder Name" name="bankAccountName" value={form.bankAccountName} onChange={onChange} placeholder="Name as on bank account" />
        <Field label="Account Number" name="bankAccountNo" value={form.bankAccountNo} onChange={onChange} placeholder="000011112222" mono />
        <Field label="IFSC Code" name="bankIfsc" value={form.bankIfsc} onChange={onChange} placeholder="SBIN0001234" mono />
      </div>

      <p className="text-[11px] text-white/30 mt-4">
        Bank details can be updated later from your supplier profile. They're required before requesting a payout.
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl py-3 font-black text-[13px] text-white/50 hover:text-white hover:bg-white/06 transition-all"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-black text-[14px] transition-all hover:brightness-110"
          style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

/* ── Step 3: Agreement ─────────────────────────────────────────────── */
function AgreementStep({ checked, onToggle, onBack, onSubmit, saving, error }: {
  checked: boolean;
  onToggle: () => void;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(167,139,250,0.12)" }}>
          <FileText className="h-4 w-4 text-[#A78BFA]" />
        </div>
        <div>
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Supplier Agreement
          </h2>
          <p className="text-[11px] text-white/35">Review and accept the terms</p>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Agreement summary */}
      <div
        className="rounded-xl p-4 mb-5 space-y-3 max-h-52 overflow-y-auto text-[12px] text-white/50 leading-relaxed"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="font-bold text-white/70">TRYBY Supplier Partner Agreement — Key Terms</p>
        <p>1. <strong className="text-white/60">Commission:</strong> TRYBY retains a platform commission (default 15%, adjustable) on each sale. Your earnings are the balance after commission.</p>
        <p>2. <strong className="text-white/60">Product Quality:</strong> All products listed must be genuine, accurately described, and comply with applicable Indian laws and regulations.</p>
        <p>3. <strong className="text-white/60">Fulfilment:</strong> Suppliers are responsible for timely dispatch and quality packaging. TRYBY may de-list products with high return rates.</p>
        <p>4. <strong className="text-white/60">Payouts:</strong> Payouts are processed within 3–5 business days of admin approval. Bank details must be accurate; TRYBY is not liable for incorrect transfers.</p>
        <p>5. <strong className="text-white/60">Termination:</strong> TRYBY reserves the right to suspend or terminate any supplier account for policy violations, fraudulent activity, or platform harm.</p>
        <p>6. <strong className="text-white/60">Intellectual Property:</strong> Suppliers grant TRYBY a non-exclusive licence to display product images and descriptions on the platform.</p>
        <p>7. <strong className="text-white/60">Data:</strong> Supplier data is handled per TRYBY's Privacy Policy. Sales data may be used for aggregated platform analytics.</p>
      </div>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex items-start gap-3 text-left w-full group"
      >
        <div
          className="mt-0.5 h-5 w-5 rounded-md shrink-0 flex items-center justify-center transition-all"
          style={{
            background: checked ? "#F5C518" : "rgba(255,255,255,0.07)",
            border: checked ? "none" : "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {checked && <CheckCircle2 className="h-3.5 w-3.5 text-[#0D0D0D]" strokeWidth={3} />}
        </div>
        <p className="text-[12px] text-white/60 group-hover:text-white/80 transition-colors">
          I have read and agree to the TRYBY Supplier Partner Agreement. I confirm that the business information provided is accurate.
        </p>
      </button>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl py-3 font-black text-[13px] text-white/50 hover:text-white hover:bg-white/06 transition-all"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!checked || saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-black text-[14px] transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {saving ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </>
  );
}

/* ── Done ──────────────────────────────────────────────────────────── */
function SuccessCard({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div
      className="w-full max-w-md rounded-2xl p-8 text-center"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(74,222,128,0.10)" }}
      >
        <CheckCircle2 className="h-8 w-8 text-[#4ADE80]" />
      </div>
      <h2
        className="text-white font-black mb-2"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}
      >
        Application Submitted!
      </h2>
      <p className="text-white/50 text-[13px] leading-relaxed mb-6">
        Your TRYBY supplier application is under review. We'll notify you within 2–3 business days. You can upload documents and track your status from the dashboard.
      </p>
      <button
        onClick={onDashboard}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black text-[14px] transition-all hover:brightness-110"
        style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */
function Field({ label, name, value, onChange, placeholder, type = "text", mono = false }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{label}</label>
      <input
        name={name} value={value} onChange={onChange} type={type} placeholder={placeholder}
        className={`w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/20 ${mono ? "font-mono" : ""}`}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
      />
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[12px]"
      style={{ background: "rgba(248,113,113,0.10)", color: "#F87171", border: "1px solid rgba(248,113,113,0.20)" }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" /> {msg}
    </div>
  );
}
