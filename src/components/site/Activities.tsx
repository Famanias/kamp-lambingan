'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export default function Activities({ content }: { content: SiteContent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="activities"
      style={{ background: 'linear-gradient(135deg, #eaf5f0 0%, #e2f4ec 50%, #ddf0e9 100%)' }}
    >
      {/* Admin-set background */}
      <SectionBackground
        src={content.activitiesBackground}
        overlayStyle={{
          background:
            'linear-gradient(135deg, rgba(209,250,229,0.65) 0%, rgba(167,243,208,0.5) 50%, rgba(245,249,247,0.92) 100%)',
        }}
      />

      {/* Water-ripple ring decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute rounded-full border-2 border-primary/15 w-72 h-72"
          style={{
            top: '15%', left: '5%',
            animation: 'water-ring 6s ease-out infinite',
          }}
        />
        <div
          className="absolute rounded-full border border-primary/10 w-56 h-56"
          style={{
            bottom: '20%', right: '8%',
            animation: 'water-ring 6s ease-out 3s infinite',
          }}
        />
        <div
          className="absolute rounded-full border border-teal-300/20 w-40 h-40"
          style={{
            top: '55%', left: '40%',
            animation: 'water-ring 7s ease-out 1.5s infinite',
          }}
        />
        {/* Decorative leaf shapes */}
        {[
          { top: '-10%', left: '20%',  delay: '0s',   dur: '14s', size: 18 },
          { top: '-10%', left: '55%',  delay: '4s',   dur: '17s', size: 14 },
          { top: '-10%', right: '25%', delay: '7.5s', dur: '15s', size: 16 },
        ].map((leaf, i) => (
          <svg
            key={i}
            width={leaf.size} height={leaf.size * 1.6}
            viewBox="0 0 16 24"
            fill="rgba(20,184,129,0.18)"
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
          variants={CONTAINER}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <motion.div variants={ITEM} className="text-center mb-16">
            <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
              <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
                Things to Do
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              {content.activitiesTitle}
            </h2>
            <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
              {content.activitiesSubtitle}
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.activities.map((a, i) => (
              <motion.div
                key={i}
                variants={ITEM}
                whileHover={{ y: -5, transition: { duration: 0.22 } }}
                className="nature-glass-strong rounded-2xl p-6 flex gap-4 hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(20,184,129,0.15)' }}
                >
                  <span className="material-icons text-primary" style={{ fontSize: 22 }}>{a.icon}</span>
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm mb-1.5" style={{ color: '#152033' }}>
                    {a.title}
                  </h3>
                  <p className="font-body font-light text-xs leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
                    {a.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
