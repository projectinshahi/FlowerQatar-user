"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Appearance controls for the storefront promotion ticker (the strip pinned to the bottom of
 * the home banner). Colours were hardcoded in components/PromotionBar.tsx; this writes the
 * singleton that now drives them.
 *
 * The preview is a real copy of the bar's layout rather than two swatches, because the thing
 * an admin actually needs to judge is the CONTRAST between the two colours at the bar's real
 * text size — a pair of swatches shows neither.
 */

const DEFAULTS = { barColor: "#b0aca7", textColor: "#ffffff" };
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function PromotionBarTheme() {
  const [barColor, setBarColor] = useState(DEFAULTS.barColor);
  const [textColor, setTextColor] = useState(DEFAULTS.textColor);
  const [saved, setSaved] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/promotion-bar");
        const json = await res.json();
        if (!alive || !json?.success || !json.data) return;
        setBarColor(json.data.barColor);
        setTextColor(json.data.textColor);
        setSaved({ barColor: json.data.barColor, textColor: json.data.textColor });
      } catch {
        // Leaving the defaults in place is the honest fallback — they are what the
        // storefront paints when the row is missing.
        toast.error("Could not load the promotion bar colours");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const valid = HEX.test(barColor) && HEX.test(textColor);
  const dirty = barColor !== saved.barColor || textColor !== saved.textColor;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotion-bar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barColor, textColor }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Save failed");
      setSaved({ barColor, textColor });
      toast.success("Promotion bar updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Promotion bar appearance</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Colours for the offers strip at the bottom of the home banner.
          </p>
        </div>
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={!valid || saving}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <ColorField label="Bar colour" value={barColor} onChange={setBarColor} id="promo-bar-color" />
        <ColorField label="Text colour" value={textColor} onChange={setTextColor} id="promo-text-color" />
        {(barColor !== DEFAULTS.barColor || textColor !== DEFAULTS.textColor) && (
          <button
            type="button"
            onClick={() => {
              setBarColor(DEFAULTS.barColor);
              setTextColor(DEFAULTS.textColor);
            }}
            className="pb-1.5 text-xs text-gray-500 underline hover:text-gray-900"
          >
            Reset to default
          </button>
        )}
      </div>

      {!valid && (
        <p className="text-xs text-red-600">Both colours must be valid hex values, e.g. #B0ACA7.</p>
      )}

      {/* Live preview — same structure and type sizes as the real bar. */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-700">Preview</span>
        <div
          className="flex min-h-[40px] items-center justify-between gap-1 rounded-lg px-4 py-1.5"
          style={{
            backgroundColor: HEX.test(barColor) ? barColor : DEFAULTS.barColor,
            color: HEX.test(textColor) ? textColor : DEFAULTS.textColor,
          }}
        >
          <ChevronLeft size={16} className="shrink-0" />
          <div className="flex flex-1 flex-wrap items-center justify-center gap-x-2 text-center font-sans text-[11px] uppercase leading-tight tracking-[0.15em]">
            <span className="font-medium">Celebrate every occasion with Lebami flowers.</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-50" aria-hidden />
            <span className="underline underline-offset-4">Shop Now</span>
          </div>
          <ChevronRight size={16} className="shrink-0" />
        </div>
        {loading && <p className="text-xs text-gray-400">Loading saved colours…</p>}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="w-24 rounded-lg border border-gray-200 px-2 py-1 font-mono text-xs uppercase outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
    </div>
  );
}
