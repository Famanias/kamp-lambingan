'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';

const transport = new DefaultChatTransport({ api: '/api/chat' });

const SUGGESTED_QUESTIONS = [
  'What packages do you offer?',
  'I want to make a reservation',
  'What activities are available?',
  'Are pets allowed?',
];

const getMessageText = (m: UIMessage) =>
  m.parts.filter(isTextUIPart).map((p) => p.text).join('');

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

type BookingResult = {
  success: boolean;
  reference?: string;
  amount_due?: string;
  error?: string;
};

function tryParsePaymentInstructions(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.message && (parsed.attachments || parsed.reference)) {
        return parsed as {
          message: string;
          reference?: string;
          booking_id?: string;
          amount_due?: string;
          attachments?: Array<{ type: string; url: string }>;
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
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

function BookingConfirmCard({ result }: { result: BookingResult }) {
  if (!result.success) {
    return (
      <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
        ❌ {result.error ?? 'Something went wrong. Please try again.'}
      </div>
    );
  }
  return (
    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs space-y-1">
      <p className="font-semibold text-green-800">✅ Booking Submitted!</p>
      <p className="text-green-700">
        Reference: <span className="font-bold tracking-widest">{result.reference}</span>
      </p>
      {result.amount_due && (
        <p className="text-green-700">
          Amount due: <strong>{result.amount_due}</strong>
        </p>
      )}
      <p className="text-green-600 leading-relaxed">
        Our team will contact you within 24 hours with GCash payment details to confirm your reservation.
      </p>
      <a href="/my-bookings" className="inline-block mt-1 text-primary underline font-medium">
        Track your booking 🔍
      </a>
    </div>
  );
}

export default function ChatWidget({ content }: { content?: any }) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

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
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput('');
  };

  const handleSuggestion = (question: string) => {
    sendMessage({ text: question });
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
                  ? ((bookingToolPart as { output: unknown }).output as BookingResult)
                  : undefined;

              const paymentInstructions = m.role === 'assistant' ? tryParsePaymentInstructions(text) : null;

              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${m.role === 'user' ? 'max-w-[85%]' : 'w-full'}`}>
                    {text && (
                      paymentInstructions ? (
                        <PaymentInstructionCard instructions={paymentInstructions} content={content} />
                      ) : (
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-primary text-white rounded-br-sm whitespace-pre-wrap'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          {m.role === 'user' ? text : parseMarkdown(text)}
                        </div>
                      )
                    )}
                    {bookingResult && <BookingConfirmCard result={bookingResult} />}
                  </div>
                </div>
              );
            })}

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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 bg-gray-50"
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
