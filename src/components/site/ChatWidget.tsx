'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';

const SUGGESTED_QUESTIONS = [
  'What packages do you offer?',
  'I want to make a reservation',
  'What activities are available?',
  'Are pets allowed?',
];

const getMessageText = (m: UIMessage) =>
  m.parts.filter(isTextUIPart).map((p) => p.text).join('');

function hasToolCall(message: UIMessage, toolName: string): boolean {
  if (!message) return false;
  if (Array.isArray(message.parts)) {
    const found = message.parts.some((p: any) => {
      if (p.toolName === toolName) return true;
      if (p.toolInvocation?.toolName === toolName) return true;
      if ((p.type === 'tool-call' || p.type === 'dynamic-tool') && p.toolName === toolName) return true;
      return false;
    });
    if (found) return true;
  }
  if (Array.isArray((message as any).toolInvocations)) {
    const found = (message as any).toolInvocations.some((ti: any) => ti.toolName === toolName);
    if (found) return true;
  }
  if (Array.isArray((message as any).toolCalls)) {
    const found = (message as any).toolCalls.some((tc: any) => tc.toolName === toolName);
    if (found) return true;
  }
  return false;
}


function renderInlineFormatting(text: string): React.ReactNode[] {
  const boldParts = text.split('**');
  
  return boldParts.map((boldPart, boldIdx) => {
    const isBold = boldIdx % 2 === 1;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    
    linkRegex.lastIndex = 0;
    
    while ((match = linkRegex.exec(boldPart)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(boldPart.substring(lastIndex, matchIndex));
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a 
          key={matchIndex} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {linkText}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    
    if (lastIndex < boldPart.length) {
      parts.push(boldPart.substring(lastIndex));
    }
    
    if (isBold) {
      return <strong key={boldIdx} className="font-bold">{parts}</strong>;
    }
    return <span key={boldIdx}>{parts}</span>;
  });
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-dash pl-4 my-1.5 space-y-1 text-xs">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');

    let content = isBullet ? trimmed.slice(2) : line;
    const inlineRendered = renderInlineFormatting(content);

    if (isBullet) {
      currentList.push(
        <li key={`li-${index}`} className="list-item">
          {inlineRendered}
        </li>
      );
    } else {
      flushList(index);
      if (trimmed === '') {
        elements.push(<div key={`space-${index}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="text-xs leading-relaxed">
            {inlineRendered}
          </p>
        );
      }
    }
  });

  flushList(lines.length);
  return <div className="space-y-1.5">{elements}</div>;
}

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('kl_chat_session_id');
  if (!id) {
    id = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('kl_chat_session_id', id);
  }
  return id;
}

function PaymentInstructionCard({
  instructions,
  content,
}: {
  instructions: {
    message: string;
    reference?: string;
    booking_id?: string;
    amount_due?: string;
    attachments?: Array<{ type: string; url: string }>;
  };
  content?: any;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && instructions.booking_id) {
      return sessionStorage.getItem(`kl_receipt_${instructions.booking_id}`);
    }
    return null;
  });

  const qrCodeUrl = instructions.attachments?.[0]?.url || content?.gcashQrImage;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    // Type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid image format. Please upload PNG, JPG, or WebP.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('bookingId', instructions.booking_id || '');
      formData.append('receipt', file);

      const res = await fetch('/api/booking/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setUploadError(result.error || 'Failed to upload receipt.');
      } else {
        setReceiptUrl(result.receiptUrl);
        if (instructions.booking_id) {
          sessionStorage.setItem(`kl_receipt_${instructions.booking_id}`, result.receiptUrl);
        }
      }
    } catch (err) {
      setUploadError('An error occurred during upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-3 text-gray-800 shadow-sm">
      <p className="font-semibold text-emerald-800 text-sm flex items-center gap-1.5 font-bold">
        <span className="material-icons text-base">payments</span> GCash Payment Instructions
      </p>
      
      <p className="leading-relaxed text-gray-700">{instructions.message}</p>

      <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-2">
        {instructions.reference && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Reference:</span>
            <span className="font-mono font-bold text-gray-900 tracking-wider select-all">{instructions.reference}</span>
          </div>
        )}
        {instructions.amount_due && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Amount Due:</span>
            <span className="font-bold text-emerald-700 text-sm font-semibold">{instructions.amount_due}</span>
          </div>
        )}
      </div>

      {qrCodeUrl && (
        <div className="bg-white rounded-xl p-3 border border-emerald-100 flex flex-col items-center">
          <img src={qrCodeUrl} alt="GCash QR Code" className="max-h-48 object-contain rounded-lg" />
          {content?.gcashNumber && (
            <div className="mt-2 text-center">
              <span className="text-[10px] uppercase text-gray-400 block">GCash Number</span>
              <span className="font-mono font-bold text-gray-800 text-sm">{content.gcashNumber}</span>
              {content.gcashName && <span className="text-[10px] text-gray-500 block">({content.gcashName})</span>}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-emerald-200/50 pt-3">
        {receiptUrl ? (
          <div className="bg-emerald-100 text-emerald-800 rounded-xl p-2.5 flex items-center gap-2 font-medium">
            <span className="material-icons text-base">check_circle</span>
            <span>Receipt uploaded successfully! Under review.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Upload payment receipt proof:</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-xl p-4 bg-white hover:bg-emerald-50/50 transition-colors cursor-pointer">
              <span className="material-icons text-emerald-600 text-xl mb-1">cloud_upload</span>
              <span className="font-semibold text-emerald-700">Choose receipt image</span>
              <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or WebP (max 5MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploading && (
              <p className="text-emerald-700 flex items-center gap-1.5 justify-center font-medium animate-pulse">
                <span className="material-icons animate-spin text-sm">sync</span> Uploading receipt...
              </p>
            )}
            {uploadError && <p className="text-red-600 text-center font-medium">{uploadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

interface BookingFormCardProps {
  details: {
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    package_name: string;
    check_in: string;
    check_out: string;
    pax: number | '';
    notes: string;
    payment_type: 'downpayment' | 'full';
  };
  onChange: (field: string, val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  packages: any[];
}

function BookingFormCard({
  details,
  onChange,
  onSubmit,
  loading,
  error,
  packages,
}: BookingFormCardProps) {
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <form onSubmit={onSubmit} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-3 shadow-sm text-gray-800">
      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
        <span className="material-icons text-base font-bold">event_note</span>
        <span>Booking Details</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-xl text-[11px] font-medium flex items-start gap-1.5">
          <span className="material-icons text-xs mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Full Name</label>
          <input
            type="text"
            required
            value={details.guest_name}
            onChange={(e) => onChange('guest_name', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="John Doe"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Email Address</label>
            <input
              type="email"
              required
              value={details.guest_email}
              onChange={(e) => onChange('guest_email', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Phone Number</label>
            <input
              type="tel"
              required
              value={details.guest_phone}
              onChange={(e) => onChange('guest_phone', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="09171234567"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Select Package</label>
          <select
            required
            value={details.package_name}
            onChange={(e) => onChange('package_name', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          >
            <option value="">Choose a package...</option>
            {packages.map((pkg, idx) => (
              <option key={`${pkg.name}-${idx}`} value={pkg.name}>
                {pkg.name} ({pkg.price})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Check-in</label>
            <input
              type="date"
              required
              min={getTodayString()}
              value={details.check_in}
              onChange={(e) => onChange('check_in', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Check-out</label>
            <input
              type="date"
              required
              min={details.check_in || getTodayString()}
              value={details.check_out}
              onChange={(e) => onChange('check_out', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Number of Guests</label>
            <input
              type="number"
              required
              min={1}
              value={details.pax}
              onChange={(e) => onChange('pax', parseInt(e.target.value) || '')}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Payment Option</label>
            <select
              value={details.payment_type}
              onChange={(e) => onChange('payment_type', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="downpayment">50% Downpayment</option>
              <option value="full">Full Payment</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Special Notes (Optional)</label>
          <textarea
            value={details.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none h-12 leading-relaxed"
            placeholder="Dietary requests, bed preferences, etc."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <>
            <span className="material-icons animate-spin text-sm">sync</span>
            <span>Checking availability...</span>
          </>
        ) : (
          <>
            <span className="material-icons text-sm">check_circle</span>
            <span>Proceed to Verification</span>
          </>
        )}
      </button>
    </form>
  );
}

interface VerificationCardProps {
  email: string;
  code: string;
  onChangeCode: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  resendLoading: boolean;
  resendMessage: string | null;
  error: string | null;
}

function VerificationCard({
  email,
  code,
  onChangeCode,
  onSubmit,
  onResend,
  onBack,
  loading,
  resendLoading,
  resendMessage,
  error,
}: VerificationCardProps) {
  return (
    <form onSubmit={onSubmit} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-3 shadow-sm text-gray-800">
      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
        <span className="material-icons text-base font-bold">verified_user</span>
        <span>Verify Email Address</span>
      </div>

      <p className="text-gray-600 leading-relaxed text-[11px]">
        We've sent a 6-digit verification code to <strong className="text-gray-900">{email}</strong>. Please check your inbox and enter it below.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-xl text-[11px] font-medium flex items-start gap-1.5">
          <span className="material-icons text-xs mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {resendMessage && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-medium flex items-start gap-1.5">
          <span className="material-icons text-xs mt-0.5">check_circle</span>
          <span>{resendMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">6-Digit Code</label>
        <input
          type="text"
          required
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => onChangeCode(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] pt-1">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-0.5"
        >
          <span className="material-icons text-xs">arrow_back</span>
          <span>Back / Edit Info</span>
        </button>
        <button
          type="button"
          disabled={resendLoading}
          onClick={onResend}
          className="text-primary hover:underline font-semibold disabled:opacity-50"
        >
          {resendLoading ? 'Resending...' : 'Resend Code'}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <>
            <span className="material-icons animate-spin text-sm">sync</span>
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <span className="material-icons text-sm">verified</span>
            <span>Verify Code</span>
          </>
        )}
      </button>
    </form>
  );
}

interface BookingSummaryCardProps {
  details: {
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    package_name: string;
    check_in: string;
    check_out: string;
    pax: number | '';
    notes: string;
    payment_type: 'downpayment' | 'full';
  };
  packages: any[];
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

function BookingSummaryCard({
  details,
  packages,
  onSubmit,
  onBack,
  loading,
  error,
}: BookingSummaryCardProps) {
  const selectedPkg = packages.find((p) => p.name === details.package_name);
  const priceNum = selectedPkg ? (parseInt(selectedPkg.price.replace(/[^\d]/g, ''), 10) || 0) : 0;
  const totalAmount = selectedPkg ? selectedPkg.price : '₱0';
  const downpaymentAmount = priceNum > 0 ? '₱' + Math.ceil(priceNum / 2).toLocaleString('en-PH') : '₱0';
  const amountDue = details.payment_type === 'full' ? totalAmount : downpaymentAmount;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-3 shadow-sm text-gray-800">
      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
        <span className="material-icons text-base font-bold">receipt_long</span>
        <span>Booking Summary</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-xl text-[11px] font-medium flex items-start gap-1.5">
          <span className="material-icons text-xs mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-2">
        <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
          <span className="text-gray-400">Guest Name:</span>
          <span className="font-semibold text-gray-800 text-right">{details.guest_name}</span>
        </div>
        <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
          <span className="text-gray-400">Contact Info:</span>
          <div className="text-right">
            <span className="font-semibold text-gray-800 block">{details.guest_email}</span>
            <span className="text-[10px] text-gray-500 block">{details.guest_phone}</span>
          </div>
        </div>
        <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
          <span className="text-gray-400">Package:</span>
          <span className="font-semibold text-emerald-800 text-right">{details.package_name}</span>
        </div>
        <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
          <span className="text-gray-400">Dates:</span>
          <span className="font-semibold text-gray-800 text-right">
            {details.check_in} to {details.check_out}
          </span>
        </div>
        <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
          <span className="text-gray-400">Guests:</span>
          <span className="font-semibold text-gray-800 text-right">{details.pax} pax</span>
        </div>
        {details.notes && (
          <div className="border-b border-gray-100 pb-1.5">
            <span className="text-gray-400 block mb-0.5">Special Notes:</span>
            <span className="text-gray-600 block italic leading-relaxed text-[10px]">
              "{details.notes}"
            </span>
          </div>
        )}
        <div className="flex justify-between items-start pt-1">
          <span className="text-gray-400">Total Package Rate:</span>
          <span className="font-semibold text-gray-800">{totalAmount}</span>
        </div>
        <div className="flex justify-between items-start pt-1 text-sm border-t border-emerald-100/50 mt-1 font-bold">
          <span className="text-emerald-800 font-bold">
            Amount Due ({details.payment_type === 'full' ? 'Full' : '50% Downpayment'}):
          </span>
          <span className="text-emerald-800 font-bold">{amountDue}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-icons text-xs">arrow_back</span>
          <span>Edit</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onSubmit}
          className="flex-[2] bg-primary hover:bg-primary/95 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="material-icons animate-spin text-sm">sync</span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-sm">check_circle</span>
              <span>Confirm Booking</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


export default function ChatWidget({ content }: { content?: any }) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = getOrCreateSessionId();

  // --- Hybrid Booking States & Persistence ---
  const [activeBookingStep, setActiveBookingStep] = useState<'none' | 'form' | 'verification' | 'summary' | 'payment'>('none');
  const [bookingDetails, setBookingDetails] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    package_name: '',
    check_in: '',
    check_out: '',
    pax: 1 as number | '',
    notes: '',
    payment_type: 'downpayment' as 'downpayment' | 'full',
  });
  const [verificationSessionId, setVerificationSessionId] = useState('');
  const [bookingResult, setBookingResult] = useState<{ reference: string; amount_due: string; booking_id: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Sync helpers
  const updateBookingStep = (step: 'none' | 'form' | 'verification' | 'summary' | 'payment') => {
    setActiveBookingStep(step);
    sessionStorage.setItem('kl_booking_step', step);
    setCardError(null);
  };

  const updateBookingDetails = (details: typeof bookingDetails) => {
    setBookingDetails(details);
    sessionStorage.setItem('kl_booking_details', JSON.stringify(details));
  };

  // Restore booking states from sessionStorage on mount
  useEffect(() => {
    try {
      const step = sessionStorage.getItem('kl_booking_step');
      if (step) setActiveBookingStep(step as any);

      const details = sessionStorage.getItem('kl_booking_details');
      if (details) setBookingDetails(JSON.parse(details));

      const vSessionId = sessionStorage.getItem('kl_verification_session_id');
      if (vSessionId) setVerificationSessionId(vSessionId);

      const result = sessionStorage.getItem('kl_booking_result');
      if (result) setBookingResult(JSON.parse(result));
    } catch (e) {
      console.error('Failed to restore booking state:', e);
    }
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: {
      chatSessionId: sessionId
    }
  }), [sessionId]);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport
  });

  // Watch for showBookingForm tool call in messages
  useEffect(() => {
    if (activeBookingStep !== 'none') return;
    const hasShowForm = messages.some((m) => {
      if (m.role !== 'assistant') return false;
      return hasToolCall(m, 'showBookingForm');
    });
    if (hasShowForm) {
      updateBookingStep('form');
    }
  }, [messages, activeBookingStep]);


  const packagesList = useMemo(() => {
    const pkgs = content?.packages || [
      { name: 'Weekday Escape', price: '₱3,500' },
      { name: 'Weekend Glamping', price: '₱5,500' },
      { name: 'Group Retreat', price: '₱15,000' }
    ];
    const seen = new Set<string>();
    return pkgs.filter((pkg: any) => {
      if (!pkg?.name) return false;
      const isDuplicate = seen.has(pkg.name);
      seen.add(pkg.name);
      return !isDuplicate;
    });
  }, [content]);

  // Form submit handler: check availability + start verification
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);
    setCardLoading(true);

    try {
      // 1. Check availability
      const checkRes = await fetch('/api/booking/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: bookingDetails.check_in,
          check_out: bookingDetails.check_out,
          pax: Number(bookingDetails.pax),
        }),
      });

      const checkData = await checkRes.json();
      if (!checkRes.ok || checkData.error) {
        setCardError(checkData.error || 'Failed to check availability.');
        setCardLoading(false);
        return;
      }

      if (!checkData.available) {
        setCardError(`Selected dates are unavailable or exceed capacity. Spot limit: ${checkData.maxGuestsAllowed} guests.`);
        setCardLoading(false);
        return;
      }

      // 2. Start verification session
      const startRes = await fetch('/api/booking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails),
      });

      const startData = await startRes.json();
      if (!startRes.ok || startData.error) {
        setCardError(startData.error || 'Failed to start booking session.');
        setCardLoading(false);
        return;
      }

      // Success! Save session ID and transition
      setVerificationSessionId(startData.sessionId);
      sessionStorage.setItem('kl_verification_session_id', startData.sessionId);
      updateBookingStep('verification');
    } catch (err) {
      setCardError('An error occurred. Please try again.');
    } finally {
      setCardLoading(false);
    }
  };

  // Verification submit handler: verify code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);
    setCardLoading(true);

    try {
      const res = await fetch('/api/booking/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: verificationSessionId,
          code: verificationCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCardError(data.error || 'Verification failed.');
        return;
      }

      updateBookingStep('summary');
    } catch (err) {
      setCardError('An error occurred during verification.');
    } finally {
      setCardLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setCardError(null);
    setResendMessage(null);
    setResendLoading(true);
    try {
      const res = await fetch('/api/booking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setCardError(data.error || 'Failed to resend verification code.');
        return;
      }
      setVerificationSessionId(data.sessionId);
      sessionStorage.setItem('kl_verification_session_id', data.sessionId);
      setResendMessage('Verification code resent successfully!');
    } catch (err) {
      setCardError('Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  // Confirm booking handler: create booking record and trigger AI summary
  const handleConfirmBooking = async () => {
    setCardError(null);
    setCardLoading(true);

    try {
      const res = await fetch('/api/booking/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: verificationSessionId,
          chatSessionId: sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCardError(data.error || 'Failed to complete booking.');
        return;
      }

      setBookingResult(data);
      sessionStorage.setItem('kl_booking_result', JSON.stringify(data));
      updateBookingStep('payment');

      // Programmatic user message to notify AI and trigger summary response
      sendMessage({ text: `I have confirmed my booking. My booking reference is ${data.reference}.` });
    } catch (err) {
      setCardError('Failed to complete booking.');
    } finally {
      setCardLoading(false);
    }
  };

  // Reset booking state
  const handleReset = () => {
    setActiveBookingStep('none');
    sessionStorage.removeItem('kl_booking_step');
    setBookingDetails({
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      package_name: '',
      check_in: '',
      check_out: '',
      pax: 1,
      notes: '',
      payment_type: 'downpayment',
    });
    sessionStorage.removeItem('kl_booking_details');
    setVerificationSessionId('');
    sessionStorage.removeItem('kl_verification_session_id');
    setBookingResult(null);
    sessionStorage.removeItem('kl_booking_result');
    setVerificationCode('');
    setCardError(null);
    setResendMessage(null);

    // Reset messages and clear sessionStorage chat history
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: "Hi there! 🌿 I'm the Kamp Lambingan assistant. I can answer questions and even help you book a reservation. How can I help you today?",
          },
        ],
      } as UIMessage,
    ]);
    sessionStorage.removeItem('kl_chat');
  };



  // Restore previous conversation from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('kl_chat');
      if (stored) {
        const saved = JSON.parse(stored) as UIMessage[];
        if (saved.length > 0) {
          setMessages(saved);
          setHasOpened(true);
        }
      }
    } catch {
      // sessionStorage unavailable (e.g. private browsing quota exceeded)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Persist conversation to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem('kl_chat', JSON.stringify(messages));
      } catch {
        // sessionStorage unavailable (e.g. private browsing quota exceeded)
      }
    }
  }, [messages]);

  useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: "Hi there! 🌿 I'm the Kamp Lambingan assistant. I can answer questions and even help you book a reservation. How can I help you today?",
            },
          ],
        } as UIMessage,
      ]);
    }
  }, [open, hasOpened, setMessages]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, open, activeBookingStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput('');

    // Client-side fail-safe intent detection to show form immediately
    const lowerText = text.toLowerCase();
    if (
      (lowerText.includes('reservation') || 
       lowerText.includes('book') || 
       lowerText.includes('reserve') ||
       lowerText.includes('making a booking')) &&
      activeBookingStep === 'none'
    ) {
      updateBookingStep('form');
    }
  };

  const handleSuggestion = (question: string) => {
    sendMessage({ text: question });

    // Client-side fail-safe intent detection to show form immediately
    const lowerText = question.toLowerCase();
    if (
      (lowerText.includes('reservation') || 
       lowerText.includes('book') || 
       lowerText.includes('reserve') ||
       lowerText.includes('making a booking')) &&
      activeBookingStep === 'none'
    ) {
      updateBookingStep('form');
    }
  };

  const showSuggestions = messages.length === 1 && messages[0].role === 'assistant';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        <span className="material-icons text-2xl">{open ? 'close' : 'chat'}</span>
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-icons text-white text-base">forest</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Kamp Lambingan</p>
              <p className="text-white/70 text-xs">Ask me anything!</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <span className="material-icons text-base">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => {
              const text = getMessageText(m);

              const bookingToolPart = m.role === 'assistant'
                ? m.parts.find(
                    (p) =>
                      p.type === 'dynamic-tool' &&
                      ((p as { type: string; toolName?: string }).toolName === 'completeBooking' ||
                       (p as { type: string; toolName?: string }).toolName === 'createBooking') &&
                      (p as { state: string }).state === 'output-available'
                  )
                : undefined;

              const bookingResult =
                bookingToolPart && (bookingToolPart as { state: string; output?: unknown }).state === 'output-available'
                  ? ((bookingToolPart as { output: unknown }).output as any)
                  : undefined;

              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${m.role === 'user' ? 'max-w-[85%]' : 'w-full'}`}>
                    {text && (
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-primary text-white rounded-br-sm whitespace-pre-wrap'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {m.role === 'user' ? text : parseMarkdown(text)}
                      </div>
                    )}
                    {bookingResult && bookingResult.success && bookingResult.reference && (
                      <PaymentInstructionCard
                        instructions={{
                          message: "Please complete your payment using the QR code below.",
                          reference: bookingResult.reference,
                          booking_id: bookingResult.booking_id,
                          amount_due: bookingResult.amount_due
                        }}
                        content={content}
                      />
                    )}
                    {bookingResult && !bookingResult.success && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
                        ❌ {bookingResult.error ?? 'Something went wrong. Please try again.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Render form-driven booking cards based on active step */}
            {activeBookingStep === 'form' && (
              <BookingFormCard
                details={bookingDetails}
                onChange={(field, val) => updateBookingDetails({ ...bookingDetails, [field]: val })}
                onSubmit={handleFormSubmit}
                loading={cardLoading}
                error={cardError}
                packages={packagesList}
              />
            )}

            {activeBookingStep === 'verification' && (
              <VerificationCard
                email={bookingDetails.guest_email}
                code={verificationCode}
                onChangeCode={setVerificationCode}
                onSubmit={handleVerifySubmit}
                onResend={handleResendCode}
                onBack={() => updateBookingStep('form')}
                loading={cardLoading}
                resendLoading={resendLoading}
                resendMessage={resendMessage}
                error={cardError}
              />
            )}

            {activeBookingStep === 'summary' && (
              <BookingSummaryCard
                details={bookingDetails}
                packages={packagesList}
                onSubmit={handleConfirmBooking}
                onBack={() => updateBookingStep('verification')}
                loading={cardLoading}
                error={cardError}
              />
            )}

            {activeBookingStep === 'payment' && (
              <div className="space-y-2">
                <PaymentInstructionCard
                  instructions={{
                    message: "Scan the GCash QR code to pay, then upload the receipt image to confirm your booking request.",
                    reference: bookingResult?.reference,
                    booking_id: bookingResult?.booking_id,
                    amount_due: bookingResult?.amount_due
                  }}
                  content={content}
                />
                <button
                  onClick={handleReset}
                  className="w-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all shadow-sm"
                >
                  Book Another Reservation
                </button>
              </div>
            )}


            {/* Suggested questions */}
            {showSuggestions && !isLoading && (
              <div className="space-y-1.5 pt-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex-shrink-0 border-t border-gray-100 px-3 py-3 flex gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              disabled={isLoading}
              rows={1}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 bg-gray-50 resize-none max-h-24 min-h-[38px] overflow-y-auto leading-relaxed"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <span className="material-icons text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
