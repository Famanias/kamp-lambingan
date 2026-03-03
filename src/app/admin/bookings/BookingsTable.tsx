'use client';

import { useEffect, useRef, useState } from 'react';
import type { Booking } from '@/lib/types';
import ArchiveRowButton from './ArchiveRowButton';
import BookingActions from '@/components/admin/BookingActions';
import {
  archiveBookings,
  archiveAllBookings,
  restoreBookings,
  restoreAllBookings,
  deleteAllArchived,
  deleteBookings,
  setArchiveRetentionDays,
} from '@/actions/bookings';
import { useRouter } from 'next/navigation';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface Props {
  bookings: Booking[];
  isArchiveView: boolean;
  retentionDays: number;
}

function getDaysRemaining(archivedAt: string | null, retentionDays: number): number {
  if (!archivedAt) return retentionDays;
  const expiresAt = new Date(archivedAt).getTime() + retentionDays * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function BookingsTable({ bookings, isArchiveView, retentionDays }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retentionEdit, setRetentionEdit] = useState(retentionDays);
  const [savingRetention, setSavingRetention] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null;
  const allChecked = bookings.length > 0 && bookings.every((b) => checkedIds.has(b.id));
  const someChecked = checkedIds.size > 0 && !allChecked;

  useEffect(() => { setRetentionEdit(retentionDays); }, [retentionDays]);

  // Keep indeterminate state synced
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [someChecked]);

  function toggleAll() {
    setCheckedIds(allChecked || someChecked ? new Set() : new Set(bookings.map((b) => b.id)));
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleArchive() {
    const isAll = allChecked;
    const label = isAll ? 'all bookings' : `${checkedIds.size} selected booking(s)`;
    if (!window.confirm(`Archive ${label}? They will be hidden from the main list.`)) return;
    setArchiving(true);
    if (isAll) await archiveAllBookings();
    else await archiveBookings(Array.from(checkedIds));
    setCheckedIds(new Set());
    setArchiving(false);
    router.refresh();
  }

  async function handleRestore() {
    const isAll = allChecked;
    const label = isAll ? 'all archived bookings' : `${checkedIds.size} selected booking(s)`;
    if (!window.confirm(`Restore ${label} back to the main list?`)) return;
    setRestoring(true);
    if (isAll) await restoreAllBookings();
    else await restoreBookings(Array.from(checkedIds));
    setCheckedIds(new Set());
    setRestoring(false);
    router.refresh();
  }

  async function handleDelete() {
    const isAll = allChecked;
    const label = isAll ? 'ALL archived bookings' : `${checkedIds.size} selected booking(s)`;
    if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return;
    setDeleting(true);
    if (isAll) await deleteAllArchived();
    else await deleteBookings(Array.from(checkedIds));
    setCheckedIds(new Set());
    setDeleting(false);
    router.refresh();
  }

  async function handleSaveRetention() {
    setSavingRetention(true);
    await setArchiveRetentionDays(retentionEdit);
    setSavingRetention(false);
    router.refresh();
  }

  // Close dialog on Escape key
  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedId]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedId]);

  return (
    <>
      {/* ── Archive retention banner ── */}
      {isArchiveView && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-amber-700">
            <span className="material-icons text-base">timer</span>
            <span className="text-sm font-medium">Archived bookings are permanently deleted after</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="number"
              min={1}
              max={365}
              value={retentionEdit}
              onChange={(e) => setRetentionEdit(Number(e.target.value))}
              className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-sm text-center font-semibold text-amber-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-sm text-amber-700 font-medium">days</span>
            <button
              onClick={handleSaveRetention}
              disabled={savingRetention || retentionEdit === retentionDays}
              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingRetention ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-500">
          {checkedIds.size > 0 && <span>{checkedIds.size} selected</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isArchiveView && (
            <button
              onClick={handleArchive}
              disabled={checkedIds.size === 0 || archiving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-icons text-base">archive</span>
              {archiving ? 'Archiving…' : allChecked ? 'Archive All' : checkedIds.size > 0 ? `Archive (${checkedIds.size})` : 'Archive'}
            </button>
          )}
          {isArchiveView && (
            <>
              <button
                onClick={handleDelete}
                disabled={checkedIds.size === 0 || deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-base">delete_forever</span>
                {deleting ? 'Deleting…' : allChecked ? 'Delete All' : checkedIds.size > 0 ? `Delete (${checkedIds.size})` : 'Delete'}
              </button>
              <button
                onClick={handleRestore}
                disabled={checkedIds.size === 0 || restoring}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-base">restore</span>
                {restoring ? 'Restoring…' : allChecked ? 'Restore All' : checkedIds.size > 0 ? `Restore (${checkedIds.size})` : 'Restore'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            {isArchiveView ? 'No archived bookings.' : 'No bookings found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase">
                  <th className="pl-5 pr-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Guests</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  {isArchiveView && <th className="px-5 py-3">Expires In</th>}
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const daysLeft = isArchiveView ? getDaysRemaining(b.archived_at, retentionDays) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 2;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        checkedIds.has(b.id) ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedId(b.id)}
                    >
                      <td className="pl-5 pr-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checkedIds.has(b.id)}
                          onChange={() => toggleOne(b.id)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{b.guest_name}</p>
                        <p className="text-gray-400 text-xs">{b.guest_email}</p>
                        <p className="text-gray-400 text-xs">{b.guest_phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {b.reference ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{b.package_name}</td>
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                        <p>{b.check_in}</p>
                        <p className="text-gray-400 text-xs">to {b.check_out}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{b.pax}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      {isArchiveView && (
                        <td className="px-5 py-3 whitespace-nowrap">
                          {daysLeft === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <span className="material-icons text-xs">delete_forever</span>
                              Today
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isExpiringSoon ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span className="material-icons text-xs">hourglass_bottom</span>
                              {daysLeft}d
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          {!isArchiveView && (
                            <>
                              <button
                                onClick={() => setSelectedId(b.id)}
                                className="text-primary hover:underline text-xs font-medium"
                              >
                                View →
                              </button>
                              <ArchiveRowButton bookingId={b.id} />
                            </>
                          )}
                          {isArchiveView && (
                            <>
                              <RestoreButton bookingId={b.id} />
                              <ArchiveRowButton bookingId={b.id} deleteForever />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Booking Detail Dialog ── */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Dialog Header */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Booking Detail</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[selectedBooking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {selectedBooking.status}
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="ml-auto text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Close dialog"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Booking Reference */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="material-icons text-primary">confirmation_number</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Booking Reference</p>
                  <p className="font-mono font-bold text-primary tracking-widest text-lg">
                    {selectedBooking.reference ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Guest Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">Name</span>
                    <span className="text-gray-900 font-medium">{selectedBooking.guest_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Email</span>
                    <a href={`mailto:${selectedBooking.guest_email}`} className="text-primary hover:underline">
                      {selectedBooking.guest_email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Phone</span>
                    <a href={`tel:${selectedBooking.guest_phone}`} className="text-primary hover:underline">
                      {selectedBooking.guest_phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Submitted</span>
                    <span>{new Date(selectedBooking.created_at).toLocaleString('en-PH')}</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Booking Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">Package</span>
                    <span className="text-gray-900 font-medium">{selectedBooking.package_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Guests</span>
                    <span>{selectedBooking.pax}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Check-in</span>
                    <span>{selectedBooking.check_in}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Check-out</span>
                    <span>{selectedBooking.check_out}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Payment Type</span>
                    <span className="capitalize font-medium">
                      {selectedBooking.payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}
                    </span>
                  </div>
                  {selectedBooking.amount_due && (
                    <div>
                      <span className="text-gray-400 block text-xs">Amount Due</span>
                      <span className="font-semibold text-primary">{selectedBooking.amount_due}</span>
                    </div>
                  )}
                  {selectedBooking.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-xs">Notes</span>
                      <span className="text-gray-700">{selectedBooking.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Receipt */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Payment Receipt</h3>
                {selectedBooking.receipt_url ? (
                  <div>
                    {new URL(selectedBooking.receipt_url).pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedBooking.receipt_url}
                        alt="Payment receipt"
                        className="max-h-96 rounded-lg object-contain border border-gray-200 w-full"
                      />
                    ) : (
                      <a
                        href={selectedBooking.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        <span className="material-icons">picture_as_pdf</span>
                        View Receipt PDF
                      </a>
                    )}
                    <a
                      href={selectedBooking.receipt_url}
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
              {selectedBooking.status === 'pending' && (
                <BookingActions bookingId={selectedBooking.id} />
              )}
              {selectedBooking.status !== 'pending' && (
                <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-500 text-center">
                  This booking has been <strong>{selectedBooking.status}</strong>. No further action needed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Inline Restore button ─────────────────────────────────────
function RestoreButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    const { restoreBooking } = await import('@/actions/bookings');
    await restoreBooking(bookingId);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-primary hover:text-primary/70 disabled:opacity-50 flex items-center gap-0.5 text-xs font-medium"
      title="Restore booking"
    >
      <span className="material-icons text-base">{loading ? 'hourglass_empty' : 'restore'}</span>
      {loading ? '' : 'Restore'}
    </button>
  );
}
