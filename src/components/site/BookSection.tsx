import { SiteContent } from '@/lib/types';
import { ArrowUpRight } from 'lucide-react';
import SectionBackground from './SectionBackground';

const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.0313443005775!2d120.1452688748924!3d14.935346985591652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3395d7a24fd1ba29%3A0xba863a2e2c20d1f6!2sKamp%20Lambingan!5e0!3m2!1sen!2sph!4v1771399717161!5m2!1sen!2sph';

function FishSilhouette({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 60 24"
      fill="currentColor"
      style={{ width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <path d="M55,12 C48,2 28,0 16,5 C7,9 3,12 3,12 C3,12 7,15 16,19 C28,24 48,22 55,12 Z" />
      <path d="M3,12 L0,4 L5,12 L0,20 Z" />
      <circle cx="47" cy="10" r="2" opacity="0.5" />
    </svg>
  );
}

const FISH = [
  { top: '14%', sw: 58, bw: 20, d: 0,  w: 26, h: 12, o: 0.10, rtl: false, blur: 1.5 },
  { top: '68%', sw: 72, bw: 26, d: 22, w: 22, h: 10, o: 0.08, rtl: true,  blur: 2.0 },
  { top: '42%', sw: 64, bw: 23, d: 40, w: 24, h: 11, o: 0.09, rtl: false, blur: 1.5 },
  { top: '24%', sw: 34, bw: 13, d: 9,  w: 40, h: 18, o: 0.14, rtl: false, blur: 0.5 },
  { top: '76%', sw: 40, bw: 15, d: 27, w: 36, h: 16, o: 0.13, rtl: true,  blur: 0.5 },
  { top: '53%', sw: 19, bw: 7,  d: 6,  w: 54, h: 22, o: 0.20, rtl: false, blur: 0   },
  { top: '34%', sw: 24, bw: 9,  d: 15, w: 48, h: 20, o: 0.18, rtl: true,  blur: 0   },
];

const BUBBLES = [
  { left: '3%',   size: 5,  d: 0,   dur: 14 },
  { left: '7%',   size: 6,  d: 0,   dur: 12 },
  { left: '12%',  size: 4,  d: 2.1, dur: 18 },
  { left: '18%',  size: 4,  d: 3.2, dur: 15 },
  { left: '24%',  size: 7,  d: 5.5, dur: 11 },
  { left: '31%',  size: 7,  d: 7,   dur: 10 },
  { left: '38%',  size: 5,  d: 1.2, dur: 16 },
  { left: '45%',  size: 6,  d: 4.3, dur: 13 },
  { left: '54%',  size: 5,  d: 1.5, dur: 13 },
  { left: '60%',  size: 8,  d: 6.8, dur: 9  },
  { left: '68%',  size: 8,  d: 5,   dur: 11 },
  { left: '75%',  size: 4,  d: 2.7, dur: 17 },
  { left: '81%',  size: 4,  d: 9,   dur: 16 },
  { left: '87%',  size: 6,  d: 3.4, dur: 12 },
  { left: '92%',  size: 6,  d: 2.2, dur: 14 },
  { left: '97%',  size: 5,  d: 7.9, dur: 15 },
];

const CAUSTICS = [
  { w: 340, h: 240, top: '8%',  left: '10%', d: 0,  dur: 18 },
  { w: 420, h: 280, top: '45%', left: '55%', d: 6,  dur: 22 },
  { w: 300, h: 200, top: '70%', left: '20%', d: 11, dur: 16 },
];

export default function BookSection({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24 relative overflow-hidden"
      id="book"
      style={{
        background:
          'linear-gradient(180deg, #0284c7 0%, #0369a1 28%, #075985 58%, #0c4a6e 82%, #0b3c5d 100%)',
      }}
    >
      <SectionBackground
        src={content.bookBackground}
        overlayStyle={{
          background:
            'linear-gradient(180deg, rgba(2,132,199,0.85) 0%, rgba(11,60,93,0.92) 100%)',
        }}
      />

      {CAUSTICS.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: c.w,
            height: c.h,
            top: c.top,
            left: c.left,
            background:
              'radial-gradient(ellipse at center, rgba(186,230,253,0.18) 0%, rgba(56,189,248,0.06) 50%, transparent 75%)',
            filter: 'blur(30px)',
            animation: `caustics-drift ${c.dur}s ease-in-out ${c.d}s infinite`,
            zIndex: 1,
          }}
        />
      ))}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.8,
        }}
      />

      {FISH.map((f, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: f.top, left: 0, right: 0, height: 0, zIndex: 2, overflow: 'visible' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: f.w,
              height: f.h,
              animation: `${f.rtl ? 'fish-swim-rtl' : 'fish-swim-ltr'} ${f.sw}s linear ${f.d}s infinite`,
              filter: f.blur ? `blur(${f.blur}px)` : undefined,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                animation: `fish-bob ${f.bw}s ease-in-out ${f.d * 0.5}s infinite`,
                color: 'rgba(224,242,254,1)',
                opacity: f.o,
              }}
            >
              <FishSilhouette flip={f.rtl} />
            </div>
          </div>
        </div>
      ))}

      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: b.left,
            bottom: '-4%',
            width: b.size,
            height: b.size,
            background:
              'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7) 0%, rgba(186,230,253,0.3) 60%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 0 4px rgba(255,255,255,0.4)',
            animation: `bubble-rise ${b.dur}s ease-in ${b.d}s infinite`,
            zIndex: 2,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 10 }}>
        <div>
          {/* Header */}
          <div className="text-center mb-16">
            <div
              className="inline-flex rounded-full px-4 py-1.5 mb-5"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="font-body font-medium text-xs tracking-widest uppercase"
                style={{ color: '#e0f2fe' }}
              >
                Plan Your Escape
              </span>
            </div>
            <h2
              className="font-heading italic mb-4 text-white"
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
              }}
            >
              {content.bookTitle || 'Find & Contact Us'}
            </h2>
            <p
              className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(224,242,254,0.80)' }}
            >
              {content.bookSubtitle || 'Ready for your riverside escape? Everything you need to plan your stay.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Info Card */}
            <div
              className="rounded-3xl p-8 flex flex-col justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(20px)',
                boxShadow:
                  '0 20px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <div>
                <h3
                  className="font-heading italic text-2xl mb-3 text-white"
                >
                  Ready to experience Kamp Lambingan?
                </h3>
                <p
                  className="font-body font-light text-sm leading-relaxed mb-6"
                  style={{ color: 'rgba(224,242,254,0.80)' }}
                >
                  {content.bookDescription || 'Book your private glamping villa today and connect with nature.'}
                </p>

                {/* Booking Steps */}
                <div
                  className="rounded-2xl p-5 mb-8"
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <h4
                    className="font-body font-semibold text-xs uppercase tracking-widest mb-3"
                    style={{ color: '#e0f2fe' }}
                  >
                    Simple Booking Process
                  </h4>
                  <ol className="space-y-2.5">
                    {[
                      'Fill in the booking form',
                      'Send your GCash payment',
                      'Upload your receipt',
                      'Receive confirmation',
                    ].map((step, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full text-[10px] font-body font-semibold flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        >
                          {i + 1}
                        </span>
                        <span className="font-body font-light text-xs text-blue-100/80">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <a
                href="/book"
                className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full font-body font-medium text-sm text-white transition-all hover:bg-sky-600"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                }}
              >
                Reserve Your Stay
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Map */}
            <div
              className="overflow-hidden shadow-2xl"
              style={{
                height: 480,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <iframe
                src={GOOGLE_MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kamp Lambingan location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
