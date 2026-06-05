"use client";

import { useState, useEffect } from "react";
import {
  Plug, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
  RefreshCw, ExternalLink, AlertTriangle, Shield, Zap,
  ToggleLeft, ToggleRight, Save, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Integration {
  provider:        string;
  name:            string;
  authType:        "email_password" | "api_key";
  description:     string;
  docsUrl:         string;
  logoColor:       string;
  id:              string | null;
  enabled:         boolean;
  testMode:        boolean;
  hasEmail:        boolean;
  hasPassword:     boolean;
  hasApiKey:       boolean;
  hasApiSecret:    boolean;
  hasWebhookSecret: boolean;
  displayName:     string | null;
  notes:           string | null;
  lastTestedAt:    string | null;
  lastTestStatus:  string | null;
  lastTestResult:  string | null;
  updatedAt:       string | null;
}

// ── Credential field ───────────────────────────────────────────────────────────

function SecretField({
  label, value, onChange, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="w-full rounded-xl px-4 pr-10 text-[13px] text-white placeholder:text-white/20 outline-none"
          style={{ height: "42px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[10px] text-white/25">{hint}</p>}
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
        style={{ height: "42px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
      />
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, desc, accent = "#F5C518" }: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; desc?: string; accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-3 text-left"
    >
      <div>
        <p className="text-[13px] font-semibold text-white">{label}</p>
        {desc && <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>}
      </div>
      <div
        className="relative h-6 w-10 rounded-full transition-colors shrink-0 ml-4"
        style={{ background: value ? accent : "rgba(255,255,255,0.1)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </div>
    </button>
  );
}

// ── Integration Card ───────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onSaved,
}: {
  integration: Integration;
  onSaved: () => void;
}) {
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [testResult, setTest]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [err, setErr]           = useState("");

  // Form state
  const [enabled,  setEnabled]  = useState(integration.enabled);
  const [testMode, setTestMode] = useState(integration.testMode);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [apiKey,   setApiKey]   = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [notes,    setNotes]    = useState(integration.notes ?? "");

  const isShiprocket = integration.provider === "SHIPROCKET";

  // Credential configured indicator
  const hasCredentials = isShiprocket
    ? (integration.hasEmail && integration.hasPassword)
    : integration.hasApiKey;

  async function save() {
    setSaving(true); setErr(""); setSaved(false);
    try {
      const body: Record<string, unknown> = {
        provider: integration.provider,
        enabled,
        testMode,
        notes: notes || undefined,
      };
      if (isShiprocket) {
        if (email)    body.email    = email;
        if (password) body.password = password;
      } else {
        if (apiKey)    body.apiKey    = apiKey;
        if (apiSecret) body.apiSecret = apiSecret;
      }
      if (webhookSecret) body.webhookSecret = webhookSecret;

      const res = await fetch("/api/admin/settings/shipping/integrations", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error?.message ?? data.error ?? "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Clear password fields after save
      setEmail(""); setPassword(""); setApiKey(""); setApiSecret(""); setWebhookSecret("");
      onSaved();
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  async function runTest() {
    setTesting(true); setTest(null);
    try {
      const body: Record<string, unknown> = { provider: integration.provider };
      if (email && password) { body.email = email; body.password = password; }
      if (apiKey) body.apiKey = apiKey;

      const res  = await fetch("/api/admin/settings/shipping/integrations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      setTest({
        ok:  res.ok,
        msg: res.ok
          ? (data.accountName ? `Connected · ${data.accountName}` : "Connection successful")
          : (data.error ?? "Connection failed"),
      });
      onSaved(); // refresh to get updated lastTestStatus
    } catch { setTest({ ok: false, msg: "Network error" }); }
    finally { setTesting(false); }
  }

  const statusColor = integration.lastTestStatus === "success" ? "#4ADE80"
    : integration.lastTestStatus === "error" ? "#F87171"
    : "rgba(255,255,255,0.2)";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "#1A1A1A", border: `1px solid ${open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}` }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-5">
        {/* Provider dot */}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black text-white"
          style={{ background: `${integration.logoColor}22`, border: `1px solid ${integration.logoColor}44` }}
        >
          <span style={{ color: integration.logoColor }}>{integration.name.slice(0, 2).toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {integration.name}
            </p>
            {/* Live / Test badge */}
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
              style={{
                background: integration.testMode ? "rgba(245,197,24,0.12)" : "rgba(74,222,128,0.12)",
                color:      integration.testMode ? "#F5C518" : "#4ADE80",
              }}
            >
              {integration.testMode ? "Test Mode" : "Live"}
            </span>
            {/* Enabled badge */}
            {integration.enabled && (
              <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}>
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 truncate">{integration.description}</p>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Last test indicator */}
          {integration.lastTestStatus && (
            <div className="flex items-center gap-1.5" title={integration.lastTestResult ?? ""}>
              {integration.lastTestStatus === "success"
                ? <CheckCircle2 className="h-4 w-4" style={{ color: "#4ADE80" }} />
                : <XCircle      className="h-4 w-4" style={{ color: "#F87171" }} />}
              <span className="text-[10px] font-semibold hidden sm:block" style={{ color: statusColor }}>
                {integration.lastTestStatus === "success" ? "Connected" : "Error"}
              </span>
            </div>
          )}
          {/* Credentials indicator */}
          {hasCredentials && (
            <Shield className="h-4 w-4 text-white/25" aria-label="Credentials configured" />
          )}
          {/* Expand toggle */}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/05 transition-all"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded config panel */}
      {open && (
        <div className="border-t px-6 pb-6 pt-5 space-y-5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

          {/* Toggles */}
          <div className="rounded-xl px-4 py-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Toggle
                label="Enable Integration"
                desc="Activate this provider for automatic shipment booking"
                value={enabled}
                onChange={setEnabled}
              />
              <Toggle
                label="Test Mode"
                desc="Use sandbox/staging — no real shipments will be created"
                value={testMode}
                onChange={setTestMode}
                accent="#F5C518"
              />
            </div>
          </div>

          {/* Credentials */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
              API Credentials
              {hasCredentials && (
                <span className="ml-2 normal-case font-normal text-[#4ADE80]">· Saved</span>
              )}
            </p>
            <div className="space-y-3">
              {isShiprocket ? (
                <>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    placeholder={integration.hasEmail ? "••••@••••.••• (leave blank to keep)" : "your@email.com"}
                    type="email"
                  />
                  <SecretField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    placeholder={integration.hasPassword ? "•••••••• (leave blank to keep)" : "Shiprocket password"}
                  />
                </>
              ) : (
                <>
                  <SecretField
                    label="API Key"
                    value={apiKey}
                    onChange={setApiKey}
                    placeholder={integration.hasApiKey ? "•••••••• (leave blank to keep)" : "API key from provider dashboard"}
                  />
                  <SecretField
                    label="API Secret"
                    value={apiSecret}
                    onChange={setApiSecret}
                    placeholder={integration.hasApiSecret ? "•••••••• (leave blank to keep)" : "API secret (if required)"}
                  />
                </>
              )}
              <SecretField
                label="Webhook Secret"
                value={webhookSecret}
                onChange={setWebhookSecret}
                placeholder={integration.hasWebhookSecret ? "•••••••• (leave blank to keep)" : "HMAC secret for webhook verification"}
                hint="Set this in your provider dashboard to secure incoming webhook events"
              />
            </div>
          </div>

          {/* Webhook URL info */}
          <div className="rounded-xl p-4" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)" }}>
            <p className="text-[10px] font-bold text-[#60A5FA] mb-2 uppercase tracking-widest">Webhook Endpoint</p>
            <div className="flex items-center gap-2 font-mono">
              <code className="text-[11px] text-white/60 flex-1 break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}
                /api/webhooks/{integration.provider.toLowerCase()}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(
                  `${window.location.origin}/api/webhooks/${integration.provider.toLowerCase()}`
                )}
                className="text-[10px] font-bold text-[#60A5FA] hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-[10px] text-white/25 mt-1.5">
              Register this URL in your {integration.name} dashboard to receive shipping updates automatically.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes (account number, contact, SLA info...)"
              className="w-full rounded-xl px-4 py-3 text-[12px] text-white placeholder:text-white/20 outline-none resize-none"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Last test result */}
          {integration.lastTestedAt && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{
                background: integration.lastTestStatus === "success" ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
                border: `1px solid ${integration.lastTestStatus === "success" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"}`,
              }}
            >
              {integration.lastTestStatus === "success"
                ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80] shrink-0 mt-0.5" />
                : <XCircle      className="h-4 w-4 text-[#F87171] shrink-0 mt-0.5" />}
              <div>
                <p className="text-[12px] font-semibold" style={{ color: integration.lastTestStatus === "success" ? "#4ADE80" : "#F87171" }}>
                  {integration.lastTestResult}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5">
                  Tested {new Date(integration.lastTestedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )}

          {/* Test result from this session */}
          {testResult && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: testResult.ok ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
                border: `1px solid ${testResult.ok ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
              }}
            >
              {testResult.ok
                ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80] shrink-0" />
                : <XCircle      className="h-4 w-4 text-[#F87171] shrink-0" />}
              <p className="text-[12px] font-semibold" style={{ color: testResult.ok ? "#4ADE80" : "#F87171" }}>
                {testResult.msg}
              </p>
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold text-[#F87171]"
              style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={runTest}
              disabled={testing || saving}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              {testing
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing...</>
                : <><RefreshCw className="h-3.5 w-3.5" /> Test Connection</>}
            </button>

            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> API Docs
            </a>

            <button
              onClick={save}
              disabled={saving || testing}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[12px] font-black ml-auto transition-all disabled:opacity-50 text-[#0D0D0D]"
              style={{ background: saved ? "#4ADE80" : "#F5C518" }}
            >
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-[#0D0D0D]" /> Saving...</>
                : saved
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
                  : <><Save className="h-3.5 w-3.5" /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ShippingIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading]           = useState(true);
  const [err, setErr]                   = useState("");

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/settings/shipping/integrations");
      const data = await res.json();
      if (res.ok) setIntegrations(data.integrations);
      else        setErr(data.error ?? "Failed to load");
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const activeCount = integrations.filter(i => i.enabled).length;

  return (
    <div className="p-6 lg:p-8 max-w-[860px]">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}
          >
            Shipping Integrations
          </h1>
          {activeCount > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
              {activeCount} Active
            </span>
          )}
        </div>
        <p className="text-white/40 text-[13px]">
          Connect courier APIs · Store credentials securely · Test before going live
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Plug,        color: "#60A5FA", label: "Connect",   desc: "Enter API credentials from your courier dashboard" },
          { icon: Zap,         color: "#F5C518", label: "Automate",  desc: "Generate AWB & create shipments in one click" },
          { icon: RefreshCw,   color: "#4ADE80", label: "Sync",      desc: "Webhooks auto-update tracking status in real time" },
        ].map(({ icon: Icon, color, label, desc }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <p className="text-[12px] font-bold text-white">{label}</p>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Env var fallback notice */}
      <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-6"
        style={{ background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.15)" }}>
        <AlertTriangle className="h-4 w-4 text-[#F5C518] shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-white/70">
            Credentials entered here take priority over environment variables.
          </p>
          <p className="text-[11px] text-white/35 mt-0.5">
            Existing <code className="text-white/50">SHIPROCKET_EMAIL</code> / <code className="text-white/50">SHIPROCKET_PASSWORD</code> env
            vars continue to work as a fallback when no DB credentials are saved.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-white/20" />
        </div>
      ) : err ? (
        <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px] font-semibold text-[#F87171]"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
          <XCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map(i => (
            <IntegrationCard key={i.provider} integration={i} onSaved={load} />
          ))}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-xl px-4 py-4 mt-6"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Shield className="h-4 w-4 text-white/20 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-white/40">Credential Storage</p>
          <p className="text-[10px] text-white/25 mt-0.5 leading-relaxed">
            Credentials are stored in your database. Use field-level encryption (via a KMS or
            <code className="text-white/35"> NEXTAUTH_SECRET</code>-derived key) for production environments
            where PCI/SOC compliance is required.
          </p>
        </div>
      </div>
    </div>
  );
}
