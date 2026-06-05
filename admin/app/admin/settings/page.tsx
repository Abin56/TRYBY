"use client";

import { useState } from "react";
import { Store, Truck, CreditCard, Mail, Bell, Users, Key, Shield } from "lucide-react";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "store",    label: "Store Info",    icon: Store },
  { id: "shipping", label: "Shipping",      icon: Truck },
  { id: "payment",  label: "Payments",      icon: CreditCard },
  { id: "email",    label: "Email",         icon: Mail },
  { id: "notifs",   label: "Notifications", icon: Bell },
  { id: "users",    label: "Admin Users",   icon: Users },
  { id: "api",      label: "API Keys",      icon: Key },
];

function Field({ label, defaultValue, type = "text", placeholder }: { label: string; defaultValue?: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1.5">{label}</label>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all" />
    </div>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc?: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F3F4F6] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#374151]">{label}</p>
        {desc && <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => setOn(!on)} className={cn("relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200", on ? "bg-[#2563EB]" : "bg-[#D1D5DB]")}>
        <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function StoreSection() {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Store Name"    defaultValue="UsefulFinds" />
        <Field label="Store Email"   defaultValue="hello@usefulfinds.in" type="email" />
        <Field label="Phone"         defaultValue="+91 98765 43210" />
        <Field label="Store URL"     defaultValue="https://usefulfinds.in" />
        <div className="sm:col-span-2"><Field label="Store Address" defaultValue="123, MG Road, Bengaluru, Karnataka 560001" /></div>
        <Field label="GST Number"    defaultValue="29ABCDE1234F1Z5" />
        <Field label="Currency"      defaultValue="INR" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Store Description</label>
        <textarea rows={3} defaultValue="Handpicked products designed to solve real problems."
          className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:bg-white transition-all resize-none" />
      </div>
    </div>
  );
}

function ShippingSection() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Free Shipping</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Free Shipping Threshold (₹)" defaultValue="499" type="number" />
          <Field label="Standard Shipping Fee (₹)" defaultValue="49" type="number" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Express Shipping</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Express Shipping Fee (₹)" defaultValue="149" type="number" />
          <Field label="Express Delivery Window" defaultValue="1-2 business days" />
        </div>
      </div>
      <Toggle label="Enable COD" desc="Allow cash on delivery for orders" defaultChecked />
      <Toggle label="COD Handling Fee" desc="Charge ₹30 handling for COD orders" defaultChecked />
    </div>
  );
}

function NotifsSection() {
  return (
    <div className="space-y-1">
      <Toggle label="New Order"       desc="Get notified when a new order is placed"             defaultChecked />
      <Toggle label="Low Stock Alert" desc="Alert when product stock falls below threshold"      defaultChecked />
      <Toggle label="New Review"      desc="Notify on new review submission"                     defaultChecked />
      <Toggle label="Cancelled Order" desc="Alert on order cancellation"                         defaultChecked />
      <Toggle label="Daily Summary"   desc="Receive daily revenue and orders summary"            />
      <Toggle label="Weekly Report"   desc="Receive weekly performance report"                   defaultChecked />
    </div>
  );
}

function ApiSection() {
  return (
    <div className="space-y-4">
      {["Live Secret Key", "Live Publishable Key"].map(k => (
        <div key={k}>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">{k}</label>
          <div className="flex gap-2">
            <input type="password" defaultValue="sk_live_xxxxxxxxxxxxxxxxxx"
              className="flex-1 h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm font-mono text-[#374151] outline-none focus:border-[#2563EB] transition-all" />
            <button className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Reveal</button>
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 flex items-start gap-2.5 text-xs text-[#D97706]">
        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
        Never share your secret keys. Rotate them immediately if compromised.
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState("store");

  const content: Record<string, React.ReactNode> = {
    store:    <StoreSection />,
    shipping: <ShippingSection />,
    notifs:   <NotifsSection />,
    api:      <ApiSection />,
    payment:  <div className="space-y-4"><Field label="Razorpay Key ID" defaultValue="rzp_live_xxxxxxxxx" /><Field label="Razorpay Key Secret" type="password" defaultValue="xxxxxxxxxxxx" /><Toggle label="Enable UPI" defaultChecked /><Toggle label="Enable Cards" defaultChecked /><Toggle label="Enable Netbanking" defaultChecked /></div>,
    email:    <div className="space-y-4"><Field label="From Name" defaultValue="UsefulFinds" /><Field label="From Email" defaultValue="noreply@usefulfinds.in" type="email" /><Field label="SMTP Host" defaultValue="smtp.resend.com" /><Field label="SMTP Port" defaultValue="587" /></div>,
    users:    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden"><div className="px-4 py-3 flex items-center justify-between bg-[#F9FAFB] border-b border-[#E5E7EB]"><p className="text-xs font-semibold text-[#374151]">Admin Users</p><button className="text-xs font-semibold text-[#2563EB] hover:underline">Invite User</button></div><div className="divide-y divide-[#F9FAFB]">{[{n:"Admin",e:"admin@usefulfinds.in",r:"Super Admin"},{n:"Manager",e:"manager@usefulfinds.in",r:"Manager"}].map(u=><div key={u.e} className="flex items-center justify-between px-4 py-3"><div><p className="text-sm font-semibold text-[#374151]">{u.n}</p><p className="text-xs text-[#9CA3AF]">{u.e}</p></div><span className="text-xs font-semibold text-[#6B7280] rounded-full border border-[#E5E7EB] px-2 py-0.5">{u.r}</span></div>)}</div></div>,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">Settings</h1>
        <p className="text-sm text-[#9CA3AF]">Manage your store configuration</p>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        {/* Nav */}
        <div className="space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active === s.id ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6]")}>
                <Icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-base font-bold text-[#111827] mb-5">{SECTIONS.find(s => s.id === active)?.label}</h2>
          {content[active] ?? <p className="text-sm text-[#9CA3AF]">Coming soon</p>}
          <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex justify-end">
            <button className="h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
