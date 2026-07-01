import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/product';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const productName = validatedData.name || validatedData.variants[0]?.variantName || "Untitled Product";
    let finalSlug = validatedData.slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!validatedData.slug) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: finalSlug }
      });
      if (existingProduct) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: productName,
        slug: finalSlug,

        categoryId: validatedData.categoryId,
        brandId: validatedData.brandId,
        status: validatedData.status as any,


        variants: {
          create: validatedData.variants.map((v) => ({
            variantName: v.variantName,
            sku: v.sku,
            color: v.color,
            colorCode: v.colorCode,
            material: v.material,
            price: v.price,
            salePrice: v.salePrice,
            isDefault: v.isDefault,
            isActive: v.isActive,
            description: v.description,
            details: v.details,
            productCare: v.productCare,
            hoverImage: v.hoverImage,
            videoUrl: v.videoUrl,
            swatchImage: v.swatchImage,
            images: {
              create: v.images.map((img) => ({
                url: img.url,
                publicId: img.publicId,
                isPrimary: img.isPrimary,
                isHover: img.isHover,
                isGallery: img.isGallery,
                order: img.order
              }))
            }
          }))
        },
        specifications: {
          create: validatedData.specifications.map(s => ({
            title: s.title,
            value: s.value
          }))
        },
        faqs: {
          create: validatedData.faqs.map(f => ({
            question: f.question,
            answer: f.answer
          }))
        },
        ...(validatedData.seo ? {
          seo: {
            create: {
              seoTitle: validatedData.seo.seoTitle,
              metaDescription: validatedData.seo.metaDescription,
              keywords: validatedData.seo.keywords,
            }
          }
        } : {})
      },
      include: {
        variants: { include: { images: true } },
        specifications: true,
        faqs: true,
        seo: true
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: true,
          variants: {
            include: { images: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
