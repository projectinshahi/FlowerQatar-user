import { prisma } from "@/lib/prisma";

export interface Consent {
  marketingEmails: boolean;
  promotionalNotifications: boolean;
  analyticsCookies: boolean;
  personalization: boolean;
}

/** Non-essential tracking defaults OFF (opt-in); communications default ON (opt-out). */
export const DEFAULT_CONSENT: Consent = {
  marketingEmails: true,
  promotionalNotifications: true,
  analyticsCookies: false,
  personalization: true,
};

/** Coerce a stored/raw consent value into a complete, typed Consent object. */
export function normalizeConsent(raw: unknown): Consent {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Consent>;
  const pick = (k: keyof Consent) => (typeof r[k] === "boolean" ? (r[k] as boolean) : DEFAULT_CONSENT[k]);
  return {
    marketingEmails: pick("marketingEmails"),
    promotionalNotifications: pick("promotionalNotifications"),
    analyticsCookies: pick("analyticsCookies"),
    personalization: pick("personalization"),
  };
}

/** Assembles the full GDPR "download my data" payload for a user. */
export async function buildDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImage: true,
      dateOfBirth: true,
      country: true,
      state: true,
      city: true,
      language: true,
      timezone: true,
      role: true,
      provider: true,
      isEmailVerified: true,
      createdAt: true,
      lastLogin: true,
      addresses: true,
      consent: true,
      orders: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          trackingNumber: true,
          createdAt: true,
          items: { select: { productId: true, variantSku: true, colorName: true, quantity: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        select: { id: true, productName: true, status: true, frequency: true, quantity: true, startDate: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) return null;

  const { addresses, consent, orders, subscriptions, ...profile } = user;
  return {
    exportedAt: new Date().toISOString(),
    account: profile,
    addresses,
    orders,
    subscriptions,
    consent: normalizeConsent(consent),
  };
}
