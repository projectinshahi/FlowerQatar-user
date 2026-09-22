import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { subcategoryReorderSchema } from '@/lib/validations/subcategory';
import { publishChange } from '@/lib/live-sync';
import { logDbError } from '@/lib/prisma-error';
import { z } from 'zod';

/**
 * Persist a drag-and-drop order for ONE section.
 *
 * The client sends the whole ordered id list, so positions are always rewritten as a dense
 * 1..n sequence — dragging can never leave gaps or duplicates like 1,2,2,4,7. The two
 * sections write different columns, which is what keeps their orders independent.
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const { section, ids } = subcategoryReorderSchema.parse(await request.json());
    const column = section === 'navigation' ? 'navigationPosition' : 'gardenPosition';

    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Duplicate subcategory in the new order' }, { status: 400 });
    }

    const found = await prisma.subcategory.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      return NextResponse.json({ error: 'One or more subcategories no longer exist' }, { status: 404 });
    }

    // One transaction so a half-written order can never be observed by the storefront.
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.subcategory.update({ where: { id }, data: { [column]: index + 1 } })
      )
    );

    publishChange({ type: 'subcategory.updated', ids });
    return NextResponse.json({ message: 'Order updated successfully', section, count: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    logDbError('POST /admin/subcategories/reorder', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
