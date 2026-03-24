'use client';

import { useState } from 'react';
import { SiteContent } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

export default function Faq({ content }: { content: SiteContent }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="py-24"
      id="faq"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #eaf5f0)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
            <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
              Got Questions?
            </span>
          </div>
          <h2
            className="font-heading italic mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="font-body font-light text-sm leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
            Everything you need before booking. Can&apos;t find an answer?{' '}
            <a href="https://m.me/kamplambingan" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Message us.
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {content.faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="nature-glass rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left select-none transition-colors hover:bg-primary/5"
                >
                  <span className="font-body font-medium text-sm" style={{ color: '#152033' }}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-primary flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p
                    className="px-5 pb-5 font-body font-light text-sm leading-relaxed"
                    style={{ color: 'rgba(21,32,51,0.68)' }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
