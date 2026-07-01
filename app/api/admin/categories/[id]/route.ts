import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/category';
import { z } from 'zod';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const category = await prisma.category.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = categorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if name is unique (excluding self)
    if (validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: validatedData.name }
      });
      if (nameExists) {
        return NextResponse.json({ error: 'Category name must be unique' }, { status: 400 });
      }
    }

    // If image changed, delete old image from Cloudinary
    if (existingCategory.imagePublicId && existingCategory.imagePublicId !== validatedData.imagePublicId) {
      await deleteCloudinaryImage(existingCategory.imagePublicId).catch(console.error);
    }

    // Generate slug from name
    let finalSlug = existingCategory.slug;
    if (validatedData.name !== existingCategory.name) {
      const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const slugExists = await prisma.category.findFirst({
        where: { slug, id: { not: resolvedParams.id } }
      });
      finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: {
        ...validatedData,
        slug: finalSlug,
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    const category = await prisma.category.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json({ error: 'Cannot delete category with associated products' }, { status: 400 });
    }

    // Delete image from Cloudinary
    if (category.imagePublicId) {
      await deleteCloudinaryImage(category.imagePublicId).catch(console.error);
    }

    // Delete from database
    await prisma.category.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
