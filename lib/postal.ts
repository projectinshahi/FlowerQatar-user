// Country-specific postal-code validation. Never assume one country's format for all.

interface PostalRule {
  regex: RegExp;
  example: string;
}

// Countries that do NOT operate a postal-code system → postal code is optional.
// (Qatar and the UAE are the notable ones in this app's markets.)
export const NO_POSTAL_COUNTRIES = new Set([
  "QA", "AE", "HK", "MO", "AO", "AG", "AW", "BS", "BZ", "BJ", "BW", "BF", "BI",
  "CM", "CF", "KM", "CG", "CD", "CK", "CI", "DJ", "DM", "GQ", "ER", "FJ", "GM",
  "GH", "GD", "GY", "KI", "KP", "LY", "MW", "ML", "MR", "NR", "NU", "PA", "RW",
  "KN", "ST", "SC", "SL", "SB", "SO", "SR", "SY", "TZ", "TL", "TG", "TK", "TO",
  "TT", "TV", "UG", "VU", "YE", "ZW",
]);

// Explicit formats for common countries. Anything not listed falls back to a lenient rule.
const POSTAL_RULES: Record<string, PostalRule> = {
  IN: { regex: /^\d{6}$/, example: "560001" },
  US: { regex: /^\d{5}(-\d{4})?$/, example: "10001" },
  GB: { regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: "SW1A 1AA" },
  CA: { regex: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, example: "K1A 0B1" },
  AU: { regex: /^\d{4}$/, example: "2000" },
  DE: { regex: /^\d{5}$/, example: "10115" },
  FR: { regex: /^\d{5}$/, example: "75001" },
  IT: { regex: /^\d{5}$/, example: "00100" },
  ES: { regex: /^\d{5}$/, example: "28001" },
  NL: { regex: /^\d{4}\s?[A-Za-z]{2}$/, example: "1011 AB" },
  JP: { regex: /^\d{3}-?\d{4}$/, example: "100-0001" },
  CN: { regex: /^\d{6}$/, example: "100000" },
  BR: { regex: /^\d{5}-?\d{3}$/, example: "01000-000" },
  SA: { regex: /^\d{5}(-\d{4})?$/, example: "11564" },
  SG: { regex: /^\d{6}$/, example: "238859" },
  PK: { regex: /^\d{5}$/, example: "44000" },
  BD: { regex: /^\d{4}$/, example: "1000" },
  ID: { regex: /^\d{5}$/, example: "10110" },
  RU: { regex: /^\d{6}$/, example: "101000" },
  ZA: { regex: /^\d{4}$/, example: "0001" },
  EG: { regex: /^\d{5}$/, example: "11511" },
  NG: { regex: /^\d{6}$/, example: "100001" },
  TR: { regex: /^\d{5}$/, example: "34000" },
  MX: { regex: /^\d{5}$/, example: "01000" },
};

const FALLBACK: PostalRule = { regex: /^[A-Za-z0-9\s-]{2,12}$/, example: "Postal code" };

export function isPostalRequired(countryCode: string): boolean {
  return !NO_POSTAL_COUNTRIES.has((countryCode || "").toUpperCase());
}

export function postalExample(countryCode: string): string {
  return POSTAL_RULES[(countryCode || "").toUpperCase()]?.example ?? FALLBACK.example;
}

/** Validate a postal code for a country. Empty is valid only where postal codes aren't used. */
export function isValidPostalCode(countryCode: string, value: string): boolean {
  const cc = (countryCode || "").toUpperCase();
  const v = (value || "").trim();
  if (!v) return !isPostalRequired(cc);
  const rule = POSTAL_RULES[cc] ?? FALLBACK;
  return rule.regex.test(v);
}
