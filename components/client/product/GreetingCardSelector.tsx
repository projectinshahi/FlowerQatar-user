"use client";

import { AlertCircle, PenLine, Check, Type } from "lucide-react";
import { useGreetingCards } from "@/hooks/useProductOptions";
import { Skeleton } from '@/components/ui/Skeleton';

export const GREETING_MAX = 250;

export interface GreetingStyle {
  color: string;
  font: "serif" | "script" | "sans";
  size: "sm" | "md" | "lg";
}
export const DEFAULT_GREETING_STYLE: GreetingStyle = { color: "#61000B", font: "serif", size: "md" };

const FONTS: Record<GreetingStyle["font"], { label: string; family: string }> = {
  serif: { label: "Elegant", family: "var(--font-serif), Georgia, serif" },
  script: { label: "Script", family: '"Segoe Script","Bradley Hand","Brush Script MT",cursive' },
  sans: { label: "Modern", family: "var(--font-sans), system-ui, sans-serif" },
};
const SIZES: Record<GreetingStyle["size"], number> = { sm: 12.5, md: 15, lg: 19 };
const COLORS = ["#61000B", "#941A2F", "#C45878", "#B8860B", "#2F6B46", "#2B3A67", "#333333", "#FFFFFF"];

// Visual design per template (matched by name). Used when the template has no uploaded image.
const DESIGNS: Record<string, { bg: string; accent: string; motif: string }> = {
  "Classic Cream": { bg: "linear-gradient(135deg,#FBF7EF,#F1E6D2)", accent: "#B8860B", motif: "✿" },
  Birthday: { bg: "linear-gradient(135deg,#FFE9F0,#FFCFE1)", accent: "#D6336C", motif: "🎂" },
  Anniversary: { bg: "linear-gradient(135deg,#F7E1E1,#E9BEBE)", accent: "#941A2F", motif: "❦" },
  Congratulations: { bg: "linear-gradient(135deg,#FFF6E0,#FBE7B8)", accent: "#B8860B", motif: "✦" },
  "Thank You": { bg: "linear-gradient(135deg,#EAF3EC,#CFE5D6)", accent: "#2f6b46", motif: "❧" },
  "With Love": { bg: "linear-gradient(135deg,#FBEAF0,#F1CCDB)", accent: "#C45878", motif: "♥" },
};
const FALLBACK = { bg: "linear-gradient(135deg,#F5F0EA,#E5DBCB)", accent: "#8A7F6C", motif: "✿" };
const designFor = (name: string) => DESIGNS[name] ?? FALLBACK;

