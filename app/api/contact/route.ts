import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import { SUBJECT_KEYS } from '@/lib/contact-message';

/**
 * POST /api/contact — record a storefront enquiry.
 *
 * The form also opens WhatsApp, but that hand-off leaves no record: the message lives only in
 * the customer's own WhatsApp until they press send, and anything abandoned there is lost.
 * Persisting first means the admin sees every enquiry either way.
 *
 * Public by necessity — the contact form is for guests.
 */
const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(255),
  subject: z.enum(SUBJECT_KEYS as [string, ...string[]]),
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
        { status: 400 }
      );
    }

    const enquiry = await prisma.contactEnquiry.create({
      data: parsed.data,
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ success: true, id: enquiry.id }, { status: 201 });
  } catch (error) {
    logDbError('POST /api/contact', error);
    return NextResponse.json({ error: 'Could not send your message' }, { status: 500 });
  }
}
