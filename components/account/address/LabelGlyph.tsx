import { Home, Briefcase, MapPin } from "lucide-react";

/** Renders the icon that matches a common address label. */
export default function LabelGlyph({ label, size = 14 }: { label: string; size?: number }) {
  const l = label.trim().toLowerCase();
  if (l === "home") return <Home size={size} />;
  if (l === "work" || l === "office") return <Briefcase size={size} />;
  return <MapPin size={size} />;
}
