'use client';

import { useState } from 'react';
import { archiveBooking, deleteBookingForever } from '@/actions/bookings';
import { useRouter } from 'next/navigation';

interface Props {
  bookingId: string;
  deleteForever?: boolean;
}

export default function ArchiveRowButton({ bookingId, deleteForever = false }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    const message = deleteForever
      ? 'Delete this booking permanently? This cannot be undone.'
      : 'Archive this booking? It will be hidden from the main list.';
    if (!window.confirm(message)) return;

    setLoading(true);
    if (deleteForever) {
      await deleteBookingForever(bookingId);
    } else {
      await archiveBooking(bookingId);
    }
    setLoading(false);
    router.refresh();
  };

  if (deleteForever) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
      >
        <span className="material-icons text-sm">delete_forever</span>
        {loading ? 'Deleting...' : 'Delete Forever'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
      title="Archive booking"
    >
      <span className="material-icons text-base">{loading ? 'hourglass_empty' : 'archive'}</span>
    </button>
  );
}
