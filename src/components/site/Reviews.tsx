'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import { Star } from 'lucide-react';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
}

export default function Reviews({ content }: { content: SiteContent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="reviews"
      style={{ background: '#feebc5' }}
    >
      {/* Optional CMS background */}
      <SectionBackground src={content.reviewsBackground} />

      {/* Sandy grain texture */}
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
              style={{ background: 'rgba(160,100,40,0.15)', border: '1px solid rgba(160,100,40,0.30)', backdropFilter: 'blur(8px)' }}
            >
              <span className="font-body font-medium text-xs tracking-widest uppercase" style={{ color: '#7a4a18' }}>
                Wall of Love
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              What Our Guests Say
            </h2>
            <p className="font-body font-light text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
              Don&apos;t just take our word for it. Real stories from real guests.
            </p>
          </motion.div>

          {/* Masonry grid */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {content.reviews.map((review, i) => (
              <motion.div
                key={i}
                variants={ITEM}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="break-inside-avoid mb-5 rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300"
                style={{
                  background: 'rgba(255,255,255,0.52)',
                  border: '1px solid rgba(180,130,60,0.22)',
                  backdropFilter: 'blur(12px)',
                }}
              >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(review.stars ?? 5)].map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5" style={{ color: '#b87c14', fill: '#b87c14' }} />
                ))}
              </div>

              {/* Review text */}
              <p
                className="font-body font-light text-sm italic leading-relaxed mb-4"
                style={{ color: 'rgba(21,32,51,0.75)' }}
              >
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Tags */}
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {review.tags.map((tag, t) => (
                    <span
                      key={t}
                      className="font-body text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(160,100,40,0.14)', color: '#7a4a18' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'rgba(21,32,51,0.07)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body font-semibold text-xs text-primary"
                  style={{ background: 'rgba(160,100,40,0.18)', color: '#7a4a18' }}
                >
                  {getInitials(review.name)}
                </div>
                <div>
                  <p className="font-body font-medium text-xs" style={{ color: '#152033' }}>{review.name}</p>
                  {review.date && (
                    <p className="font-body text-[11px]" style={{ color: 'rgba(21,32,51,0.45)' }}>{review.date}</p>
                  )}
                </div>
              </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={ITEM} className="text-center mt-12">
            <a
              href={content.facebookUrl || 'https://www.facebook.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body font-medium text-sm hover:opacity-80 transition-colors"
              style={{ color: '#7a4a18' }}
            >
              See more reviews on Facebook
              <span className="material-icons text-base">arrow_forward</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
