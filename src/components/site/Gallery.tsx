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
      style={{ background: 'linear-gradient(to bottom, #ffffff, #f5f9f7)' }}
    >
      <SectionBackground
        src={content.galleryBackground}
        overlayStyle={{
          background:
            'linear-gradient(to bottom, rgba(254,249,231,0.6) 0%, rgba(240,253,244,0.55) 50%, rgba(245,249,247,0.95) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
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
