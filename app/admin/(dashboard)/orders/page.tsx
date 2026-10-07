"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Edit2, Loader2, Check, X, ChevronDown, ChevronRight, Sparkles, CreditCard, FileText } from 'lucide-react';
import { AdminSkeletonRows } from '@/components/skeletons/AdminSkeletons';
import { formatShippingAddress } from '@/lib/qatar';

const money = (v: any) => `QAR ${Number(v || 0).toFixed(2)}`;

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: '', trackingNumber: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const orderId = (order.id || '').toLowerCase();
    const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase();
    const email = (order.user?.email || '').toLowerCase();
    const tracking = (order.trackingNumber || '').toLowerCase();
    return (
      orderId.includes(term) ||
      customerName.includes(term) ||
      email.includes(term) ||
      tracking.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Orders</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders..." 
            suppressHydrationWarning
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary text-sm"
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
                <AdminSkeletonRows rows={8} columns={['40%', '55%', '35%', '30%', '25%']} withActions={false} />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-300 mb-4" />
                      <p>{searchTerm ? 'No orders matching your search.' : 'No orders have been placed yet.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const si = order.shippingInfo || {};
                  const open = expandedId === order.id;
                  return (
                  <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(open ? null : order.id)}
                          className="p-1 text-gray-400 hover:text-primary rounded"
                          title={open ? 'Hide details' : 'Show details'}
                        >
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        {order.id.slice(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.user?.firstName} {order.user?.lastName}<br/>
                      <span className="text-xs text-gray-400">{order.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {money(order.totalAmount)}
                      <div className="mt-1">
                        {order.paymentMethod === 'POINTS' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700"><Sparkles size={10} /> Paid with points</span>
                        ) : order.paymentMethod === 'MIXED' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"><Sparkles size={10} /> Card + points</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600"><CreditCard size={10} /> Card</span>
                        )}
                      </div>
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
                      {/* Money, not fulfilment: an order that is not PAID must not be shipped. */}
                      {order.paymentStatus && order.paymentStatus !== 'PAID' && (
                        <span className="ml-2 px-2 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          {order.paymentStatus}
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
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            className="p-1.5 text-gray-600 hover:text-[#61000B] bg-gray-50 hover:bg-[#61000B]/10 rounded border border-gray-200 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            title="View / Print Tax Invoice"
                          >
                            <FileText size={14} />
                            Invoice
                          </Link>
                          <button 
                            onClick={() => handleEditClick(order)}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium"
                          >
                            <Edit2 size={14} />
                            Update
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-gray-50/40">
                      <td colSpan={6} className="px-6 py-5">
                        <div className="grid gap-6 lg:grid-cols-3">
                          {/* Items */}
                          <div className="lg:col-span-2">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Items ({order.items?.length || 0})
                            </h4>
                            <div className="space-y-1.5">
                              {(order.items || []).length === 0 ? (
                                <p className="text-sm italic text-gray-400">No line items recorded.</p>
                              ) : (
                                (order.items || []).map((it: any) => (
                                  <div key={it.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-gray-800">{it.product?.name || 'Product'}</p>
                                      <p className="text-xs text-gray-400">
                                        Qty {it.quantity}{it.colorName ? ` · ${it.colorName}` : ''}{it.variantSku ? ` · ${it.variantSku}` : ''}
                                      </p>
                                    </div>
                                    <span className="ml-3 whitespace-nowrap font-medium text-gray-700">{money(Number(it.price) * it.quantity)}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          {/* Payment breakdown */}
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Payment</h4>
                            <dl className="space-y-1.5 rounded-lg border border-gray-100 bg-white px-3 py-3 text-sm">
                              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="text-gray-800">{money(order.subtotal)}</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd className="text-gray-800">{Number(order.shippingFee) === 0 ? 'Free' : money(order.shippingFee)}</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd className="text-gray-800">{money(order.tax)}</dd></div>
                              {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-green-600"><dt>Coupon</dt><dd>−{money(order.discount)}</dd></div>
                              )}
                              {Number(order.pointsRedeemed) > 0 && (
                                <div className="flex justify-between text-purple-600"><dt>Points redeemed</dt><dd>{Number(order.pointsRedeemed).toLocaleString()} pts (−{money(order.pointsRedeemed)})</dd></div>
                              )}
                              <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold"><dt className="text-gray-700">Paid</dt><dd className="text-gray-900">{money(order.totalAmount)}</dd></div>
                              <div className="flex justify-between pt-0.5"><dt className="text-gray-500">Method</dt><dd className="font-medium text-gray-700">{order.paymentMethod === 'POINTS' ? 'Membership points' : order.paymentMethod === 'MIXED' ? 'Card + points' : 'Card'}</dd></div>
                            </dl>
                          </div>
                        </div>
                        {/* Delivery & contact + Invoice Quick Button */}
                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 text-sm text-gray-700 flex-1">
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Delivery &amp; Contact</h4>
                            <p className="font-medium">{si.firstName || order.user?.firstName || ''} {si.lastName || order.user?.lastName || ''}</p>
                            {formatShippingAddress(si) && <p className="text-gray-500">{formatShippingAddress(si)}</p>}
                            <p className="text-gray-500">{si.phone || order.user?.phone || '—'} · {si.email || order.user?.email || '—'}</p>
                            {si.receiverPhone && <p className="text-gray-500">Receiver: {si.receiverPhone}</p>}
                            <p className="mt-1 text-xs text-gray-400">Placed {new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}</p>
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <Link
                              href={`/admin/orders/${order.id}/invoice`}
                              target="_blank"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#61000B] hover:bg-[#800010] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                            >
                              <FileText size={15} />
                              Tax Invoice (فاتورة)
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
