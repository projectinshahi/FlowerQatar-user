"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash, Copy, MoreVertical, Eye } from "lucide-react";
import { bulkDeleteProducts, bulkUpdateProductStatus, deleteProduct } from "@/lib/actions/product.actions";

export default function ProductTable({ products, pagination }: { products: any[], pagination: any }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
              const primaryImage = product.variants?.[0]?.images?.[0]?.url;
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
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.variants?.length || 0} variants</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">QAR {Number(product.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                      product.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 
                      product.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
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
      
      {/* Pagination (Simplified) */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <div>Showing {products.length} of {pagination.total} products</div>
        <div className="flex gap-1">
          <button disabled={pagination.page <= 1} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
          <button disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
