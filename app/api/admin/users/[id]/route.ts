import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin, getCurrentUser } from '@/lib/admin-guard';

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;
type Role = (typeof ROLES)[number];

/*
 * Guard rails for user administration. Before these, any ADMIN could set any role, including
 * promoting themselves to SUPER_ADMIN, and hard-delete any account. Deleting a user cascades
 * to their orders (Order.user is onDelete: Cascade), so it also erased order history.
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const role: unknown = body?.role;
    const isActive: unknown = body?.isActive;
    if (role !== undefined && !ROLES.includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const roleChanges = role !== undefined && role !== target.role;
    const statusChanges = isActive !== undefined && isActive !== target.isActive;
    if (id === me.id && (roleChanges || statusChanges)) {
      return NextResponse.json({ error: 'You cannot change your own role or status.' }, { status: 403 });
    }
    if (me.role !== 'SUPER_ADMIN' && (target.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Only a super admin can grant or change super-admin access.' }, { status: 403 });
    }

    const dataToUpdate: { role?: Role; isActive?: boolean } = {};
    if (role !== undefined) dataToUpdate.role = role as Role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive as boolean;

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
  } catch (error) {
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
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (id === me.id) {
      return NextResponse.json({ error: 'You cannot delete your own account here.' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, _count: { select: { orders: true } } },
    });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a super admin can delete a super admin.' }, { status: 403 });
    }
    // Deleting cascades to orders; keep order history by deactivating instead.
    if (target._count.orders > 0) {
      return NextResponse.json(
        { error: 'This user has orders. Deactivate the account instead so order history is kept.' },
        { status: 409 }
      );
    }

    await prisma.user.delete({
      where: {
        id,
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
