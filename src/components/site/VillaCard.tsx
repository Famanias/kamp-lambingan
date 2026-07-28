'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Villa } from '@/lib/types';
import { ChevronLeft, ChevronRight, X, Maximize2, Users, MapPin } from 'lucide-react';

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

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
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
    </div>,
    document.body
  );
}

export default function VillaCard({ villa }: { villa: Villa }) {
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
              <Image
                src={images[current]}
                alt={`${villa.name} photo ${current + 1}`}
                className="object-cover cursor-zoom-in transition-transform duration-500 hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={typeof images[current] === 'string' && images[current].startsWith('/api/image')}
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
            <div className="w-full h-full flex items-center justify-center text-primary/40">
              <span className="font-body text-sm font-medium">No Image Available</span>
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
