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

type BookingResult = {
  success: boolean;
  reference?: string;
  amount_due?: string;
  error?: string;
};

function BookingConfirmCard({ result }: { result: BookingResult }) {
  if (!result.success) {
    return (
      <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
        ?? {result.error ?? 'Something went wrong. Please try again.'}
      </div>
    );
  }
  return (
    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs space-y-1">
      <p className="font-semibold text-green-800">? Booking Submitted!</p>
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
        Track your booking ?
      </a>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  const isLoading = status === 'submitted' || status === 'streaming';

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
              text: "Hi there! ?? I'm the Kamp Lambingan assistant. I can answer questions and even help you book a reservation. How can I help you today?",
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
                      (p as { type: string; toolName?: string }).toolName === 'createBooking' &&
                      (p as { state: string }).state === 'output-available'
                  )
                : undefined;

              const bookingResult =
                bookingToolPart && (bookingToolPart as { state: string; output?: unknown }).state === 'output-available'
                  ? ((bookingToolPart as { output: unknown }).output as BookingResult)
                  : undefined;

              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${m.role === 'user' ? 'max-w-[85%]' : 'w-full'}`}>
                    {text && (
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {text}
                      </div>
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
