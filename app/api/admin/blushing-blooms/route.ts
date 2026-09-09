import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { blushingBloomsPageSchema } from '@/lib/validations/blushing-blooms';

/** GET — the singleton row (or null when the admin has never saved). Admin only. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const config = await prisma.blushingBloomsPage.findFirst();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to fetch Blushing Blooms page content:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Blushing Blooms content' },
      { status: 500 }
    );
  }
}

/**
 * PUT — create-or-update the singleton. There is only ever one row, so this upserts rather
 * than exposing a separate POST/DELETE, matching /api/admin/welcome-popup.
 */
export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = blushingBloomsPageSchema.parse(body);

    const existing = await prisma.blushingBloomsPage.findFirst({ select: { id: true } });
    const saved = existing
      ? await prisma.blushingBloomsPage.update({ where: { id: existing.id }, data })
      : await prisma.blushingBloomsPage.create({ data });

    // The category page is the only consumer; /shop is where it is served from.
    revalidatePath('/shop');
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to save Blushing Blooms page content:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save Blushing Blooms content' },
      { status: 500 }
    );
  }
}
