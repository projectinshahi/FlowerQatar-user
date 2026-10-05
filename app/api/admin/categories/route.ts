import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { logDbError } from '@/lib/prisma-error';
import { FIXED_CATEGORY_TYPES } from '@/lib/category-config';

/** Active parents for the searchable subcategory form selector. */
export async function GET() {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    // Fixed categories are provisioned once on demand. This makes fresh deployments
    // usable immediately while leaving an explicitly inactive parent inactive. Only the
    // missing ones are written, so the usual request is a single read.
    let rows = await prisma.category.findMany({ select: { id: true, name: true, isActive: true } });
    const missing = FIXED_CATEGORY_TYPES.filter((name) => !rows.some((r) => r.name === name));
    if (missing.length) {
      await prisma.$transaction(missing.map((name) => prisma.category.upsert({ where: { name }, create: { name }, update: {} })));
      rows = await prisma.category.findMany({ select: { id: true, name: true, isActive: true } });
    }
    const byName = new Map(rows.filter((r) => r.isActive).map(({ id, name }) => [name, { id, name }]));
    const categories = FIXED_CATEGORY_TYPES.map((name) => byName.get(name)).filter((category): category is NonNullable<typeof category> => Boolean(category));
    return NextResponse.json({ categories });
  } catch (error) { logDbError('GET /admin/categories', error); return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 }); }
}
