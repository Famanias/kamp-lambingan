import { getBookings } from '@/actions/bookings';
import Link from 'next/link';

export const metadata = { title: 'Dashboard – Admin' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function AdminDashboard() {
  const { data: bookings } = await getBookings();

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: total, icon: 'book_online', color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: pending, icon: 'pending', color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Confirmed', value: confirmed, icon: 'check_circle', color: 'text-green-600 bg-green-50' },
          { label: 'Cancelled', value: cancelled, icon: 'cancel', color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${stat.color}`}>
              <span className="material-icons text-sm">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <Link href="/admin/bookings" className="text-sm text-primary font-medium hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase">
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Check-in</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{b.guest_name}</p>
                      <p className="text-gray-400 text-xs">{b.guest_email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{b.package_name}</td>
                    <td className="px-5 py-3 text-gray-700">{b.check_in}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="text-primary hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/content"
          className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-primary text-sm">edit</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Edit Site Content</p>
            <p className="text-sm text-gray-500">Update hero, packages, FAQs, etc.</p>
          </div>
        </Link>
        <Link
          href="/admin/bookings"
          className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <span className="material-icons text-yellow-600 text-sm">pending</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manage Bookings</p>
            <p className="text-sm text-gray-500">{pending} pending confirmation</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
