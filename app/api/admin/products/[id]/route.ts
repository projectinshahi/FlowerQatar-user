import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/product';
import { z } from 'zod';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: { images: true }
        },
        specifications: true,
        faqs: true,
        seo: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { include: { images: true } },
        specifications: true,
        faqs: true,
        seo: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prepare name and slug
    const productName = validatedData.name || validatedData.variants[0]?.variantName || "Untitled Product";
    let finalSlug = product.slug;

    if (validatedData.slug && validatedData.slug !== product.slug) {
      const existingProduct = await prisma.product.findUnique({ where: { slug: validatedData.slug } });
      if (existingProduct && existingProduct.id !== params.id) {
        return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 });
      }
      finalSlug = validatedData.slug;
    } else if (productName !== product.name) {
      const baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingProduct = await prisma.product.findUnique({ where: { slug: baseSlug } });
      finalSlug = (existingProduct && existingProduct.id !== params.id) ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    // For a complex PUT, we will delete nested items and recreate them to ensure synchronization.
    // In a highly optimized system, we would do a diff, but delete-and-recreate is safer and easier to guarantee consistency for collections.
    // However, variants have IDs that might be linked to OrderItems, so we CANNOT just delete all variants! 
    // We MUST do a diff.

    // Calculate Variants to Delete, Update, and Create
    const existingVariantIds = product.variants.map(v => v.id);
    const incomingVariantIds = validatedData.variants.map(v => v.id).filter(id => id) as string[];
    const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));

    // Calculate Specs to Delete
    const existingSpecIds = product.specifications.map(s => s.id);
    const incomingSpecIds = validatedData.specifications.map(s => s.id).filter(id => id) as string[];
    const specsToDelete = existingSpecIds.filter(id => !incomingSpecIds.includes(id));

    // Calculate FAQs to Delete
    const existingFaqIds = product.faqs.map(f => f.id);
    const incomingFaqIds = validatedData.faqs.map(f => f.id).filter(id => id) as string[];
    const faqsToDelete = existingFaqIds.filter(id => !incomingFaqIds.includes(id));

    // Using a transaction for the entire update
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Delete removed items
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: variantsToDelete } } });
      }
      if (specsToDelete.length > 0) {
        await tx.productSpecification.deleteMany({ where: { id: { in: specsToDelete } } });
      }
      if (faqsToDelete.length > 0) {
        await tx.productFAQ.deleteMany({ where: { id: { in: faqsToDelete } } });
      }

      // 2. Update base product
      const p = await tx.product.update({
        where: { id: params.id },
        data: {
          name: productName,
          slug: finalSlug,

          categoryId: validatedData.categoryId,
          brandId: validatedData.brandId,
          status: validatedData.status as any,

        }
      });

      // 3. Upsert Variants
      for (const variant of validatedData.variants) {
        if (variant.id) {
          // Update existing variant
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              variantName: variant.variantName,
              sku: variant.sku,
              color: variant.color,
              colorCode: variant.colorCode,
              material: variant.material,

              price: variant.price,
              salePrice: variant.salePrice,

              isDefault: variant.isDefault,
              isActive: variant.isActive,
              description: variant.description,
              details: variant.details,
              productCare: variant.productCare,
              hoverImage: variant.hoverImage,
              videoUrl: variant.videoUrl,
              swatchImage: variant.swatchImage,
            }
          });

          // Handle images for this variant: delete missing, create/update remaining
          const existingImages = product.variants.find(v => v.id === variant.id)?.images || [];
          const incomingImageIds = variant.images.map(img => img.id).filter(id => id) as string[];
          const imagesToDelete = existingImages.filter(img => !incomingImageIds.includes(img.id));
          
          if (imagesToDelete.length > 0) {
            await tx.productVariantImage.deleteMany({ where: { id: { in: imagesToDelete.map(img => img.id) } } });
          }

          for (const img of variant.images) {
            if (img.id) {
              await tx.productVariantImage.update({
                where: { id: img.id },
                data: {
                  url: img.url,
                  publicId: img.publicId,
                  isPrimary: img.isPrimary,
                  isHover: img.isHover,
                  isGallery: img.isGallery,
                  order: img.order
                }
              });
            } else {
              await tx.productVariantImage.create({
                data: {
                  productVariantId: variant.id,
                  url: img.url,
                  publicId: img.publicId,
                  isPrimary: img.isPrimary,
                  isHover: img.isHover,
                  isGallery: img.isGallery,
                  order: img.order
                }
              });
            }
          }
        } else {
          // Create new variant
          await tx.productVariant.create({
            data: {
              productId: p.id,
              variantName: variant.variantName,
              sku: variant.sku,
              color: variant.color,
              colorCode: variant.colorCode,
              material: variant.material,

              price: variant.price,
              salePrice: variant.salePrice,

              isDefault: variant.isDefault,
              isActive: variant.isActive,
              description: variant.description,
              details: variant.details,
              productCare: variant.productCare,
              hoverImage: variant.hoverImage,
              videoUrl: variant.videoUrl,
              swatchImage: variant.swatchImage,
              images: {
                create: variant.images.map((img) => ({
                  url: img.url,
                  publicId: img.publicId,
                  isPrimary: img.isPrimary,
                  isHover: img.isHover,
                  isGallery: img.isGallery,
                  order: img.order
                }))
              }
            }
          });
        }
      }

      // 4. Upsert Specifications
      for (const spec of validatedData.specifications) {
        if (spec.id) {
          await tx.productSpecification.update({
            where: { id: spec.id },
            data: { title: spec.title, value: spec.value }
          });
        } else {
          await tx.productSpecification.create({
            data: { productId: p.id, title: spec.title, value: spec.value }
          });
        }
      }

      // 5. Upsert FAQs
      for (const faq of validatedData.faqs) {
        if (faq.id) {
          await tx.productFAQ.update({
            where: { id: faq.id },
            data: { question: faq.question, answer: faq.answer }
          });
        } else {
          await tx.productFAQ.create({
            data: { productId: p.id, question: faq.question, answer: faq.answer }
          });
        }
      }

      // 6. Upsert SEO
      if (validatedData.seo) {
        if (product.seo) {
          await tx.productSEO.update({
            where: { productId: p.id },
            data: {
              seoTitle: validatedData.seo.seoTitle,
              metaDescription: validatedData.seo.metaDescription,
              keywords: validatedData.seo.keywords,
            }
          });
        } else {
          await tx.productSEO.create({
            data: {
              productId: p.id,
              seoTitle: validatedData.seo.seoTitle,
              metaDescription: validatedData.seo.metaDescription,
              keywords: validatedData.seo.keywords,
            }
          });
        }
      } else if (product.seo) {
        await tx.productSEO.delete({ where: { productId: p.id } });
      }

      return await tx.product.findUnique({
        where: { id: params.id },
        include: {
          variants: { include: { images: true } },
          specifications: true,
          faqs: true,
          seo: true
        }
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Failed to update product:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: { images: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete images from Cloudinary first
    for (const variant of product.variants) {
      for (const image of variant.images) {
        if (image.publicId) {
          await deleteCloudinaryImage(image.publicId).catch(err => console.error('Failed to delete image:', err));
        }
      }
    }

    // Prisma Cascade delete will handle related items
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
