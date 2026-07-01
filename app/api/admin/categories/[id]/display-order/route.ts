import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const displayOrderSchema = z.object({
  displayOrder: z.coerce.number().int()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const validatedData = displayOrderSchema.parse(body);

    const updatedCategory = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: { displayOrder: validatedData.displayOrder }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category display order:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category display order' }, { status: 500 });
  }
}
