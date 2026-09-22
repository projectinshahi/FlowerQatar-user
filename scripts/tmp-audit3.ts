import { prisma } from '@/lib/prisma';
const BASE = process.env.AUDIT_BASE!;
const CATS: Record<string, string> = { flowers: 'FLOWER', 'gift-combos': 'GIFT_COMBOS', 'shop-by-occasion': 'SHOP_BY_OCCASION', 'blushing-blooms': 'BLUSHING_BLOOMS' };
(async () => {
  for (const [slug, type] of Object.entries(CATS)) {
    const db = await prisma.product.count({ where: { status: 'PUBLISHED', categoryType: type as never } });
    const html = await (await fetch(`${BASE}/shop?category=${slug}`)).text();
    const links = new Set(html.match(/\/product\/[a-z0-9-]+/g) ?? []).size;
    const shown = html.match(/(\d+)\s*(?:<!-- -->)?\s*(products|items|results)/i)?.[0] ?? '-';
    console.log(`${slug.padEnd(17)} DB published=${String(db).padStart(2)}  live product links=${String(links).padStart(2)}  count text="${shown}"`);
  }
  await prisma.$disconnect();
})();
