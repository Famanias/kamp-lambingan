import { getBooking, updateBookingStatus } from '@/actions/bookings';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingActions from '@/components/admin/BookingActions';
import ArchiveRowButton from '../ArchiveRowButton';
import { getServiceClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/package-helper';
import ReprocessButton from '@/components/admin/ReprocessButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Booking ${id.slice(0, 8)} – Admin` };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
};

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: booking, error } = await getBooking(id);

  if (!booking || error) notFound();

  // Fetch the latest payment verification attempt
  const supabase = getServiceClient();
  const { data: verification } = await supabase
    .from('payment_verifications')
    .select('*')
    .eq('booking_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();


  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-gray-400 hover:text-gray-700">
          <span className="material-icons">arrow_back</span>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Booking Detail</h2>
        {(() => {
          const displayStatus = booking.status === 'cancelled' && booking.status_reason === 'payment_rejected' ? 'rejected' : booking.status;
          return (
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[displayStatus] ?? 'bg-gray-100 text-gray-600'}`}>
              {displayStatus}
            </span>
          );
        })()}
      </div>

      {/* Booking Reference */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="material-icons text-primary">confirmation_number</span>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Booking Reference</p>
          <p className="font-mono font-bold text-primary tracking-widest text-lg">
            {booking.reference ?? 'N/A'}
          </p>
        </div>
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
          {booking.amount_due && <div><span className="text-gray-400 block text-xs">Amount Due</span><span className="font-semibold text-primary">{formatCurrency(booking.amount_due)}</span></div>}
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

      {/* AI Payment Verification Log */}
      {booking.receipt_url && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-icons text-gray-400">fact_check</span>
              <h3 className="font-semibold text-gray-950 text-sm uppercase tracking-wider">
                Payment Verification
              </h3>
            </div>
            <ReprocessButton bookingId={booking.id} />
          </div>

          {!verification ? (
            <div className="text-sm text-gray-500 py-2">
              No verification attempts recorded. Click the button above to run verification.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Status Badge & Time */}
              <div className="flex flex-wrap items-center gap-3">
                {verification.verification_status === 'processing' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 animate-pulse">
                    <span className="material-icons text-xs animate-spin">sync</span>
                    Processing OCR...
                  </span>
                )}
                {verification.verification_status === 'verified' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    <span className="material-icons text-xs">check_circle</span>
                    ✅ Payment Verified
                  </span>
                )}
                {verification.verification_status === 'failed' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    <span className="material-icons text-xs">error</span>
                    ❌ Verification Failed
                  </span>
                )}
                {verification.verification_status === 'manual_review' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <span className="material-icons text-xs">warning</span>
                    ⚠ Manual Review Required
                  </span>
                )}

                <span className="text-xs text-gray-400">
                  Last attempt: {new Date(verification.created_at).toLocaleString('en-PH')}
                </span>

                {verification.retry_count > 0 && (
                  <span className="text-xs bg-gray-50 px-2 py-0.5 rounded border border-gray-150 text-gray-500">
                    Retries: {verification.retry_count}
                  </span>
                )}
              </div>

              {/* Error Reason alert */}
              {verification.verification_reason && (
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-red-800 text-xs flex gap-2">
                  <span className="material-icons text-sm mt-0.5 text-red-600">info_outline</span>
                  <div>
                    <span className="font-semibold block mb-0.5">Reason:</span>
                    {verification.verification_reason}
                  </div>
                </div>
              )}

              {/* Extracted Payment Details */}
              {verification.provider && verification.provider !== 'Unknown' && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-100 pb-1.5">
                    Extracted Data ({verification.provider})
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Extracted Amount</span>
                      <span className="font-semibold text-gray-900">
                        {verification.amount !== null ? formatCurrency(verification.amount) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Expected Amount</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(booking.amount_due)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Reference Number</span>
                      <span className="font-mono font-bold text-gray-800">
                        {verification.parsed_payment?.reference_number || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Transaction Date</span>
                      <span>
                        {verification.transaction_datetime
                          ? new Date(verification.transaction_datetime).toLocaleString('en-PH')
                          : 'N/A'}
                      </span>
                    </div>
                    {verification.sender_name && (
                      <div>
                        <span className="text-gray-400 block">Sender Name</span>
                        <span className="text-gray-800">{verification.sender_name}</span>
                      </div>
                    )}
                    {verification.sender_number && (
                      <div>
                        <span className="text-gray-400 block">Sender Number</span>
                        <span className="text-gray-800">{verification.sender_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence scores */}
              {(verification.ocr_confidence !== null || verification.parser_confidence !== null) && (
                <div className="grid grid-cols-2 gap-3 text-xs border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  {verification.ocr_confidence !== null && (
                    <div>
                      <span className="text-gray-400 block">OCR Confidence</span>
                      <span className="font-medium text-gray-800">
                        {(Number(verification.ocr_confidence) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {verification.parser_confidence !== null && (
                    <div>
                      <span className="text-gray-400 block">Parser Confidence</span>
                      <span className="font-medium text-gray-800">
                        {(Number(verification.parser_confidence) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="col-span-2 text-[10px] text-gray-400 border-t border-gray-100 pt-2 flex justify-between">
                    <span>OCR Version: {verification.ocr_service_version || 'N/A'}</span>
                    <span>Parser Version: {verification.parser_version || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {booking.status === 'pending' && (
        <BookingActions bookingId={booking.id} />
      )}

      {booking.status !== 'pending' && (
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
          This booking has been <strong>{booking.status === 'cancelled' && booking.status_reason === 'payment_rejected' ? 'rejected' : booking.status}</strong>. No further action needed.
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
