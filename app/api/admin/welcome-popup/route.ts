import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { welcomePopupSchema } from '@/lib/validations/welcome-popup';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { publishChange } from '@/lib/live-sync';

/** GET — the singleton config (or null). Admin only. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const config = await prisma.welcomePopup.findFirst();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to fetch welcome popup:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch welcome popup' }, { status: 500 });
  }
}

/**
 * PUT — create-or-update the singleton. There is only ever one row, so this upserts:
 * updates the existing config, or creates it the first time. No separate POST/DELETE.
 */
export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = welcomePopupSchema.parse(body);

    const existing = await prisma.welcomePopup.findFirst({ select: { id: true } });
    const saved = existing
      ? await prisma.welcomePopup.update({ where: { id: existing.id }, data })
      : await prisma.welcomePopup.create({ data });

    // Refresh the storefront so the public popup picks up the new copy.
    publishChange({ type: 'welcomePopup.updated' });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to save welcome popup:', error);
    return NextResponse.json({ success: false, message: 'Failed to save welcome popup' }, { status: 500 });
  }
}
