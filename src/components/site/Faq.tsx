import { SiteContent } from '@/lib/types';
import { ChevronDown } from 'lucide-react';
import SectionBackground from './SectionBackground';

export default function Faq({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24 relative overflow-hidden"
      id="faq"
      style={{ background: 'linear-gradient(to bottom, #feebc5 0%, #feebc5 38%, #feebc5 52%, #a8d0f0 70%, #bae6fd 100%)' }}
    >
      {/* Optional CMS background */}
      <SectionBackground src={content.faqBackground} />

      {/* Sandy grain texture — SVG fractal noise layered over warm amber gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")",
          animation: 'sand-grain-shimmer 7s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Transparent rising bubbles */}
      {[
        { left: '8%',  bottom: '-5%', size: 22, dur: '20s', delay: '0s'   },
        { left: '22%', bottom: '-8%', size: 15, dur: '26s', delay: '5s'   },
        { left: '38%', bottom: '-3%', size: 34, dur: '18s', delay: '9s'   },
        { left: '58%', bottom: '-6%', size: 18, dur: '23s', delay: '3s'   },
        { left: '74%', bottom: '-4%', size: 28, dur: '21s', delay: '7s'   },
        { left: '90%', bottom: '-7%', size: 12, dur: '29s', delay: '13s'  },
      ].map((b, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.55)',
            background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.10) 45%, transparent 72%)',
            animation: `sand-bubble-rise ${b.dur} ease-in ${b.delay} infinite`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 10 }}>
        <div>
          {/* Header */}
          <div className="text-center mb-14">
            <div
              className="inline-flex rounded-full px-4 py-1.5 mb-5"
              style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
            >
              <span className="font-body font-medium text-xs tracking-widest uppercase" style={{ color: '#0c2d50' }}>
                Got Questions?
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#0c2d50' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="font-body font-light text-sm leading-relaxed" style={{ color: 'rgba(12,45,80,0.70)' }}>
              Everything you need before booking. Can&apos;t find an answer?{' '}
              <a href="https://m.me/kamplambingan" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#0c5291' }}>
                Message us.
              </a>
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {content.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.32)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer list-none select-none hover:bg-white/20">
                  <span className="font-body font-medium text-sm" style={{ color: '#0c2d50' }}>
                    {faq.question}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" style={{ color: '#0c4a7a' }} />
                </summary>
                <p
                  className="px-5 pb-5 font-body font-light text-sm leading-relaxed"
                  style={{ color: 'rgba(12,45,80,0.70)' }}
                >
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
