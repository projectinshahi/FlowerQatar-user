import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/category';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;

    const where = search ? {
      name: { contains: search, mode: 'insensitive' as const }
    } : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.count({ where })
    ]);

    return NextResponse.json({
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = categorySchema.parse(body);
    
    // Check if name is unique
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name must be unique' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Ensure slug is unique
    const existingSlug = await prisma.category.findUnique({
      where: { slug }
    });

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug: finalSlug,
      }
    });

    revalidatePath('/');
    revalidatePath('/shop');
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
