'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import SectionBackground from './SectionBackground';
import GalleryClient from './GalleryClient';

const HEADER_ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export default function Gallery({ content }: { content: SiteContent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="gallery"
      style={{ background: 'linear-gradient(to bottom, #ddf0e9 0%, #d0e8dc 100%)' }}
    >
      <SectionBackground
        src={content.galleryBackground}
        overlayStyle={{
          background:
            'linear-gradient(135deg, rgba(101,254,175,0.55) 0%, rgba(0,175,94,0.42) 50%, rgba(204,254,229,0.88) 100%)',
        }}
      />

      {/* Water-ripple ring decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute rounded-full border-2 border-primary/15 w-72 h-72"
          style={{ top: '10%', right: '5%', animation: 'water-ring 6s ease-out infinite' }}
        />
        <div
          className="absolute rounded-full border border-primary/10 w-56 h-56"
          style={{ bottom: '25%', left: '8%', animation: 'water-ring 6s ease-out 3s infinite' }}
        />
        <div
          className="absolute rounded-full border border-teal-300/20 w-40 h-40"
          style={{ top: '55%', right: '38%', animation: 'water-ring 7s ease-out 1.5s infinite' }}
        />
        {/* Decorative leaf shapes */}
        {[
          { top: '-10%', left: '15%',  delay: '1s',   dur: '16s', size: 17 },
          { top: '-10%', left: '48%',  delay: '5s',   dur: '14s', size: 13 },
          { top: '-10%', right: '18%', delay: '8s',   dur: '18s', size: 15 },
        ].map((leaf, i) => (
          <svg
            key={i}
            width={leaf.size} height={leaf.size * 1.6}
            viewBox="0 0 16 24"
            fill="rgba(3, 87, 59, 0.18)"
            style={{
              position: 'absolute',
              top: leaf.top,
              left: 'left' in leaf ? leaf.left : undefined,
              right: 'right' in leaf ? leaf.right : undefined,
              animation: `leaf-drift ${leaf.dur} linear ${leaf.delay} infinite`,
            }}
          >
            <path d="M8 0 C8 0, 0 8 0 14 C0 20 4 24 8 24 C12 24 16 20 16 14 C16 8 8 0 8 0Z" />
          </svg>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 2 }}>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div variants={HEADER_ITEM} className="text-center mb-14">
            <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
              <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
                Gallery
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              Life at the Kamp
            </h2>
            <p className="font-body font-light text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
              Every corner designed for serenity and escape.
            </p>
          </motion.div>

          <motion.div variants={HEADER_ITEM}>
            <GalleryClient images={content.gallery} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
