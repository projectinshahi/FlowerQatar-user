import { getServerSession } from 'next-auth/react';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkoutAddressSchema } from '@/schema/payment.schema';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomUUID } from 'crypto';

/**
 * POST /api/checkout/address
 * Saves the shipping address for the authenticated user.
 * The address is upserted into `saved_address` table and linked to the user.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutAddressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid address data', details: parsed.error.format() }, { status: 400 });
    }

    // Upsert address manually to avoid Prisma relation strictness if User tables mismatch
    const mappedAddress = {
      type: "HOME",
      name: parsed.data.fullName,
      phone: parsed.data.phone,
      address: `${parsed.data.addressLine1}${parsed.data.addressLine2 ? ', ' + parsed.data.addressLine2 : ''}`,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      isDefault: true,
    };

    // Determine user ID safely
    const userId = session.user.id ?? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find existing address for this user
    const existingAddress = await prisma.savedAddress.findFirst({
      where: { userId, isDefault: true },
    });

    let savedAddress;
    if (existingAddress) {
      // Update using raw SQL to bypass strict prisma schema relations if needed
      await prisma.$executeRaw`
        UPDATE saved_addresses 
        SET name = ${mappedAddress.name}, phone = ${mappedAddress.phone}, address = ${mappedAddress.address}, city = ${mappedAddress.city}, state = ${mappedAddress.state}, pincode = ${mappedAddress.pincode}
        WHERE id = ${existingAddress.id}
      `;
      savedAddress = { ...existingAddress, ...mappedAddress };
    } else {
      const newId = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO saved_addresses (id, user_id, type, name, phone, address, city, state, pincode, is_default, created_at, updated_at)
        VALUES (${newId}, ${userId}, ${mappedAddress.type}, ${mappedAddress.name}, ${mappedAddress.phone}, ${mappedAddress.address}, ${mappedAddress.city}, ${mappedAddress.state}, ${mappedAddress.pincode}, true, NOW(), NOW())
      `;
      savedAddress = { id: newId, userId, ...mappedAddress };
    }

    return NextResponse.json({ success: true, address: savedAddress }, { status: 200 });
  } catch (error) {
    console.error("Address save error:", error);
    return NextResponse.json({ 
      error: "Failed to save address", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
