'use client';

import Link from 'next/link';
import { logout } from '@/actions/auth';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Analytics', href: '/admin', icon: 'analytics' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'calendar_today' },
  { label: 'Content', href: '/admin/content', icon: 'edit' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Also check current session
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block">
            <span className="material-icons text-4xl text-primary">hourglass_empty</span>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow login page to render without auth
  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - only show for authenticated users */}
      {user && (
        <>
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-56 bg-background-dark transform transition-transform duration-300 ease-in-out flex flex-col lg:relative lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-2 text-white">
                <span className="material-icons text-primary">forest</span>
                {/* <img src="/assets/logo.png" alt="Kamp Lambingan" className="h-6" /> */}
                <span className="font-bold text-sm">Kamp Lambingan</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/50 hover:text-white transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm group"
                >
                  <span className="material-icons text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-2">
              <form action={logout} className="w-full">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm w-full group"
                >
                  <span className="material-icons text-base group-hover:scale-110 transition-transform">logout</span>
                  Logout
                </button>
              </form>
              <Link
                href="/"
                target="_blank"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm group"
              >
                <span className="material-icons text-base group-hover:scale-110 transition-transform">open_in_new</span>
                View Site
              </Link>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {user && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="material-icons">menu</span>
              </button>
              <h1 className="text-gray-900 font-semibold">Admin Panel</h1>
            </div>
            <div className="text-sm text-gray-500">
              Welcome, <span className="font-medium text-gray-700">{user?.email}</span>
            </div>
          </header>
        )}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
