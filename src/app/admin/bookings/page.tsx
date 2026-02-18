import { getBookings } from '@/actions/bookings';
import Link from 'next/link';

export const metadata = { title: 'Bookings – Admin' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const { data: allBookings } = await getBookings();

  const bookings = filterStatus
    ? allBookings.filter((b) => b.status === filterStatus)
    : allBookings;

  const counts = {
    all: allBookings.length,
    pending: allBookings.filter((b) => b.status === 'pending').length,
    confirmed: allBookings.filter((b) => b.status === 'confirmed').length,
    cancelled: allBookings.filter((b) => b.status === 'cancelled').length,
  };

  const FILTERS = [
    { key: undefined, label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Bookings</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.key ? `/admin/bookings?status=${f.key}` : '/admin/bookings'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === f.key || (!filterStatus && !f.key)
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label} ({f.count})
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase">
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Guests</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{b.guest_name}</p>
                      <p className="text-gray-400 text-xs">{b.guest_email}</p>
                      <p className="text-gray-400 text-xs">{b.guest_phone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{b.package_name}</td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      <p>{b.check_in}</p>
                      <p className="text-gray-400 text-xs">to {b.check_out}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{b.pax}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="text-primary hover:underline text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
