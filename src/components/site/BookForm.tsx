'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('receipt', receiptFile);

      const result = await createBooking(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
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
                {uniquePackageOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Payment instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-primary mb-2">Payment Instructions</h3>
            <p className="text-gray-700 mb-2">
              Please send your payment via GCash or bank transfer, then upload a screenshot or photo of your receipt below.
            </p>
            <p className="text-gray-500 text-xs">Your booking will be confirmed once we verify your payment (usually within 24 hours).</p>
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
