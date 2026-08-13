import { NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/actions/product.actions';
import { guardAdmin } from '@/lib/admin-guard';
import { ProductStatus } from '@prisma/client';

export async function POST(request: Request) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createProduct(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as ProductStatus) || undefined;
    // Narrow to one subcategory, or to every subcategory under one fixed category.
    const subcategoryId = searchParams.get('subcategoryId') || undefined;
    const categoryName = searchParams.get('categoryName') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getProducts({ search, status, subcategoryId, categoryName, page, limit });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
