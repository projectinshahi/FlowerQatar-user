import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath, revalidateTag } from 'next/cache';
import { subcategoryReorderSchema } from '@/lib/validations/subcategory';
import { NAV_MENU_TAG } from '@/lib/subcategories';
import { logDbError } from '@/lib/prisma-error';

/**
 * Persist a drag-and-drop reorder. The client sends the non-pinned ids in their new
 * order; each gets displayOrder = index + 1 (0 stays reserved for the pinned "All …"
 * row, which always sorts first). One transaction so the list never lands half-ordered.
 */
export async function PATCH(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { ids } = subcategoryReorderSchema.parse(await request.json());
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.subcategory.update({ where: { id }, data: { displayOrder: index + 1 } })
      )
    );
    revalidateTag(NAV_MENU_TAG, 'max');
    revalidatePath('/', 'layout');
    return NextResponse.json({ message: 'Order updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    logDbError('PATCH /subcategories/reorder', error);
    return NextResponse.json({ error: 'Failed to reorder subcategories' }, { status: 500 });
  }
}
