import { getBooking, updateBookingStatus } from '@/actions/bookings';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingActions from '@/components/admin/BookingActions';
import ArchiveRowButton from '../ArchiveRowButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Booking ${id.slice(0, 8)} – Admin` };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: booking, error } = await getBooking(id);

  if (!booking || error) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-gray-400 hover:text-gray-700">
          <span className="material-icons">arrow_back</span>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Booking Detail</h2>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {booking.status}
        </span>
      </div>

      {/* Guest info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-gray-400 mb-3">Guest Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 block text-xs">Name</span><span className="text-gray-900 font-medium">{booking.guest_name}</span></div>
          <div><span className="text-gray-400 block text-xs">Email</span><a href={`mailto:${booking.guest_email}`} className="text-primary hover:underline">{booking.guest_email}</a></div>
          <div><span className="text-gray-400 block text-xs">Phone</span><a href={`tel:${booking.guest_phone}`} className="text-primary hover:underline">{booking.guest_phone}</a></div>
          <div><span className="text-gray-400 block text-xs">Submitted</span><span>{new Date(booking.created_at).toLocaleString('en-PH')}</span></div>
        </div>
      </div>

      {/* Booking info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-gray-400 mb-3">Booking Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 block text-xs">Package</span><span className="text-gray-900 font-medium">{booking.package_name}</span></div>
          <div><span className="text-gray-400 block text-xs">Guests</span><span>{booking.pax}</span></div>
          <div><span className="text-gray-400 block text-xs">Check-in</span><span>{booking.check_in}</span></div>
          <div><span className="text-gray-400 block text-xs">Check-out</span><span>{booking.check_out}</span></div>
          <div><span className="text-gray-400 block text-xs">Payment Type</span><span className="capitalize font-medium">{booking.payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}</span></div>
          {booking.amount_due && <div><span className="text-gray-400 block text-xs">Amount Due</span><span className="font-semibold text-primary">{booking.amount_due}</span></div>}
          {booking.notes && <div className="col-span-2"><span className="text-gray-400 block text-xs">Notes</span><span className="text-gray-700">{booking.notes}</span></div>}
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-gray-400 mb-3">Payment Receipt</h3>
        {booking.receipt_url ? (
          <div>
            {/* Check path portion only (ignore query params from Supabase signed URLs) */}
            {new URL(booking.receipt_url).pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={booking.receipt_url}
                alt="Payment receipt"
                className="max-h-96 rounded-lg object-contain border border-gray-200 w-full"
              />
            ) : (
              <a
                href={booking.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <span className="material-icons">picture_as_pdf</span>
                View Receipt PDF
              </a>
            )}
            <a
              href={booking.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-gray-400 hover:text-primary block"
            >
              Open full size ↗
            </a>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No receipt uploaded.</p>
        )}
      </div>

      {/* Actions */}
      {booking.status === 'pending' && (
        <BookingActions bookingId={booking.id} />
      )}

      {booking.status !== 'pending' && (
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
          This booking has been <strong>{booking.status}</strong>. No further action needed.
        </div>
      )}

      {/* Archive / Delete forever */}
      <div className="flex justify-end gap-3 pt-2">
        {!booking.is_archived ? (
          <ArchiveRowButton bookingId={booking.id} />
        ) : (
          <>
            <span className="text-xs text-gray-400 self-center">This booking is archived.</span>
            <ArchiveRowButton bookingId={booking.id} deleteForever />
          </>
        )}
      </div>
    </div>
  );
}
