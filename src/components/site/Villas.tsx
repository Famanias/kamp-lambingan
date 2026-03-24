'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent, Villa } from '@/lib/types';
import { ChevronLeft, ChevronRight, X, Maximize2, Users, MapPin } from 'lucide-react';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(21,32,51,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 nature-glass p-2 rounded-full text-primary z-10">
        <X className="w-5 h-5" />
      </button>
      {images.length > 1 && (
        <span className="absolute top-5 left-1/2 -translate-x-1/2 nature-glass rounded-full px-3 py-1">
          <span className="font-body text-xs font-medium text-primary">{current + 1} / {images.length}</span>
        </span>
      )}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 nature-glass p-3 rounded-full text-primary z-10">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[current]}
        alt={`Photo ${current + 1}`}
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 nature-glass p-3 rounded-full text-primary z-10">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary scale-125' : 'bg-primary/30'}`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VillaCard({ villa }: { villa: Villa }) {
  const [current, setCurrent] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const images = villa.images?.filter(Boolean) ?? [];

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
      <div className="nature-glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
        {/* Photo carousel */}
        <div className="relative h-56 bg-background-alt flex-shrink-0 overflow-hidden">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[current]}
                alt={`${villa.name} photo ${current + 1}`}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-105"
                onClick={() => setLightboxIdx(current)}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 nature-glass p-1.5 rounded-full text-primary"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrent((c) => (c + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 nature-glass p-1.5 rounded-full text-primary"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary scale-125' : 'bg-white/60'}`}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="absolute top-2 right-2 nature-glass rounded-full px-2 py-0.5">
                    <span className="font-body text-[10px] font-medium text-primary">{current + 1}/{images.length}</span>
                  </span>
                </>
              )}
              <button
                onClick={() => setLightboxIdx(current)}
                className="absolute bottom-2 right-2 nature-glass p-1.5 rounded-full text-primary"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(21,32,51,0.2)' }}>
              <span className="material-icons" style={{ fontSize: 48 }}>villa</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <h3 className="font-body font-semibold text-base" style={{ color: '#152033' }}>{villa.name}</h3>
            {villa.location && (
              <p className="font-body text-xs flex items-center gap-1 mt-0.5" style={{ color: 'rgba(21,32,51,0.55)' }}>
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                {villa.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,129,0.12)' }}>
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-body text-xs" style={{ color: 'rgba(21,32,51,0.7)' }}>
              Up to <strong style={{ color: '#152033' }}>{villa.capacity}</strong> {villa.capacity === 1 ? 'guest' : 'guests'}
            </span>
          </div>
          {villa.activities && villa.activities.length > 0 && (
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(21,32,51,0.45)' }}>
                What&apos;s Included
              </p>
              <div className="flex flex-wrap gap-1.5">
                {villa.activities.map((act, i) => (
                  <span
                    key={i}
                    className="font-body text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(20,184,129,0.1)', color: '#14b881' }}
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Villas({ content }: { content: SiteContent }) {
  const villas = content.villas ?? [];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  if (villas.length === 0) return null;

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="villas"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #eaf5f0)' }}
    >
      <SectionBackground
        src={content.villasBackground}
        overlayStyle={{
          background:
            'linear-gradient(to bottom, rgba(167,243,208,0.45) 0%, rgba(209,250,229,0.4) 50%, rgba(245,249,247,0.95) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
        <motion.div
          ref={ref}
          variants={CONTAINER}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div variants={ITEM} className="text-center mb-14">
            <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
              <span className="font-body font-medium text-xs text-primary tracking-wider uppercase">
                Accommodations
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              {content.villasTitle || 'Our Private Villas'}
            </h2>
            <p className="font-body font-light text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#15203380' }}>
              Each villa is uniquely designed for privacy, comfort, and a deep connection with nature.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {villas.map((villa, i) => (
              <motion.div key={i} variants={ITEM}>
                <VillaCard villa={villa} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
