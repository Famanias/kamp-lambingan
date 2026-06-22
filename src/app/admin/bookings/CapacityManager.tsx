'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setDateCapacity, deleteDateCapacity } from '@/actions/bookings';
import { expandDateRange } from '@/lib/booking-dates';

interface CustomCapacity {
  date: string;
  max_capacity: number;
}

interface Booking {
  check_in: string;
  check_out: string;
  pax: number;
  status: string;
  is_archived: boolean;
}

interface CapacityManagerProps {
  customCapacities: CustomCapacity[];
  bookings: Booking[];
}

export default function CapacityManager({ customCapacities, bookings }: CapacityManagerProps) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate stats for each custom capacity entry
  const tableData = customCapacities.map((cap) => {
    // Calculate current booked guests on this date
    // Accommodation-style occupancy: check_in <= date < check_out
    const bookedGuests = bookings
      .filter(
        (b) =>
          b.status !== 'cancelled' &&
          b.status !== 'expired' &&
          !b.is_archived &&
          b.check_in <= cap.date &&
          b.check_out > cap.date
      )
      .reduce((sum, b) => sum + b.pax, 0);

    const remainingCapacity = Math.max(0, cap.max_capacity - bookedGuests);

    return {
      date: cap.date,
      max_capacity: cap.max_capacity,
      bookedGuests,
      remainingCapacity,
    };
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Please select a date.');
      return;
    }
    if (maxCapacity < 0) {
      setError('Capacity must be a non-negative number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await setDateCapacity(date, maxCapacity);
    setLoading(false);

    if (result.success) {
      setSuccess(`Successfully set capacity for ${date} to ${maxCapacity}.`);
      setDate('');
      setMaxCapacity(50);
      router.refresh();
    } else {
      setError(result.error || 'Failed to save capacity.');
    }
  };

  const handleDelete = async (targetDate: string) => {
    if (!confirm(`Are you sure you want to reset capacity for ${targetDate} back to default (50)?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await deleteDateCapacity(targetDate);
    setLoading(false);

    if (result.success) {
      setSuccess(`Reset capacity for ${targetDate} to default.`);
      router.refresh();
    } else {
      setError(result.error || 'Failed to delete capacity.');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="material-icons text-primary">reduce_capacity</span>
          Date Capacity Manager
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Override the default 50-guest capacity for specific dates. Dates not listed below use the default capacity.
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Form */}
        <form onSubmit={handleSave} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Target Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="w-32">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Max Capacity</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 h-[38px] flex items-center gap-1.5"
          >
            {loading ? (
              'Saving...'
            ) : (
              <>
                <span className="material-icons text-sm">save</span>
                Save Override
              </>
            )}
          </button>
        </form>

        {/* Feedback alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span className="material-icons text-base">error_outline</span>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span className="material-icons text-base">check_circle_outline</span>
            {success}
          </div>
        )}

        {/* Custom Capacities Table */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Custom Capacities Overview</h4>
          
          {tableData.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <span className="material-icons text-3xl text-gray-300 block mb-1">calendar_today</span>
              <p className="text-sm text-gray-400">No custom date capacities set yet.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600">Custom Capacity</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600">Booked Guests</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600">Remaining</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tableData.map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-medium text-gray-800">
                          {new Date(`${row.date}T00:00:00`).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-gray-900">
                          {row.max_capacity}
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-500">
                          {row.bookedGuests}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.remainingCapacity === 0
                                ? 'bg-red-100 text-red-800'
                                : row.remainingCapacity < 10
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {row.remainingCapacity} left
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(row.date)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1.5 ml-auto hover:underline"
                          >
                            <span className="material-icons text-sm">settings_backup_restore</span>
                            Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
