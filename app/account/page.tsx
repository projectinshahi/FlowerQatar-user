'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { PRODUCTS } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import Breadcrumbs from '../../components/Breadcrumbs';
import { Package, MapPin, Heart, LogOut, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  roseColor: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  tracking: string;
  items: OrderItem[];
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  const { wishlist } = useApp();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Expandable Order Details state
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('v_user_authenticated') === 'true';
    if (!isAuth) {
      setAuthenticated(false);
      router.push('/account/login');
    } else {
      setAuthenticated(true);
      setUserName(localStorage.getItem('v_user_name') || 'Savannah Sterling');
      setUserEmail(localStorage.getItem('v_user_email') || 'savannah@sterling.com');
    }
  }, [router]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleLogout = () => {
    localStorage.removeItem('v_user_authenticated');
    localStorage.removeItem('v_user_email');
    localStorage.removeItem('v_user_name');
    router.push('/account/login');
  };

  if (authenticated === null) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-muted font-sans">
        Validating credentials...
      </div>
    );
  }

  if (authenticated === false) return null;

  // Mock Orders History
  const MOCK_ORDERS: Order[] = [
    {
      id: 'VF-498102',
      date: 'June 02, 2026',
      total: 399,
      status: 'Delivered (Preserved)',
      tracking: '1Z999AA10123456784',
      items: [
        { name: 'Grande Round Box', qty: 1, price: 399, roseColor: 'Classic Red' }
      ]
    },
    {
      id: 'VF-312905',
      date: 'April 14, 2026',
      total: 338,
      status: 'Shipped (In Transit)',
      tracking: '1Z999AA10198765432',
      items: [
        { name: 'Classic Square Box', qty: 1, price: 299, roseColor: 'Blush Pink' },
        { name: 'Le Mini Round', qty: 1, price: 39, roseColor: 'Pure White' }
      ]
    }
  ];

  // Resolve Wishlist items
  const wishlistProducts = wishlist
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter((p): p is Product => !!p);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'My Account', href: '/account' }]} />

      {/* Hero Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-divider pb-8 mb-10 gap-4 mt-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold block mb-1">
            Atelier Circle Member
          </span>
          <h1 className="font-serif text-3xl font-medium tracking-wide">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted mt-1">{userEmail}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-4 py-2 border border-divider hover:border-primary text-[10px] uppercase tracking-widest text-muted hover:text-primary transition-all duration-300 bg-cream rounded-none"
        >
          <LogOut size={12} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side Tab Navigation (Col: 3) */}
        <aside className="lg:col-span-3 flex flex-col space-y-2 border-b lg:border-b-0 lg:border-r border-divider/60 pb-6 lg:pb-0 lg:pr-6">
          {[
            { id: 'orders', label: 'Order History', icon: Package },
            { id: 'addresses', label: 'Saved Ateliers', icon: MapPin },
            { id: 'wishlist', label: 'My Wishlist', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 py-3 px-4 text-xs uppercase tracking-widest transition-all text-left rounded-none ${
                  isActive
                    ? 'bg-cream border-l-2 border-secondary font-semibold text-secondary shadow-xs'
                    : 'text-muted/80 hover:text-primary hover:bg-cream/40 border-l-2 border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-secondary' : 'text-muted/50'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Side Tab Contents (Col: 9) */}
        <main className="lg:col-span-9">
          
          {/* TAB 1: Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-primary mb-6">Your Placements</h2>
              
              <div className="space-y-4">
                {MOCK_ORDERS.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <div key={order.id} className="border border-divider bg-white">
                      {/* Summary Banner bar */}
                      <div
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-cream/30 transition-colors"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-[10px] text-muted uppercase tracking-widest block">Reference</span>
                            <span className="font-semibold text-primary">{order.id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted uppercase tracking-widest block">Date placed</span>
                            <span className="text-muted/90">{order.date}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted uppercase tracking-widest block">Total Cost</span>
                            <span className="font-semibold text-secondary">${order.total}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted uppercase tracking-widest block">Delivery Status</span>
                            <span className="text-secondary font-medium">{order.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-muted font-semibold border-b border-transparent group-hover:border-gray/50">
                          <span>Details</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                      </div>

                      {/* Expanded Details panel */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-4 border-t border-divider/50 space-y-4 animate-in fade-in duration-300">
                          <h4 className="text-[10px] uppercase tracking-widest font-semibold text-primary mb-2">Preserved Items List</h4>
                          <div className="divide-y divide-divider/40">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-semibold text-primary">{item.name}</span>
                                  <span className="text-muted block text-[10px] uppercase mt-0.5">Rose Option: {item.roseColor}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-muted block">Qty: {item.qty}</span>
                                  <span className="font-semibold text-primary">${item.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Tracking Info */}
                          <div className="pt-4 border-t border-divider/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-secondary" />
                              <span>Insured Tracking: <span className="font-semibold text-primary select-all">{order.tracking}</span></span>
                            </span>
                            <a
                              href="https://ups.com"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-secondary font-semibold hover:text-primary transition-colors"
                            >
                              <span>Track Package</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-primary mb-6">Default Shipping Atelier</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-divider p-6 bg-white relative">
                  <span className="absolute top-4 right-4 bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold">
                    Primary
                  </span>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-primary mb-3">Residential Address</h3>
                  <div className="text-xs text-muted space-y-1">
                    <p className="font-medium text-primary">{userName}</p>
                    <p>145 East 74th Street, Apt 4B</p>
                    <p>New York, NY 10021</p>
                    <p>United States</p>
                    <p className="pt-2 text-muted/80">Phone: 212-555-0199</p>
                  </div>
                  
                  <div className="flex gap-4 border-t border-divider mt-6 pt-4 text-[10px] uppercase tracking-widest font-semibold text-secondary">
                    <button className="hover:text-primary transition-colors">Edit Details</button>
                    <button className="hover:text-primary transition-colors text-muted/50">Delete</button>
                  </div>
                </div>

                <div className="border border-dashed border-divider p-6 bg-cream/20 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-cream/40 transition-colors">
                  <span className="text-xs uppercase tracking-widest text-muted font-semibold">+ Add Address</span>
                  <p className="text-[10px] text-muted/60 leading-relaxed max-w-[160px]">Save multiple billing or white-glove courier locations.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Wishlist Grid */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-primary mb-6">My Favorites</h2>

              {wishlistProducts.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-divider bg-cream space-y-4">
                  <p className="text-xs text-muted italic">You haven't added any arrangements to your wishlist yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block bg-primary hover:bg-secondary text-white text-xs uppercase tracking-widest py-3 px-6 transition-colors shadow-sm rounded-none"
                  >
                    View Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center font-sans text-muted">
        Loading Atelier Profile...
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
