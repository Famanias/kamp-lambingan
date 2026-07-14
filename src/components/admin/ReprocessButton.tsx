'use client';

import { useState } from 'react';
import { reprocessReceiptAction } from '@/actions/payment-verification';
import { useRouter } from 'next/navigation';

export default function ReprocessButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleReprocess = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reprocessReceiptAction(bookingId);
      if (!res.success) {
        setError(res.error || 'Failed to reprocess receipt.');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleReprocess}
        disabled={loading}
        className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 bg-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
      >
        <span className={`material-icons text-sm ${loading ? 'animate-spin' : ''}`}>
          sync
        </span>
        {loading ? 'Reprocessing...' : 'Reprocess Receipt'}
      </button>
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}
