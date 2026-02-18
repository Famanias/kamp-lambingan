import Link from 'next/link';
import { logout } from '@/actions/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'calendar_today' },
  { label: 'Content', href: '/admin/content', icon: 'edit' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-background-dark flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <span className="material-icons text-primary">forest</span>
            <span className="font-bold text-sm">Kamp Lambingan</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <span className="material-icons text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm w-full"
            >
              <span className="material-icons text-base">logout</span>
              Logout
            </button>
          </form>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm mt-1"
          >
            <span className="material-icons text-base">open_in_new</span>
            View Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-gray-900 font-semibold">Admin Panel</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
