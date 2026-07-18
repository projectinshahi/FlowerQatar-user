import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, withUser } from "@/lib/api";
import { consentSchema } from "@/lib/validations/privacy";
import { normalizeConsent } from "@/lib/gdpr";

// GET /api/account/consent — current consent flags.
export const GET = withUser(async ({ user }) => {
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { consent: true } });
  return ok(normalizeConsent(u?.consent));
});

// PUT /api/account/consent — update one or more consent flags.
export const PUT = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const patch = consentSchema.parse(body);

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { consent: true } });
  const merged = { ...normalizeConsent(u?.consent) };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v === "boolean") (merged as Record<string, boolean>)[k] = v;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { consent: merged as unknown as Prisma.InputJsonValue },
  });
  return ok(merged);
});
