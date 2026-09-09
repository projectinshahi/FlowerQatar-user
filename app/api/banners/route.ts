import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

/**
 * GET /api/banners — active storefront banners (public catalogue).
 *
 * Deliberately NOT `getActiveBanners()` from lib/actions/banner.actions.ts: that reader carries
 * `take: 1` under a "single-banner policy" for the home hero, which would make a rotating slot
 * impossible. This returns every active banner in the admin's own order so a consumer can decide
 * whether to rotate; the home page keeps its single-banner reader untouched.
 *
 * `videoUrl` is the media column's historical name — it holds one URL that may be an image or a
 * video, so consumers must classify it with isVideoMedia() from lib/media.ts rather than assume.
 */
export async function GET() {
  try {
    const rows = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        subheading: true,
        description: true,
        titleColor: true,
        subheadingColor: true,
        descriptionColor: true,
        videoUrl: true,
      },
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    // Banners are decoration: a failure returns an error the client falls back from, never a crash.
    console.error('[banners]', e);
    return NextResponse.json({ success: false, error: 'Could not load banners' }, { status: 500 });
  }
}
