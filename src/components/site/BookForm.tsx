'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
// import ReCAPTCHA from 'react-google-recaptcha'; // re-enable when live
import { createBooking, getFullyBookedDates } from '@/actions/bookings';
import { SiteContent } from '@/lib/types';
import { getSelectedPackage, getNextDayString, formatHumanDate } from '@/lib/package-helper';

interface BookFormProps {
  content: SiteContent;
}

const PACKAGE_NAMES = ['Package A', 'Package B', 'Package C'];
const BOOKED_DATES_PAGE_SIZE = 10;

export default function BookForm({ content }: BookFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const recaptchaRef = useRef<ReCAPTCHA>(null); // re-enable when live

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [verificationSessionId, setVerificationSessionId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  // const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null); // re-enable when live
  const [paymentType, setPaymentType] = useState<'full' | 'downpayment'>('full');
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [bookedDatesLoading, setBookedDatesLoading] = useState(true);
  const [bookedDatesError, setBookedDatesError] = useState<string | null>(null);
  const [bookedDatesPage, setBookedDatesPage] = useState(1);

  const packageOptions = content.packages.map((p) => p.name).concat(PACKAGE_NAMES.filter(n => !content.packages.find(p => p.name === n)));
  const uniquePackageOptions = content.packages.map((p) => p.name);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    packageName: searchParams.get('package') ?? '',
    checkIn: '',
    checkOut: '',
    pax: '1',
    notes: '',
  });

  // Derived price info (must be after form state)
  const selectedPackage = getSelectedPackage(form.packageName, content.packages);
  const maxCapacity = selectedPackage ? selectedPackage.capacity : 20;
  const maxStayDays = selectedPackage ? selectedPackage.maxStayDays : 1;
  const allowsMultiDay = maxStayDays > 1;
  const priceNum = selectedPackage
    ? (typeof selectedPackage.price === 'number' ? selectedPackage.price : parseInt((selectedPackage.price as any).replace(/[^\d]/g, ''), 10) || 0)
    : 0;
  const amountDueNum = paymentType === 'full' ? priceNum : Math.ceil(priceNum / 2);
  const amountDueFormatted = amountDueNum > 0 ? '\u20B1' + amountDueNum.toLocaleString('en-PH') : '';
  const downpaymentFormatted = priceNum > 0 ? '\u20B1' + Math.ceil(priceNum / 2).toLocaleString('en-PH') : '';
  const remainingFormatted = priceNum > 0 ? '\u20B1' + Math.floor(priceNum / 2).toLocaleString('en-PH') : '';
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const bookedDatesSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const bookedDatesPageCount = Math.max(1, Math.ceil(bookedDates.length / BOOKED_DATES_PAGE_SIZE));
  const visibleBookedDates = bookedDates.slice(
    (bookedDatesPage - 1) * BOOKED_DATES_PAGE_SIZE,
    bookedDatesPage * BOOKED_DATES_PAGE_SIZE
  );

  const formatBookedDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'packageName') {
      const selectedPkg = getSelectedPackage(value, content.packages);
      setForm((prev) => {
        const updated = { ...prev, packageName: value };
        if (selectedPkg) {
          const currentPax = parseInt(prev.pax, 10);
          if (!isNaN(currentPax) && currentPax > selectedPkg.capacity) {
            updated.pax = selectedPkg.capacity.toString();
          }
          if (selectedPkg.maxStayDays === 1 && prev.checkIn) {
            updated.checkOut = getNextDayString(prev.checkIn);
          }
        }
        return updated;
      });
      return;
    }

    if (name === 'pax') {
      const val = parseInt(value, 10);
      setForm((prev) => {
        const selectedPkg = getSelectedPackage(prev.packageName, content.packages);
        const capacity = selectedPkg ? selectedPkg.capacity : 20;
        let clampedVal = value;
        if (value !== '') {
          if (!isNaN(val)) {
            if (val > capacity) {
              clampedVal = capacity.toString();
            } else if (val < 1) {
              clampedVal = '1';
            } else {
              clampedVal = val.toString();
            }
          } else {
            clampedVal = '1';
          }
        }
        return { ...prev, pax: clampedVal };
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isRangeBooked = (start: string, end: string) => {
    if (!start || !end || end < start) return false;
    for (const date of bookedDates) {
      if (date >= start && date <= end) return true;
    }
    return false;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) {
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    if (bookedDatesSet.has(value)) {
      setError('That date is already booked. Please choose another.');
      return;
    }

    if (name === 'checkOut') {
      const selectedPkg = getSelectedPackage(form.packageName, content.packages);
      const isMulti = selectedPkg ? selectedPkg.maxStayDays > 1 : false;
      if (!isMulti) return; // read-only checkOut should not trigger changes
      
      if (form.checkIn && value <= form.checkIn) {
        setError('Check-out must be after check-in.');
        return;
      }
      if (form.checkIn) {
        const checkInDate = new Date(form.checkIn + 'T00:00:00');
        const checkOutDate = new Date(value + 'T00:00:00');
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > (selectedPkg ? selectedPkg.maxStayDays : 1)) {
          setError(`Stay duration exceeds the maximum stay limit of ${selectedPkg ? selectedPkg.maxStayDays : 1} days for this package.`);
          return;
        }
      }
      if (form.checkIn && isRangeBooked(form.checkIn, value)) {
        setError('Selected dates overlap with an existing booking.');
        return;
      }
      setError(null);
      setForm((prev) => ({ ...prev, checkOut: value }));
      return;
    }

    if (name === 'checkIn') {
      const selectedPkg = getSelectedPackage(form.packageName, content.packages);
      const isMulti = selectedPkg ? selectedPkg.maxStayDays > 1 : false;
      
      if (!isMulti) {
        const nextCheckOut = getNextDayString(value);
        if (bookedDatesSet.has(nextCheckOut) || isRangeBooked(value, nextCheckOut)) {
          setError('Selected stay dates overlap with existing bookings.');
          return;
        }
        setError(null);
        setForm((prev) => ({ ...prev, checkIn: value, checkOut: nextCheckOut }));
      } else {
        let nextCheckOut = form.checkOut;
        const hadCheckOut = Boolean(nextCheckOut);
        let cleared = false;
        if (nextCheckOut) {
          const checkInDate = new Date(value + 'T00:00:00');
          const checkOutDate = new Date(nextCheckOut + 'T00:00:00');
          const diffTime = checkOutDate.getTime() - checkInDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (nextCheckOut <= value || diffDays > (selectedPkg ? selectedPkg.maxStayDays : 1) || isRangeBooked(value, nextCheckOut)) {
            nextCheckOut = '';
            cleared = true;
          }
        }
        setForm((prev) => ({ ...prev, checkIn: value, checkOut: nextCheckOut }));
        if (cleared && hadCheckOut) {
          setError('Please select a new check-out date matching the package stay limit.');
        } else {
          setError(null);
        }
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image (JPG, PNG) or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }
    setError(null);
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.packageName || !form.checkIn || !form.checkOut || !form.pax) {
      setError('Please fill in all required fields.');
      return;
    }
    const guestCount = parseInt(form.pax, 10);
    if (isNaN(guestCount) || guestCount < 1) {
      setError('Number of guests must be at least 1.');
      return;
    }
    if (selectedPackage && guestCount > maxCapacity) {
      setError(`Number of guests exceeds the maximum capacity of ${maxCapacity} for this package.`);
      return;
    }
    if (form.checkOut <= form.checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }

    // Validate stay duration
    const checkInDate = new Date(form.checkIn + 'T00:00:00');
    const checkOutDate = new Date(form.checkOut + 'T00:00:00');
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > maxStayDays) {
      setError(`Stay duration exceeds the maximum stay limit of ${maxStayDays} days for this package.`);
      return;
    }

    if (bookedDatesLoading) {
      setError('Checking date availability. Please wait...');
      return;
    }
    if (bookedDatesSet.has(form.checkIn) || bookedDatesSet.has(form.checkOut) || isRangeBooked(form.checkIn, form.checkOut)) {
      setError('Selected dates are already booked. Please choose different dates.');
      return;
    }

    setError(null);
    setSendingVerification(true);
    try {
      const response = await fetch('/api/booking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.name,
          guest_email: form.email,
          guest_phone: form.phone,
          package_name: form.packageName,
          check_in: form.checkIn,
          check_out: form.checkOut,
          pax: Number(form.pax),
          payment_type: paymentType,
          notes: form.notes,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        return;
      }

      setVerificationSessionId(data.sessionId);
      setStep(2);
      setResendMessage('A verification code has been sent to your email.');
      setResendAvailableAt(Date.now() + 60_000);
      setResendCountdown(60);
    } catch (err) {
      setError('Failed to start email verification. Please try again.');
      return;
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setError('Please upload your payment receipt.');
      return;
    }
    if (!verificationSessionId) {
      setError('Please verify your email before submitting your booking.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('receipt', receiptFile);
      formData.append('paymentType', paymentType);
      formData.append('verificationSessionId', verificationSessionId);
      if (amountDueFormatted) formData.append('amountDue', amountDueFormatted);

      const result = await createBooking(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      localStorage.setItem('kl_guest_email', form.email);
      router.push(`/booking/${result.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => {
      setError(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!resendAvailableAt) {
      setResendCountdown(0);
      return;
    }

    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendCountdown(seconds);
      if (seconds <= 0) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [resendAvailableAt]);

  useEffect(() => {
    setBookedDatesPage((prev) => Math.min(prev, Math.max(1, Math.ceil(bookedDates.length / BOOKED_DATES_PAGE_SIZE))));
  }, [bookedDates]);

  useEffect(() => {
    let active = true;
    const loadBookedDates = async () => {
      setBookedDatesLoading(true);
      const result = await getFullyBookedDates();
      if (!active) return;
      if (result.error) {
        setBookedDates([]);
        setBookedDatesError('Unable to load booked dates. We will validate on submit.');
      } else {
        setBookedDates(result.data ?? []);
        setBookedDatesError(null);
      }
      setBookedDatesLoading(false);
    };
    loadBookedDates();
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Your Details' : s === 2 ? 'Email Verification' : 'Upload Receipt'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div
          className="fixed top-6 right-6 z-50 max-w-sm w-[calc(100%-3rem)] bg-red-600 text-white rounded-xl shadow-lg p-4 flex items-start gap-3"
          role="alert"
        >
          <span className="material-icons text-white/90 mt-0.5">error</span>
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss error"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Juan dela Cruz"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="juan@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="09XX-XXX-XXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package *</label>
              <select
                name="packageName"
                value={form.packageName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                <option value="">Select a package</option>
                {content.packages.map((pkg, i) => (
                  <option key={i} value={pkg.name}>
                    {pkg.name} — {typeof pkg.price === 'number' ? '₱' + pkg.price.toLocaleString('en-PH') : pkg.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Price & payment type card */}
            {selectedPackage && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Package Price</span>
                  <span className="text-2xl font-bold text-primary">
                    {typeof selectedPackage.price === 'number' ? '₱' + selectedPackage.price.toLocaleString('en-PH') : selectedPackage.price}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Payment Option</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('full')}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                        paymentType === 'full'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      Full Payment
                      <span className={`block text-xs mt-0.5 ${paymentType === 'full' ? 'opacity-80' : 'text-gray-500'}`}>
                        {typeof selectedPackage.price === 'number' ? '₱' + selectedPackage.price.toLocaleString('en-PH') : selectedPackage.price}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('downpayment')}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                        paymentType === 'downpayment'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      Downpayment (50%)
                      <span className={`block text-xs mt-0.5 ${paymentType === 'downpayment' ? 'opacity-80' : 'text-gray-500'}`}>{downpaymentFormatted}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                  <span className="text-sm font-semibold text-gray-700">Amount Due Now</span>
                  <span className="text-xl font-bold text-gray-900">{amountDueFormatted}</span>
                </div>
                {paymentType === 'downpayment' && (
                  <p className="text-xs text-gray-500">Remaining balance of {remainingFormatted} is payable upon check-in.</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date *</label>
                <input
                  type="date"
                  name="checkIn"
                  value={form.checkIn}
                  onChange={handleDateChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                {allowsMultiDay ? (
                  <>
                    <input
                      type="date"
                      name="checkOut"
                      value={form.checkOut}
                      onChange={handleDateChange}
                      required
                      min={form.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    />
                    <span className="text-xs text-gray-400 block mt-1">Maximum stay: {maxStayDays} days</span>
                  </>
                ) : (
                  <>
                    <div className="w-full px-4 py-[11px] border border-gray-300 rounded-lg bg-gray-50 text-gray-400 font-medium select-none">
                      {form.checkIn ? formatHumanDate(form.checkOut) : 'Select check-in first'}
                    </div>
                    <span className="text-xs text-gray-400 block mt-1 leading-normal">
                      This package includes a 1-day stay.<br />
                      The check-out date is calculated automatically.
                    </span>
                  </>
                )}
              </div>
            </div>
            {(bookedDatesLoading || bookedDatesError) && (
              <p className="text-xs text-gray-500">
                {bookedDatesLoading ? 'Checking availability...' : bookedDatesError}
              </p>
            )}
            {!bookedDatesLoading && !bookedDatesError && (
              <div className="border border-red-200 bg-red-50/60 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Booked Dates</span>
                  <span className="text-xs text-red-600">{bookedDates.length} date(s)</span>
                </div>
                {bookedDates.length === 0 ? (
                  <p className="text-xs text-red-600/80 mt-2">No booked dates yet.</p>
                ) : (
                  <>
                    <div className="mt-2 flex flex-wrap gap-2 min-h-[2rem]">
                      {visibleBookedDates.map((date) => (
                        <span
                          key={date}
                          className="px-2 py-1 rounded-full bg-white text-red-700 text-xs font-medium border border-red-200"
                        >
                          {formatBookedDate(date)}
                        </span>
                      ))}
                    </div>
                    {bookedDates.length > BOOKED_DATES_PAGE_SIZE && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-red-600/80">
                          Showing {(bookedDatesPage - 1) * BOOKED_DATES_PAGE_SIZE + 1} to {Math.min(bookedDatesPage * BOOKED_DATES_PAGE_SIZE, bookedDates.length)} of {bookedDates.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBookedDatesPage((prev) => Math.max(1, prev - 1))}
                            disabled={bookedDatesPage === 1}
                            className="px-3 py-1 rounded-md border border-red-200 bg-white text-xs font-medium text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Prev
                          </button>
                          <span className="text-xs font-medium text-red-700">
                            {bookedDatesPage} / {bookedDatesPageCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBookedDatesPage((prev) => Math.min(bookedDatesPageCount, prev + 1))}
                            disabled={bookedDatesPage === bookedDatesPageCount}
                            className="px-3 py-1 rounded-md border border-red-200 bg-white text-xs font-medium text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests *</label>
              <input
                type="number"
                name="pax"
                value={form.pax}
                onChange={handleChange}
                required
                min="1"
                max={maxCapacity}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-xs text-gray-400 block mt-1">Maximum guests allowed: {maxCapacity}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any dietary restrictions, accessibility needs, or other requests..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Continue to Payment
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-background-light rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Verify your email before payment</h2>
            <p className="mt-2 text-sm text-gray-600">
              Before you continue to payment and upload your receipt, we need to confirm that this booking is associated with your email address.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">A 6-digit verification code was sent to</p>
              <p className="mt-1 font-semibold text-gray-900">{form.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                name="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {resendMessage && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">{resendMessage}</p>
            )}

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setResendMessage(null);
                  setResendLoading(true);
                  try {
                    const response = await fetch('/api/booking/start', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        guest_name: form.name,
                        guest_email: form.email,
                        guest_phone: form.phone,
                        package_name: form.packageName,
                        check_in: form.checkIn,
                        check_out: form.checkOut,
                        pax: Number(form.pax),
                        payment_type: paymentType,
                        notes: form.notes,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok || data.error) {
                      setError(data.error || 'Failed to resend verification code.');
                      return;
                    }
                    setVerificationSessionId(data.sessionId);
                    setResendMessage('Verification code resent successfully.');
                    setResendAvailableAt(Date.now() + 60_000);
                    setResendCountdown(60);
                  } catch (err) {
                    setError('Unable to resend verification code. Please try again.');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                disabled={resendCountdown > 0 || resendLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendLoading ? 'Resending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setVerifyLoading(true);
                  try {
                    const response = await fetch('/api/booking/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: verificationSessionId,
                        code: verificationCode,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                      setError(data.error || 'Verification failed.');
                      return;
                    }
                    setStep(3);
                    setResendMessage('Email verified successfully. You can now upload your receipt.');
                  } catch (err) {
                    setError('An error occurred during verification. Please try again.');
                  } finally {
                    setVerifyLoading(false);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-semibold text-gray-700 hover:text-primary"
              >
                &larr; Back to booking details
              </button>
              <p className="text-sm text-gray-500">
                {verificationSessionId ? 'If you still do not receive the email, check your spam folder or resend the code.' : 'Press Continue to send a verification code.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary */}
          <div className="bg-background-light rounded-lg p-4 text-sm space-y-1.5">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{form.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="text-gray-900">{form.packageName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="text-gray-900">{form.checkIn}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="text-gray-900">{form.checkOut}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="text-gray-900">{form.pax}</span></div>
            {selectedPackage && (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Package Price</span><span className="font-medium text-gray-900">{typeof selectedPackage.price === 'number' ? '₱' + selectedPackage.price.toLocaleString('en-PH') : selectedPackage.price}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment Type</span><span className="text-gray-900">{paymentType === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1"><span className="font-semibold text-gray-700">Amount Due Now</span><span className="font-bold text-primary text-base">{amountDueFormatted}</span></div>
              </>
            )}
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-primary mb-2">Payment Instructions</h3>
            {amountDueFormatted && (
              <p className="text-gray-900 font-semibold mb-3">
                Please send exactly <span className="text-primary">{amountDueFormatted}</span>{paymentType === 'downpayment' ? ' (50% downpayment)' : ' (full payment)'} via GCash.
              </p>
            )}
            
            {/* Payment Options */}
            <div className="space-y-4">
              {/* QR Code Option */}
              {content.gcashQrImage && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-600 font-medium text-center">Option 1: Scan QR Code</p>
                  <Image
                    src={content.gcashQrImage}
                    alt="GCash QR Code"
                    width={320}
                    height={320}
                    className="object-contain border border-gray-200 rounded-lg bg-white p-2"
                    unoptimized
                  />
                </div>
              )}
              
              {/* Manual Entry Option */}
              {content.gcashNumber && content.gcashName && (
                <div className="border-t border-primary/10 pt-3">
                  <p className="text-xs text-gray-600 font-medium text-center mb-2">
                    {content.gcashQrImage ? 'Option 2: Manual Transfer' : 'Send via GCash'}
                  </p>
                  <div className="bg-white rounded border border-gray-200 p-3 space-y-2">
                    <div>
                      <span className="text-xs uppercase tracking-wide text-gray-500 block">GCash Number</span>
                      <span className="text-base font-mono font-semibold text-gray-900">{content.gcashNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-gray-500 block">Account Holder</span>
                      <span className="text-sm font-semibold text-gray-900">{content.gcashName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-2 mt-3">
              Upload a screenshot or photo of your receipt below.
            </p>
            <p className="text-gray-500 text-xs">Once we verify your payment, we&apos;ll <strong>text or call you</strong> to confirm your booking (usually within 24 hours).</p>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Receipt *</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Receipt preview" className="max-h-48 mx-auto rounded object-contain" />
              ) : receiptFile ? (
                <div className="flex flex-col items-center gap-2 text-gray-700">
                  <span className="material-icons text-3xl text-primary">picture_as_pdf</span>
                  <span className="text-sm">{receiptFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <span className="material-icons text-3xl">cloud_upload</span>
                  <span className="text-sm">Click to upload receipt (JPG, PNG, PDF — max 5 MB)</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !receiptFile}
              className="flex-2 flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
