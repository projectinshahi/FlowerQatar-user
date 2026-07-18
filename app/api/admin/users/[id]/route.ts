import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, isActive } = body;

    // Prevent removing the last super admin or modifying oneself if not careful, 
    // but for this basic implementation we will just update.
    
    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return NextResponse.json({ message: 'User updated successfully', user });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: {
        id,
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
