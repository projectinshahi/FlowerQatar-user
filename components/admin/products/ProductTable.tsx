"use client";

import { stillOf } from "@/lib/media";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Edit, Trash, Eye } from "lucide-react";
import { bulkUpdateProductStatus, deleteProduct } from "@/lib/actions/product.actions";
import type { ProductVariant } from "@/types/product-detail";

/** A product as the table receives it: the Prisma row after JSON serialization. */
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  country: string | null;
  status: string;
  /** JSON column; anything that is not an array has no variants. */
  variants: unknown;
  subcategory?: { name?: string } | null;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
}

/**
 * Prev/Next control. Module scope, not defined inside the table, so React keeps the same
 * component identity across renders instead of remounting it on every keystroke.
 */
function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="px-3 py-1 border border-gray-200 rounded-md opacity-50 select-none"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
    >
      {label}
    </Link>
  );
}

export default function ProductTable({ products, pagination }: { products: ProductRow[]; pagination: Pagination }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  /**
   * Builds the href for a page, keeping every other filter that is already in the URL
   * (search, status, sortBy). Rebuilding from scratch would silently drop the admin's
   * filters the moment they paged past the first screen.
   */
  const hrefForPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  };

  // Human-readable range for the current page, e.g. "11–17 of 17". Page size comes from the
  // server's own pagination payload so the two can't drift apart.
  const perPage = pagination.limit || products.length || 10;
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * perPage + 1;
  const rangeEnd = Math.min(pagination.page * perPage, pagination.total);

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsLoading(true);
    await deleteProduct(id);
    setIsLoading(false);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    if (action === "delete") {
      if (confirm("Delete selected products?")) {
        // await bulkDeleteProducts(selectedIds);
      }
    } else if (action === "publish") {
      await bulkUpdateProductStatus(selectedIds, "PUBLISHED");
    } else if (action === "archive") {
      await bulkUpdateProductStatus(selectedIds, "ARCHIVED");
    } else if (action === "draft") {
      await bulkUpdateProductStatus(selectedIds, "DRAFT");
    }
    setSelectedIds([]);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction("publish")} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">Publish</button>
            <button onClick={() => handleBulkAction("draft")} className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors">Draft</button>
            <button onClick={() => handleBulkAction("archive")} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md font-medium hover:bg-orange-100 transition-colors">Archive</button>
            <button onClick={() => handleBulkAction("delete")} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-md font-medium hover:bg-red-100 transition-colors">Delete</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input type="checkbox" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                  checked={products.length > 0 && selectedIds.length === products.length} 
                  onChange={toggleSelectAll} 
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No products found.</td></tr>
            ) : products.map((product) => {
              const variants = (Array.isArray(product.variants) ? product.variants : []) as ProductVariant[];
              const allColors = variants.flatMap((v) => v?.colorVariants || []);
              const firstColor = allColors[0];
              const galleryImages = (firstColor?.galleryImages || []).filter((img) => img?.type !== "video");
              // Main media first — the Color Swatch upload — as a still: a video shows its poster frame.
              const primaryImage =
                stillOf(firstColor?.swatchImage) ||
                (galleryImages.find((img) => img.isPrimary) || galleryImages[0])?.url ||
                stillOf(firstColor?.hoverImage);

              // Price range across all color variants (effective = salePrice ?? price)
              const effectivePrices = allColors
                .map((cv) => (cv?.salePrice ?? cv?.price))
                .filter((p) => p != null)
                .map((p) => Number(p));
              const minPrice = effectivePrices.length ? Math.min(...effectivePrices) : null;
              const maxPrice = effectivePrices.length ? Math.max(...effectivePrices) : null;
              const basePrice = firstColor?.price != null ? Number(firstColor.price) : null;
              const salePrice = firstColor?.salePrice != null ? Number(firstColor.salePrice) : null;
              const onSale = basePrice != null && salePrice != null && salePrice < basePrice;

              const colorCount = allColors.length;

              const flags = [
                product.isFeatured && "Featured",
                product.isBestSeller && "Best Seller",
                product.isTrending && "Trending",
                product.isNewArrival && "New Arrival",
              ].filter(Boolean) as string[];

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <img src={primaryImage} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {product.sku ? <span className="font-mono">{product.sku}</span> : "No SKU"}
                          {product.country && (
                            <>
                              <span className="mx-1.5 text-gray-300">·</span>
                              <span className="text-gray-600 font-medium">{product.country}</span>
                            </>
                          )}
                          <span className="mx-1.5 text-gray-300">·</span>
                          {variants.length} {variants.length === 1 ? "variant" : "variants"}
                          <span className="mx-1.5 text-gray-300">·</span>
                          {colorCount} {colorCount === 1 ? "color" : "colors"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.subcategory?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {minPrice == null ? (
                      <span className="text-gray-400">—</span>
                    ) : onSale ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-gray-900 font-medium">QAR {salePrice!.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 line-through">QAR {basePrice!.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        QAR {minPrice.toFixed(2)}
                        {maxPrice != null && maxPrice !== minPrice && ` – ${maxPrice.toFixed(2)}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex w-fit px-2 py-1 text-xs rounded-full font-medium ${
                        product.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' :
                        product.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {product.status}
                      </span>
                      {flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {flags.map((f) => (
                            <span key={f} className="inline-flex px-1.5 py-0.5 text-[10px] rounded font-medium bg-indigo-50 text-indigo-700">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {product.slug && (
                        <Link href={`/product/${product.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="View on storefront">
                          <Eye size={16} />
                        </Link>
                      )}
                      <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/*
        Pagination. These were plain <button>s with no handler and no href — correctly
        disabled, but clicking them did nothing, so only page 1 was ever reachable.
        The page lives in the URL (`?page=`), which the server component already reads, so
        links are the right control: shareable, back-button friendly, no client state.
      */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {rangeStart}–{rangeEnd} of {pagination.total} products
        </div>
        <nav className="flex items-center gap-1" aria-label="Product pages">
          <PageLink
            href={hrefForPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            label="Prev"
          />
          <span className="px-2 tabular-nums" aria-current="page">
            {pagination.page} / {Math.max(1, pagination.totalPages)}
          </span>
          <PageLink
            href={hrefForPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            label="Next"
          />
        </nav>
      </div>
    </div>
  );
}
