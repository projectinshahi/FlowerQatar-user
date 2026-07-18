"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { errMsg } from "../../lib/error";
import PasswordField from "../auth/PasswordField";

const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1.5";

export default function ChangePasswordCard() {
  const { addToast } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const checks = [
    { label: "At least 8 characters", ok: next.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(next) },
    { label: "One lowercase letter", ok: /[a-z]/.test(next) },
    { label: "One number", ok: /[0-9]/.test(next) },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(next) },
  ];
  const valid = checks.every((c) => c.ok);
  const match = confirm.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && valid && match && !saving;

  const submit = async () => {
    setError("");
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not update your password");
      setCurrent("");
      setNext("");
      setConfirm("");
      addToast("Password updated successfully.", "success");
    } catch (e) {
      setError(errMsg(e, "Could not update your password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl border-t border-[#EEE] pt-10">
      <h2 className="font-serif text-[22px] text-primary mb-1">Change Password</h2>
      <p className="text-[13px] text-[#888] mb-6">Choose a strong password you don&apos;t use elsewhere.</p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-500 text-xs">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
        <div className="sm:col-span-2">
          <label className={labelCls}>Current Password *</label>
          <PasswordField value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div>
          <label className={labelCls}>New Password *</label>
          <PasswordField value={next} onChange={setNext} autoComplete="new-password" />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password *</label>
          <PasswordField value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>
      </div>

      {next.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-w-xl">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 text-[11px] ${c.ok ? "text-green-600" : "text-[#999]"}`}>
              <Check size={12} className={c.ok ? "opacity-100" : "opacity-30"} />
              {c.label}
            </li>
          ))}
        </ul>
      )}
      {confirm.length > 0 && !match && <p className="text-[11px] text-red-500 mt-2">Passwords do not match.</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 bg-black text-white px-7 py-3 mt-8 text-[11px] uppercase tracking-[0.18em] hover:bg-secondary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? "Updating…" : "Update Password"}
      </button>
    </div>
  );
}
