import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { logDbError } from '@/lib/prisma-error';

const patchSchema = z.object({ status: z.enum(['NEW', 'READ', 'RESOLVED']) }).strict();

/** PATCH — move an enquiry through New → Read → Resolved. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const { status } = patchSchema.parse(await request.json());
    const updated = await prisma.contactEnquiry.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    logDbError('PATCH /admin/contact-enquiries/[id]', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.contactEnquiry.delete({ where: { id } });
    return NextResponse.json({ message: 'Enquiry deleted' });
  } catch (error) {
    logDbError('DELETE /admin/contact-enquiries/[id]', error);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}
