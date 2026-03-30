import { getBookings, getArchiveRetentionDays } from '@/actions/bookings';
import { collectBookedDates } from '@/lib/booking-dates';
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

  const [{ data: allBookings }, retentionDays] = await Promise.all([
    getBookings(isArchiveView),
    getArchiveRetentionDays(),
  ]);

  const bookings = filterStatus && !isArchiveView
    ? allBookings.filter((b) => b.status === filterStatus)
    : allBookings;

  const counts = {
    all: allBookings.length,
    pending: allBookings.filter((b) => b.status === 'pending').length,
    confirmed: allBookings.filter((b) => b.status === 'confirmed').length,
    cancelled: allBookings.filter((b) => b.status === 'cancelled').length,
  };

  const bookedDates = collectBookedDates(allBookings, {
    includeCancelled: false,
    includeArchived: false,
    inclusive: true,
  });

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
        <Link
          href={isArchiveView ? '/admin/bookings' : '/admin/bookings?view=archive'}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isArchiveView
              ? 'bg-primary text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="material-icons text-base">inventory_2</span>
          {isArchiveView ? 'Exit Archive' : 'View Archive'}
        </Link>
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

      {!isArchiveView && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Booked Dates</h3>
            <span className="text-xs text-gray-500">{bookedDates.length} date(s)</span>
          </div>
          {bookedDates.length === 0 ? (
            <p className="text-sm text-gray-500">No booked dates yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {bookedDates.map((date) => (
                <span
                  key={date}
                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  {date}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <BookingsTable bookings={bookings} isArchiveView={isArchiveView} retentionDays={retentionDays} />
    </div>
  );
}