function CardFace({ name, image, message, style, variant }: { name: string; image: string | null; message?: string; style?: GreetingStyle; variant: "thumb" | "preview" }) {
  const d = designFor(name);
  const preview = variant === "preview";
  const bg = image
    ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: d.bg };
  const accent = image ? "#ffffff" : d.accent;
  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden flex flex-col items-center justify-center text-center border border-black/5 ${preview ? "aspect-[5/3] p-5" : "aspect-[4/3] p-2"}`}
      style={bg}
    >
      {image && <div className="absolute inset-0 bg-black/25" />}
      <div className="relative flex flex-col items-center">
        <span style={{ color: accent }} className={preview ? "text-[26px] leading-none mb-2" : "text-[15px] leading-none mb-0.5"}>{d.motif}</span>
        {preview && message ? (
          <p
            className="leading-snug px-2 break-words"
            style={{ color: style?.color ?? "#61000B", fontFamily: FONTS[style?.font ?? "serif"].family, fontSize: SIZES[style?.size ?? "md"] }}
          >
            {message}
          </p>
        ) : (
          <p className="font-serif tracking-[0.05em]" style={{ color: accent, fontSize: preview ? 15 : 10 }}>{name}</p>
        )}
      </div>
    </div>
  );
}

export default function GreetingCardSelector({
  templateId,
  message,
  style,
  onTemplate,
  onMessage,
  onStyle,
}: {
  templateId: string | null;
  message: string;
  style: GreetingStyle;
  onTemplate: (id: string | null) => void;
  onMessage: (m: string) => void;
  onStyle: (s: GreetingStyle) => void;
}) {
  const { data, loading, error, reload } = useGreetingCards();
  const remaining = GREETING_MAX - message.length;
  const selected = data?.find((t) => t.id === templateId) || null;
  const set = (patch: Partial<GreetingStyle>) => onStyle({ ...style, ...patch });

  return (
    <div className="space-y-3">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 text-primary">
        <PenLine size={13} /> Greeting Card <span className="text-[#9a9a9a] normal-case tracking-normal font-normal">(optional)</span>
      </span>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-[12px] text-red-500"><AlertCircle size={14} /> {error} <button type="button" onClick={reload} className="underline">Retry</button></div>
      ) : data && data.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onTemplate(null)}
              aria-pressed={!templateId}
              className={`aspect-[4/3] rounded-lg border-2 flex items-center justify-center text-[11px] uppercase tracking-[0.1em] transition-colors ${!templateId ? "border-primary text-primary bg-primary/5" : "border-[#E4DED4] text-[#8A8A8A] hover:border-primary/50"}`}
            >
              No card
            </button>
            {data.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTemplate(t.id)}
                aria-pressed={templateId === t.id}
                aria-label={`Greeting card: ${t.name}`}
                className={`relative rounded-lg transition-all ${templateId === t.id ? "ring-2 ring-primary ring-offset-1" : "hover:opacity-90"}`}
              >
                {templateId === t.id && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center"><Check size={11} /></span>
                )}
                <CardFace name={t.name} image={t.image} variant="thumb" />
              </button>
            ))}
          </div>

          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Message + customizer */}
              <div className="space-y-3">
                <div>
                  <textarea
                    value={message}
                    maxLength={GREETING_MAX}
                    onChange={(e) => onMessage(e.target.value.slice(0, GREETING_MAX))}
                    rows={3}
                    placeholder={`Write your message for the "${selected.name}" card…`}
                    aria-label="Greeting message"
                    className="w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 outline-none focus:border-primary resize-none"
                    style={{ color: style.color, fontFamily: FONTS[style.font].family }}
                  />
                  <p className={`text-[11px] mt-1 text-right ${remaining <= 20 ? "text-amber-600" : "text-[#9a9a9a]"}`}>{remaining} characters left</p>
                </div>

                {/* Font */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#9a9a9a] flex items-center gap-1 mb-1.5"><Type size={11} /> Font</span>
                  <div className="flex gap-1.5">
                    {(Object.keys(FONTS) as GreetingStyle["font"][]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => set({ font: f })}
                        aria-pressed={style.font === f}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] transition-colors ${style.font === f ? "border-primary bg-primary/5 text-primary" : "border-[#E4DED4] text-[#666] hover:border-primary/50"}`}
                        style={{ fontFamily: FONTS[f].family }}
                      >
                        {FONTS[f].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#9a9a9a] block mb-1.5">Text size</span>
                  <div className="flex gap-1.5">
                    {(["sm", "md", "lg"] as GreetingStyle["size"][]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set({ size: s })}
                        aria-pressed={style.size === s}
                        className={`w-9 h-8 rounded-lg border transition-colors ${style.size === s ? "border-primary bg-primary/5 text-primary" : "border-[#E4DED4] text-[#666] hover:border-primary/50"}`}
                      >
                        <span style={{ fontSize: s === "sm" ? 11 : s === "md" ? 13 : 16 }}>A</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colour */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#9a9a9a] block mb-1.5">Text colour</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set({ color: c })}
                        aria-label={`Text colour ${c}`}
                        aria-pressed={style.color.toLowerCase() === c.toLowerCase()}
                        className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${style.color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-primary ring-offset-1" : "border-black/10"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#9a9a9a] mb-1.5">Live preview</p>
                <CardFace name={selected.name} image={selected.image} message={message || "Your message will appear here…"} style={style} variant="preview" />
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-[12px] text-[#999]">No greeting cards available.</p>
      )}
    </div>
  );
}
