"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ShieldCheck, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { errMsg } from "../../lib/error";

interface Consent {
  marketingEmails: boolean;
  promotionalNotifications: boolean;
  analyticsCookies: boolean;
  personalization: boolean;
}

const CONSENT_ITEMS: { key: keyof Consent; label: string; desc: string }[] = [
  { key: "marketingEmails", label: "Marketing emails", desc: "Offers, new arrivals and seasonal collections." },
  { key: "promotionalNotifications", label: "Promotional notifications", desc: "Discounts and time-limited promotions." },
  { key: "analyticsCookies", label: "Analytics cookies", desc: "Help us understand site usage to improve it." },
  { key: "personalization", label: "Personalization", desc: "Tailor recommendations to your taste." },
];

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${checked ? "bg-primary" : "bg-[#D8D2C8]"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function PrivacySecurity({ hasPassword }: { hasPassword: boolean }) {
  const { addToast, setUser } = useApp();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteValue, setDeleteValue] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/account/consent");
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.error || "Could not load privacy settings");
      setConsent(d.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load privacy settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const toggle = async (key: keyof Consent, value: boolean) => {
    if (!consent) return;
    const prev = consent;
    setConsent({ ...consent, [key]: value });
    setSavingKey(key);
    try {
      const r = await fetch("/api/account/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.error || "Could not save");
      setConsent(d.data);
    } catch (e) {
      setConsent(prev);
      addToast(errMsg(e, "Could not save your preference"), "error");
    } finally {
      setSavingKey(null);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const r = await fetch("/api/account/export");
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lebami-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Your data download has started.", "success");
    } catch (e) {
      addToast(errMsg(e, "Could not export your data"), "error");
    } finally {
      setDownloading(false);
    }
  };

  const doDelete = async () => {
    setDeleteError("");
    if (!deleteValue.trim()) return setDeleteError(hasPassword ? "Enter your password" : "Enter your email");
    setDeleting(true);
    try {
      const body = hasPassword ? { password: deleteValue } : { confirmText: deleteValue };
      const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.error || "Could not delete account");
      setUser(null);
      addToast("Your account has been deleted.", "info");
      window.location.href = "/";
    } catch (e) {
      setDeleteError(errMsg(e, "Could not delete account"));
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl border-t border-[#EEE] pt-10">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={18} className="text-primary" />
        <h2 className="font-serif text-[22px] text-primary">Privacy &amp; Security</h2>
      </div>
      <p className="text-[13px] text-[#888] mb-6">Control your data and communication preferences.</p>

      {/* Download my data */}
      <div className="rounded-2xl border border-[#ECECEC] p-5 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[14px] text-primary font-medium">Download my data</p>
          <p className="text-[12px] text-[#8A8A8A] mt-0.5">A JSON copy of your profile, addresses, orders, subscriptions and consent.</p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="inline-flex items-center gap-2 border border-black px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors disabled:opacity-50 shrink-0"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {downloading ? "Preparing…" : "Download"}
        </button>
      </div>

      {/* Consent */}
      <div className="rounded-2xl border border-[#ECECEC] p-5 mb-4">
        <p className="text-[14px] text-primary font-medium mb-3">Manage consent</p>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-[#F2F2F2] rounded" />)}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={20} />
            <p className="text-[13px] text-red-600 mb-3">{error}</p>
            <button type="button" onClick={load} className="text-[11px] uppercase tracking-[0.12em] border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition-colors">Try again</button>
          </div>
        ) : consent ? (
          <div className="divide-y divide-[#F1F1F1]">
            {CONSENT_ITEMS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-[13px] text-primary flex items-center gap-2">
                    {label}
                    {savingKey === key && <Loader2 size={12} className="animate-spin text-[#aaa]" />}
                  </p>
                  <p className="text-[12px] text-[#9a9a9a]">{desc}</p>
                </div>
                <Toggle checked={consent[key]} disabled={savingKey === key} onChange={(v) => toggle(key, v)} label={label} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Delete account */}
      <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[14px] text-red-600 font-medium">Delete my account</p>
          <p className="text-[12px] text-[#a08] mt-0.5 text-red-400/90">Permanently removes your personal data. Order records are retained for legal reasons.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDeleteValue("");
            setDeleteError("");
            setConfirmOpen(true);
          }}
          className="inline-flex items-center gap-2 border border-red-400 text-red-500 px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-red-500 hover:text-white transition-colors shrink-0"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label="Delete account">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => (deleting ? undefined : setConfirmOpen(false))} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl">
              <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="text-red-500" size={20} />
              </div>
              <h3 className="font-serif text-[19px] text-primary text-center mb-1">Delete your account?</h3>
              <p className="text-[13px] text-[#888] text-center mb-4">This cannot be undone. {hasPassword ? "Confirm your password to continue." : "Type your email address to continue."}</p>
              <input
                type={hasPassword ? "password" : "text"}
                value={deleteValue}
                onChange={(e) => {
                  setDeleteValue(e.target.value);
                  setDeleteError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && doDelete()}
                placeholder={hasPassword ? "Your password" : "Your email address"}
                autoComplete={hasPassword ? "current-password" : "email"}
                className={`w-full rounded-lg border text-sm py-2.5 px-3 outline-none transition-colors ${deleteError ? "border-red-400" : "border-[#E2E2E2] focus:border-primary"}`}
              />
              {deleteError && <p className="text-[11px] text-red-500 mt-1">{deleteError}</p>}
              <div className="flex items-center gap-3 mt-5">
                <button type="button" onClick={doDelete} disabled={deleting} className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-red-600 transition-colors disabled:bg-red-300">
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  Delete Account
                </button>
                <button type="button" onClick={() => setConfirmOpen(false)} disabled={deleting} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary disabled:opacity-40">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
