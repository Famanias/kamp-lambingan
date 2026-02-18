'use client';

import { useState } from 'react';
import { archiveAllBookings } from '@/actions/bookings';
import { useRouter } from 'next/navigation';

export default function ArchiveAllButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleArchiveAll = async () => {
    const confirmed = window.confirm(
      'Archive all bookings? They will be moved to the Archive section and hidden from the main list.'
    );
    if (!confirmed) return;
    setLoading(true);
    await archiveAllBookings();
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleArchiveAll}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <span className="material-icons text-base">archive</span>
      {loading ? 'Archiving...' : 'Archive All'}
    </button>
  );
}
