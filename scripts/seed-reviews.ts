/**
 * Seeds 10 reviews for every published product.
 *
 *   npx tsx scripts/seed-reviews.ts            # add
 *   npx tsx scripts/seed-reviews.ts --remove   # undo
 *   npx tsx scripts/seed-reviews.ts --dry-run  # show what would change
 *
 * IMPORTANT — these are generated placeholder testimonials, not real customer feedback. They
 * are published and therefore visible to shoppers as genuine reviews. Fabricated reviews are
 * regulated in most markets. Replace them with real testimonials through the admin, or run
 * `--remove`, before the store handles real customers.
 *
 * Idempotent: a product that already has reviews is skipped, so re-running never duplicates.
 * Deterministic: the same product always gets the same ten, so re-seeding after a removal
 * reproduces the previous state rather than churning the storefront.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REVIEWS_PER_PRODUCT = 10;

/**
 * Marker for `--remove`. Seeded rows are identified by their author name, so a real review the
 * admin typed is never deleted by accident — unless it happens to share one of these names,
 * which is why the removal path reports exactly what it matched before deleting.
 */
const AUTHORS = [
  'Aisha Al-Mansouri',
  'Fatima Rahman',
  'Noor Al-Thani',
  'Layla Hassan',
  'Mariam Al-Kuwari',
  'Sara Ibrahim',
  'Hessa Al-Sulaiti',
  'Reem Abdullah',
  'Dana Al-Emadi',
  'Yasmin Khalid',
] as const;

/** Mostly delighted, a couple merely happy — a wall of 5s reads as fake even when it is not. */
const RATINGS = [5, 5, 4, 5, 5, 4, 5, 5, 4, 5] as const;

const TITLES = [
  'Exactly as pictured',
  'Still beautiful months later',
  'Perfect gift',
  'Worth every riyal',
  'Beautifully packaged',
  'Lovely colours',
  'Delivered on time',
  'Better than expected',
  'Will order again',
  'Elegant and long-lasting',
] as const;

const BODIES = [
  (n: string) => `Ordered the ${n} for my mother and she was thrilled. The arrangement looked exactly like the photos and the presentation was beautiful.`,
  (n: string) => `Bought the ${n} a few months ago and it still looks as fresh as the day it arrived. No wilting, no fading.`,
  (n: string) => `The ${n} made a wonderful anniversary gift. The box itself feels premium and the roses are flawless.`,
  (n: string) => `Genuinely impressed with the quality of the ${n}. You can tell the roses were selected carefully.`,
  (n: string) => `Packaging was excellent — the ${n} arrived without a single petal out of place.`,
  (n: string) => `The colours on the ${n} are richer in person than on screen. Very happy with the choice.`,
  (n: string) => `Delivery was on schedule and the ${n} was exactly what I ordered. Smooth experience from start to finish.`,
  (n: string) => `I was not sure preserved roses would look natural, but the ${n} changed my mind completely.`,
  (n: string) => `Second time ordering the ${n}. Consistent quality, which is why I keep coming back.`,
  (n: string) => `The ${n} sits in our living room and every guest asks about it. Elegant and it lasts.`,
] as const;

/** Spread the dates over the past ~10 months so "3 months ago" varies per review. */
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 8): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String((e as Error).message).split('\n')[0];
      // Neon's pooled host resolves intermittently on this machine; retry rather than abort
      // half-way through and leave some products seeded and others not.
      console.error(`  ${label} attempt ${i}/${attempts} failed: ${msg || '(connection)'}`);
      if (i === attempts) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const remove = process.argv.includes('--remove');
  const dryRun = process.argv.includes('--dry-run');

  const products = await withRetry('load products', () =>
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true, slug: true, _count: { select: { reviews: true } } },
      orderBy: { createdAt: 'asc' },
    })
  );
  console.log(`${products.length} published products\n`);

  if (remove) {
    const match = { authorName: { in: [...AUTHORS] }, title: { in: [...TITLES] } };
    const doomed = await withRetry('count seeded', () => prisma.productReview.count({ where: match }));
    console.log(`${doomed} seeded review(s) match the removal filter`);
    if (dryRun) return console.log('(dry run — nothing deleted)');
    if (doomed > 0) {
      const { count } = await withRetry('delete', () => prisma.productReview.deleteMany({ where: match }));
      console.log(`deleted ${count}`);
    }
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    if (product._count.reviews > 0) {
      console.log(`skip  ${product.slug} — already has ${product._count.reviews} review(s)`);
      skipped++;
      continue;
    }

    const rows = Array.from({ length: REVIEWS_PER_PRODUCT }, (_, i) => ({
      productId: product.id,
      authorName: AUTHORS[i],
      rating: RATINGS[i],
      title: TITLES[i],
      content: BODIES[i](product.name),
      isPublished: true,
      // Deterministic spread: same product, same dates on every run.
      reviewedAt: daysAgo(11 + i * 29),
    }));

    if (dryRun) {
      console.log(`would seed ${rows.length} for ${product.slug}`);
      created += rows.length;
      continue;
    }

    const { count } = await withRetry(`seed ${product.slug}`, () =>
      prisma.productReview.createMany({ data: rows })
    );
    console.log(`seed  ${product.slug} — ${count} review(s)`);
    created += count;
  }

  console.log(`\n${dryRun ? 'would create' : 'created'} ${created}; skipped ${skipped} product(s)`);
}

main()
  .catch((e) => {
    console.error('FAILED:', String((e as Error).message).split('\n')[0]);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
