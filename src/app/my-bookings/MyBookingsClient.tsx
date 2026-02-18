'use client';

import { useState } from 'react';
import { getBookingByReference } from '@/actions/bookings';
import Link from 'next/link';

type BookingSummary = {
  id: string;
  guest_name: string;
  package_name: string;
  check_in: string;
  check_out: string;
  pax: number;
  status: string;
  reference: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<string, string> = {
  pending: 'hourglass_empty',
  confirmed: 'check_circle',
  cancelled: 'cancel',
};

const STATUS_MESSAGES: Record<string, { bg: string; text: string; icon: string; msg: string }> = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'info',
    msg: 'We are reviewing your payment. You will receive an email once confirmed.',
  },
  confirmed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'celebration',
    msg: 'Your booking is confirmed! We look forward to seeing you.',
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'info',
    msg: 'This booking has been cancelled. Contact us for assistance.',
  },
};

export default function MyBookingsClient() {
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    setBooking(null);

    const result = await getBookingByReference(reference.trim());
    setLoading(false);
    setSearched(true);

    if (result.error || !result.data) {
      setError(result.error ?? 'Booking not found.');
    } else {
      setBooking(result.data as BookingSummary);
    }
  };

  const statusInfo = booking ? STATUS_MESSAGES[booking.status] : null;

  return (
    <div className="space-y-6">
      {/* Reference lookup form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference Code</label>
        <p className="text-xs text-gray-400 mb-3">
          Your reference was sent to your email after booking (e.g.{' '}
          <span className="font-mono font-semibold">KL-A3F7B2</span>).
        </p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            required
            placeholder="KL-XXXXXX"
            maxLength={9}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-mono tracking-widest uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </form>
      </div>

      {/* Error */}
      {searched && error && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <span className="material-icons text-4xl text-gray-300 mb-3 block">search_off</span>
          <p className="text-gray-600 font-medium">No booking found</p>
          <p className="text-gray-400 text-xs mt-1">
            Double-check the reference code from your confirmation email.
          </p>
        </div>
      )}

      {/* Result */}
      {booking && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Status banner */}
          <div className={`flex items-center gap-2 px-5 py-3 ${STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'}`}>
            <span className="material-icons text-base">{STATUS_ICONS[booking.status] ?? 'info'}</span>
            <span className="text-sm font-semibold capitalize">{booking.status}</span>
            <span className="ml-auto text-xs opacity-70">
              Booked on {new Date(booking.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Reference badge */}
          <div className="px-5 pt-5 pb-1">
            <div className="bg-gray-100 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <span className="material-icons text-base text-gray-400">confirmation_number</span>
              <span className="font-mono font-bold text-gray-800 tracking-widest text-sm">{booking.reference}</span>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 pb-5 pt-3 space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{booking.package_name}</p>
              <p className="text-sm text-gray-500">{booking.guest_name}  {booking.pax} guest{booking.pax > 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="material-icons text-base text-gray-400">login</span>
                <span>Check-in: <strong>{new Date(booking.check_in + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-icons text-base text-gray-400">logout</span>
                <span>Check-out: <strong>{new Date(booking.check_out + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
              </div>
            </div>

            {statusInfo && (
              <div className={`flex items-center gap-2 text-xs ${statusInfo.text} ${statusInfo.bg} rounded-lg px-3 py-2`}>
                <span className="material-icons text-sm">{statusInfo.icon}</span>
                {statusInfo.msg}
              </div>
            )}

            <Link
              href={`/booking/${booking.id}`}
              className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline mt-1"
            >
              View Full Details
              <span className="material-icons text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}