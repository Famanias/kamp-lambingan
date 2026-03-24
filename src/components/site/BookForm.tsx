'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// import ReCAPTCHA from 'react-google-recaptcha'; // re-enable when live
import { createBooking } from '@/actions/bookings';
import { SiteContent } from '@/lib/types';

interface BookFormProps {
  content: SiteContent;
}

const PACKAGE_NAMES = ['Package A', 'Package B', 'Package C'];

export default function BookForm({ content }: BookFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const recaptchaRef = useRef<ReCAPTCHA>(null); // re-enable when live

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  // const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null); // re-enable when live
  const [paymentType, setPaymentType] = useState<'full' | 'downpayment'>('full');

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
  const selectedPackage = content.packages.find(p => p.name === form.packageName);
  const priceNum = selectedPackage ? parseInt(selectedPackage.price.replace(/[^\d]/g, ''), 10) || 0 : 0;
  const amountDueNum = paymentType === 'full' ? priceNum : Math.ceil(priceNum / 2);
  const amountDueFormatted = amountDueNum > 0 ? '\u20B1' + amountDueNum.toLocaleString('en-PH') : '';
  const downpaymentFormatted = priceNum > 0 ? '\u20B1' + Math.ceil(priceNum / 2).toLocaleString('en-PH') : '';
  const remainingFormatted = priceNum > 0 ? '\u20B1' + Math.floor(priceNum / 2).toLocaleString('en-PH') : '';
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.packageName || !form.checkIn || !form.checkOut) {
      setError('Please fill in all required fields.');
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setError('Please upload your payment receipt.');
      return;
    }
    // reCAPTCHA check disabled until live — re-enable below:
    // if (!recaptchaToken) {
    //   setError('Please complete the reCAPTCHA verification.');
    //   return;
    // }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('receipt', receiptFile);
      // formData.append('recaptchaToken', recaptchaToken); // re-enable when live
      formData.append('paymentType', paymentType);
      if (amountDueFormatted) formData.append('amountDue', amountDueFormatted);

      const result = await createBooking(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        // recaptchaRef.current?.reset(); // re-enable when live
        // setRecaptchaToken(null); // re-enable when live
        return;
      }
      // Save email so My Bookings page can auto-fill
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

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Your Details' : 'Upload Receipt'}
            </span>
            {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
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
                {content.packages.map((pkg) => (
                  <option key={pkg.name} value={pkg.name}>{pkg.name} — {pkg.price}</option>
                ))}
              </select>
            </div>

            {/* Price & payment type card */}
            {selectedPackage && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Package Price</span>
                  <span className="text-2xl font-bold text-primary">{selectedPackage.price}</span>
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
                      <span className={`block text-xs mt-0.5 ${paymentType === 'full' ? 'opacity-80' : 'text-gray-500'}`}>{selectedPackage.price}</span>
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
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                <input
                  type="date"
                  name="checkOut"
                  value={form.checkOut}
                  onChange={handleChange}
                  required
                  min={form.checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests *</label>
              <input
                type="number"
                name="pax"
                value={form.pax}
                onChange={handleChange}
                required
                min="1"
                max="50"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
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
                <div className="flex justify-between"><span className="text-gray-500">Package Price</span><span className="font-medium text-gray-900">{selectedPackage.price}</span></div>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.gcashQrImage}
                    alt="GCash QR Code"
                    className="w-80 h-80 object-contain border border-gray-200 rounded-lg bg-white p-2"
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

          {/* reCAPTCHA — re-enable when live */}
          {/* <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              onChange={(token) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />
          </div> */}

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
              onClick={() => setStep(1)}
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
