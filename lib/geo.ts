/** Reliable flag image (SVG) by ISO-2 code — renders consistently across OSes. */
export function flagUrl(code: string): string {
  return `https://flagcdn.com/${(code || "").toLowerCase()}.svg`;
}
