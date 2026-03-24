'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import { ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';

const BlurText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(14px)', opacity: 0, y: 10 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.07, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block"
          style={{ marginRight: '0.22em' }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
};

export default function Hero({ content }: { content: SiteContent }) {
  return (
    <header className="relative overflow-hidden" style={{ height: '1000px' }}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {content.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.heroImage}
            alt="Kamp Lambingan riverside escape"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-100 via-cyan-50 to-emerald-50" />
        )}

        {/* Blue-green nature overlay — NOT black */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(15,118,110,0.58) 0%, rgba(22,78,99,0.38) 42%, rgba(245,249,247,0.92) 100%)',
          }}
        />
        {/* Bottom fade to page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-56"
          style={{ background: 'linear-gradient(to top, #f5f9f7, transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24">
        {/* Location badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="nature-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-8"
        >
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
            {content.heroLocation}
          </span>
        </motion.div>

        {/* Main heading — BlurText word-by-word animation */}
        <h1
          className="font-heading italic text-white mb-8"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            maxWidth: '14ch',
            textShadow: '0 2px 24px rgba(0,0,0,0.18)',
          }}
        >
          <BlurText text={content.heroTitle} delay={0.5} />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="font-body font-light max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.0625rem' }}
        >
          {content.heroSubtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-body font-medium text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Reserve Your Stay
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <a
            href="#gallery"
            className="nature-glass inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-body font-medium text-sm transition-all hover:shadow-md"
            style={{ color: '#152033' }}
          >
            Explore Gallery
          </a>
        </motion.div>

        {/* Trust line */}
        {content.tagline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.7 }}
            className="mt-10 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-primary/50" />
            <span className="font-body text-xs font-medium text-primary/90 tracking-wider">
              {content.tagline}
            </span>
            <span className="w-8 h-px bg-primary/50" />
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-primary/60" />
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
