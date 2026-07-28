import { SiteContent } from '@/lib/types';
import { Star } from 'lucide-react';
import SectionBackground from './SectionBackground';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
}

export default function Reviews({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24 relative overflow-hidden"
      id="reviews"
      style={{ background: '#feebc5' }}
    >
      <SectionBackground src={content.reviewsBackground} />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.25'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23grain)' opacity='0.14'/%3E%3C/svg%3E\")",
          pointerEvents: 'none',
          animation: 'sand-grain-shimmer 8s ease-in-out infinite',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 10 }}>
        <div>
          {/* Header */}
          <div className="text-center mb-16">
            <div
              className="inline-flex rounded-full px-4 py-1.5 mb-5"
              style={{ background: 'rgba(160,100,40,0.15)', border: '1px solid rgba(160,100,40,0.30)', backdropFilter: 'blur(8px)' }}
            >
              <span className="font-body font-medium text-xs tracking-widest uppercase" style={{ color: '#7a4210' }}>
                Guest Stories
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#5c3008' }}
            >
              What Our Campers Say
            </h2>
            <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(92,48,8,0.72)' }}>
              Real experiences from couples, families, and groups who escaped to Kamp Lambingan.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.48)',
                  border: '1px solid rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(140,80,20,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r.stars ?? 5 }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-body font-light text-xs" style={{ color: 'rgba(92,48,8,0.50)' }}>
                      {r.date}
                    </span>
                  </div>

                  <p className="font-body font-light text-sm leading-relaxed mb-6" style={{ color: 'rgba(40,20,5,0.85)' }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(160,100,40,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-body font-semibold text-xs text-white"
                      style={{ background: 'linear-gradient(135deg, #14b881, #0d9268)' }}
                    >
                      {getInitials(r.name)}
                    </div>
                    <span className="font-body font-semibold text-sm" style={{ color: '#5c3008' }}>
                      {r.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="font-body font-medium text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(20,184,129,0.12)', color: '#0d9268' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
