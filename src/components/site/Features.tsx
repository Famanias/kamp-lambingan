'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export default function Features({ content }: { content: SiteContent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="experiences"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #ffffff)' }}
    >
      {/* Optional admin-set background image */}
      <SectionBackground
        src={content.featuresBackground}
        overlayStyle={{
          background:
            'linear-gradient(135deg, rgba(186,230,253,0.45) 0%, rgba(220,252,231,0.55) 50%, rgba(245,249,247,0.95) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
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
                The Kamp Difference
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              {content.featuresTitle}
            </h2>
            <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
              {content.featuresSubtitle}
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.features.map((f, i) => (
              <motion.div
                key={i}
                variants={ITEM}
                whileHover={{ y: -4, transition: { duration: 0.22 } }}
                className="nature-glass rounded-2xl p-6 flex gap-4 hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(20,184,129,0.12)' }}
                >
                  <span className="material-icons text-primary" style={{ fontSize: 22 }}>{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-body font-semibold text-sm mb-1.5" style={{ color: '#152033' }}>
                    {f.title}
                  </h3>
                  <p className="font-body font-light text-xs leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
                    {f.description}
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
