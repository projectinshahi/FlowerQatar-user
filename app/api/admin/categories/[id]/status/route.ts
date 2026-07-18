import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';

const statusSchema = z.object({
  status: z.boolean()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const validatedData = statusSchema.parse(body);

    const updatedCategory = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: { status: validatedData.status }
    });

    revalidatePath('/');
    revalidatePath('/shop');
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category status' }, { status: 500 });
  }
}
