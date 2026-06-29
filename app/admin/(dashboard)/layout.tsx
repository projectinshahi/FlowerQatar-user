"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, ShoppingCart, LayoutDashboard, Settings, LogOut, Menu, X, Users } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'All Products', href: '/admin/products', icon: Package },
    { name: 'Add Product', href: '/admin/products/new', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Package },
    { name: 'Brands', href: '/admin/brands', icon: Package },
    { name: 'Product Reviews', href: '/admin/reviews', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 md:w-64 bg-white border-r border-gray-100 shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Lebami Admin</h2>
          <button 
            className="md:hidden text-gray-400 hover:text-gray-900 transition-colors p-2 -mr-2 rounded-full hover:bg-gray-50" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.name}
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-gray-900 text-white shadow-md shadow-gray-900/10' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors w-full font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAFAFA]">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-600 hover:text-black p-2 -ml-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-serif font-bold text-gray-900">Dashboard</h2>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
