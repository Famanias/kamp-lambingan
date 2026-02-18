'use client';

import { useState } from 'react';
import { updateBookingStatus } from '@/actions/bookings';
import { useRouter } from 'next/navigation';

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (action: 'confirmed' | 'cancelled') => {
    const label = action === 'confirmed' ? 'confirm' : 'cancel';
    const confirmed = window.confirm(
      `Are you sure you want to ${label} this booking?`
    );
    if (!confirmed) return;

    setLoading(label as 'confirm' | 'cancel');
    setError(null);
    const result = await updateBookingStatus(bookingId, action);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Actions</h3>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('confirmed')}
          disabled={loading !== null}
          className="flex-1 bg-primary text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading === 'confirm' ? 'Confirming...' : '✓ Confirm Booking'}
        </button>
        <button
          onClick={() => handleAction('cancelled')}
          disabled={loading !== null}
          className="flex-1 border border-red-300 text-red-600 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loading === 'cancel' ? 'Cancelling...' : '✕ Cancel Booking'}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        The guest will receive an email notification once you confirm or cancel.
      </p>
    </div>
  );
}
