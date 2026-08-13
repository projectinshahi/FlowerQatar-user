"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Plus, Search, MoreVertical, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSkeletonRows } from '@/components/skeletons/AdminSkeletons';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  hoverColor: string;
  exploreMore: boolean;
  status: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/categories?search=${search}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentStatus }),
      });
      if (res.ok) {
        setCategories(categories.map(c => c.id === id ? { ...c, status: !currentStatus } : c));
        toast.success('Status updated');
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== deleteId));
        toast.success('Category deleted successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition"
          />
        </div>
        <Link 
          href="/admin/categories/new"
          className="flex items-center gap-2 bg-[#A83A22] text-white px-5 py-2.5 rounded-xl hover:bg-[#8e311d] transition whitespace-nowrap font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Category</th>
                <th className="p-4">Hover Color</th>
                <th className="p-4">Display Order</th>
                <th className="p-4">Explore More</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <AdminSkeletonRows rows={6} withImage columns={['55%', '35%', '30%', '40%', '25%']} />
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-orange-300" />
                      </div>
                      <p className="text-gray-900 font-medium text-lg">No Categories Found</p>
                      <p className="text-gray-500 mt-1">Try adjusting your search or add a new category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                          <Image src={category.image} alt={category.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md shadow-sm border border-gray-200" 
                          style={{ backgroundColor: category.hoverColor }} 
                        />
                        <span className="text-sm text-gray-600 font-mono uppercase">{category.hoverColor}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                        {category.displayOrder}
                      </span>
                    </td>
                    <td className="p-4">
                      {category.exploreMore ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          <X className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(category.id, category.status)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#A83A22] focus:ring-offset-2 ${category.status ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.status ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {new Date(category.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/categories/${category.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setDeleteId(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Category</h3>
            <p className="text-center text-gray-500 mb-6">
              Are you sure you want to delete this category? This action cannot be undone and will permanently remove the image from Cloudinary.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
