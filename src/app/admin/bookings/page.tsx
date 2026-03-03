import { getBookings } from '@/actions/bookings';
import Link from 'next/link';
import BookingsTable from './BookingsTable';

export const metadata = { title: 'Bookings – Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const { status: filterStatus, view } = await searchParams;
  const isArchiveView = view === 'archive';

  const { data: allBookings } = await getBookings(isArchiveView);

  const bookings = filterStatus && !isArchiveView
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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
      </div>

      {/* Filter tabs — only show on main view */}
      {!isArchiveView && (
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
      )}

      {isArchiveView && (
        <p className="text-sm text-gray-500">
          Archived bookings are hidden from the main list. You can delete them permanently here.
        </p>
      )}

      <BookingsTable bookings={bookings} isArchiveView={isArchiveView} />
    </div>
  );
}
