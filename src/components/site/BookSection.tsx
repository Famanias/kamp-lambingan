'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import { ArrowUpRight } from 'lucide-react';
import SectionBackground from './SectionBackground';

const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.0313443005775!2d120.1452688748924!3d14.935346985591652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3395d7a24fd1ba29%3A0xba863a2e2c20d1f6!2sKamp%20Lambingan!5e0!3m2!1sen!2sph!4v1771399717161!5m2!1sen!2sph';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

// Inline SVG fish silhouette — faces right; RTL instances pass flip=true for scaleX(-1)
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

// top%, swimDur(s), bobDur(s), delay(s), width(px), height(px), opacity, rtl, blur(px)
const FISH = [
  // Background — small, slow, blurred
  { top: '14%', sw: 58, bw: 20, d: 0,  w: 26, h: 12, o: 0.10, rtl: false, blur: 1.5 },
  { top: '68%', sw: 72, bw: 26, d: 22, w: 22, h: 10, o: 0.08, rtl: true,  blur: 2.0 },
  { top: '42%', sw: 64, bw: 23, d: 40, w: 24, h: 11, o: 0.09, rtl: false, blur: 1.5 },
  // Midground
  { top: '24%', sw: 34, bw: 13, d: 9,  w: 40, h: 18, o: 0.14, rtl: false, blur: 0.5 },
  { top: '76%', sw: 40, bw: 15, d: 27, w: 36, h: 16, o: 0.13, rtl: true,  blur: 0.5 },
  // Foreground — larger, faster, crisp
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
  { w: 280, h: 200, top: '55%', left: '58%', d: 6,  dur: 24 },
  { w: 220, h: 180, top: '28%', left: '78%', d: 12, dur: 21 },
];

export default function BookSection({ content }: { content: SiteContent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      id="book"
      className="py-28 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #bae6fd 0%, #38bdf8 22%, #0ea5e9 52%, #0369a1 82%, #0c4a6e 100%)',
      }}
    >
      {/* Admin-set video / image override */}
      <SectionBackground
        src={content.bookBackground}
        overlayStyle={{
          background:
            'linear-gradient(180deg, rgba(14,165,233,0.50) 0%, rgba(3,105,161,0.70) 100%)',
        }}
      />

      {/* Caustic light-refraction blobs */}
      {CAUSTICS.map((c, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: c.w,
            height: c.h,
            top: c.top,
            left: c.left,
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.06) 50%, transparent 75%)',
            animation: `caustic-blob ${c.dur}s ease-in-out ${c.d}s infinite`,
            zIndex: 1,
          }}
        />
      ))}

      {/* Fish — three depth layers */}
      {FISH.map((f, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: f.top, left: 0, right: 0, height: 0, zIndex: 2, overflow: 'visible' }}
        >
          {/* Horizontal swim */}
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
            {/* Vertical bob */}
            <div
              style={{
                width: '100%',
                height: '100%',
                animation: `fish-bob ${f.bw}s ease-in-out ${f.d * 0.5}s infinite`,
                color: 'white',
                opacity: f.o,
              }}
            >
              <FishSilhouette flip={f.rtl} />
            </div>
          </div>
        </div>
      ))}

      {/* Rising bubbles */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: b.left,
            bottom: '8%',
            width: b.size,
            height: b.size,
            background: 'rgba(255,255,255,0.30)',
            border: '1px solid rgba(255,255,255,0.45)',
            animation: `bubble-rise ${b.dur}s ease-in-out ${b.d}s infinite`,
            zIndex: 2,
          }}
        />
      ))}

      {/* Top surface-ripple wave */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div style={{ animation: 'wave-bob 10s ease-in-out infinite' }}>
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 56 }}
          >
            <path
              d="M0,22 C240,50 480,0 720,28 C960,54 1200,4 1440,26 L1440,0 L0,0 Z"
              fill="rgba(255,255,255,0.10)"
            />
            <path
              d="M0,36 C180,12 360,52 540,32 C720,12 900,52 1080,30 C1260,10 1360,42 1440,36 L1440,0 L0,0 Z"
              fill="rgba(255,255,255,0.06)"
            />
          </svg>
        </div>
      </div>

      {/* Bottom wave — blends into the deep-ocean footer */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div style={{ animation: 'wave-bob 14s ease-in-out 3s infinite' }}>
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 60 }}
          >
            <path
              d="M0,30 C288,55 576,5 864,32 C1152,55 1300,12 1440,25 L1440,60 L0,60 Z"
              fill="#0b3c5d"
            />
          </svg>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 10 }}>
        <motion.div
          ref={ref}
          variants={CONTAINER}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <motion.div variants={ITEM} className="text-center mb-16">
            <div
              className="inline-flex rounded-full px-4 py-1.5 mb-5"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              <span className="font-body font-medium text-xs text-white tracking-widest uppercase">
                Visit Us
              </span>
            </div>
            <h2
              className="font-heading italic mb-4 text-white"
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 24px rgba(0,0,0,0.30)',
              }}
            >
              Find &amp; Contact Us
            </h2>
            <p
              className="font-body font-light text-sm max-w-md mx-auto leading-relaxed"
              style={{ color: 'rgba(224,242,254,0.85)' }}
            >
              Ready for your riverside escape? Everything you need to plan your stay.
            </p>
          </motion.div>

          <motion.div variants={ITEM} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Contact cards */}
            <div className="space-y-4">
              {/* Phone */}
              <div
                className="rounded-2xl p-5 flex items-start gap-4 transition-all hover:border-white/40 hover:shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  <span className="material-icons text-white" style={{ fontSize: 20 }}>phone</span>
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm mb-1 text-white">Phone / SMS</h3>
                  <a
                    href={`tel:${content.phone}`}
                    className="font-body font-light text-sm transition-colors hover:text-white"
                    style={{ color: '#bae6fd' }}
                  >
                    {content.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div
                className="rounded-2xl p-5 flex items-start gap-4 transition-all hover:border-white/40 hover:shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  <span className="material-icons text-white" style={{ fontSize: 20 }}>email</span>
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm mb-1 text-white">Email</h3>
                  <a
                    href={`mailto:${content.email}`}
                    className="font-body font-light text-sm transition-colors hover:text-white"
                    style={{ color: '#bae6fd' }}
                  >
                    {content.email}
                  </a>
                </div>
              </div>

              {/* How to book */}
              <div
                className="rounded-2xl p-5 flex items-start gap-4 transition-all hover:border-white/40 hover:shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  <span className="material-icons text-white" style={{ fontSize: 20 }}>assignment</span>
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm mb-2 text-white">How to Book</h3>
                  <ol className="space-y-1.5">
                    {[
                      'Fill in the booking form',
                      'Send your GCash payment',
                      'Upload your receipt',
                      'Receive confirmation',
                    ].map((step, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full text-[10px] font-body font-semibold flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.28)', color: 'white' }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="font-body font-light text-xs"
                          style={{ color: 'rgba(224,242,254,0.80)' }}
                        >
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* CTA */}
              <a
                href="/book"
                className="btn-shine flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full font-body font-medium text-sm text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  boxShadow: '0 8px 32px rgba(14,165,233,0.50), 0 0 0 1px rgba(255,255,255,0.15)',
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
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.22)',
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
