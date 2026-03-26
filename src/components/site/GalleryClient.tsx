'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryClientProps {
  images: string[];
}

export default function GalleryClient({ images }: GalleryClientProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)), [images.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, close, prev, next]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className="group nature-glass rounded-2xl overflow-hidden aspect-[4/3] w-full focus:outline-none focus:ring-2 focus:ring-primary/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Kamp Lambingan photo ${i + 1}`}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(21,32,51,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-5 right-5 nature-glass p-2 rounded-full text-primary z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 nature-glass p-3 rounded-full text-primary z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex]}
            alt={`Kamp Lambingan photo ${lightboxIndex + 1}`}
            className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 nature-glass p-3 rounded-full text-primary z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 nature-glass rounded-full px-4 py-1.5"
          >
            <span className="font-body text-xs font-medium text-primary">
              {lightboxIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
