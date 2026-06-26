"use client";

import { useState, useEffect } from 'react';
import { Package, Search, Edit2, Loader2, Check, X } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: '', trackingNumber: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (order: any) => {
    setEditingId(order.id);
    setEditForm({
      status: order.status || 'PENDING',
      trackingNumber: order.trackingNumber || '',
    });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editForm.status,
          trackingNumber: editForm.trackingNumber || null
        })
      });

      if (res.ok) {
        // Update local state
        setOrders(orders.map(o => o.id === id ? { ...o, status: editForm.status, trackingNumber: editForm.trackingNumber } : o));
        setEditingId(null);
      } else {
        alert('Failed to update tracking info.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Orders</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Order ID</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Customer</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Total</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Tracking No.</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-300 mb-4" />
                      <p>No orders have been placed yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.user?.firstName} {order.user?.lastName}<br/>
                      <span className="text-xs text-gray-400">{order.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      QAR {Number(order.totalAmount).toFixed(2)}
                    </td>
                    
                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {editingId === order.id ? (
                        <select 
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      )}
                    </td>

                    {/* Tracking Column */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {editingId === order.id ? (
                        <input
                          type="text"
                          value={editForm.trackingNumber}
                          onChange={(e) => setEditForm({...editForm, trackingNumber: e.target.value})}
                          placeholder="e.g. FEDEX123"
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                        />
                      ) : (
                        order.trackingNumber ? (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-xs">
                            {order.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      {editingId === order.id ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleSave(order.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50"
                            title="Save"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEditClick(order)}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 text-sm font-medium"
                        >
                          <Edit2 size={16} />
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
