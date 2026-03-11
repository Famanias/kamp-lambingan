'use client';

import { useState } from 'react';
import { SiteContent } from '@/lib/types';

export default function Faq({ content }: { content: SiteContent }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <section className="py-24 bg-background-light" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Got Questions?</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <p className="text-gray-600">
            Everything you need to know before your visit. Can&apos;t find an answer? Message us on Facebook.
          </p>
        </div>
        <div className="divide-y divide-gray-200 border-y border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          {content.faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 cursor-pointer p-5 hover:bg-gray-50 transition-colors text-left select-none"
                >
                  <span className="font-semibold text-gray-800">{faq.question}</span>
                  <span
                    className={`material-icons text-primary flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10 text-gray-500 text-sm">
          Still have questions?{' '}
          <a
            href="https://m.me/kamplambingan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Message us on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
