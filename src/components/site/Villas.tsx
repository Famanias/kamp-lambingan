'use client';

import { useState } from 'react';
import { SiteContent, Villa } from '@/lib/types';

function VillaCard({ villa }: { villa: Villa }) {
  const [current, setCurrent] = useState(0);
  const images = villa.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
      {/* Carousel */}
      <div className="relative h-56 bg-gray-100 flex-shrink-0">
        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[current]}
              alt={`${villa.name} photo ${current + 1}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  aria-label="Previous photo"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  aria-label="Next photo"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </button>
                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
                      aria-label={`Go to photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Image count badge */}
            {images.length > 1 && (
              <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                {current + 1} / {images.length}
              </span>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-5xl text-gray-300">villa</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{villa.name}</h4>
          {villa.location && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <span className="material-icons text-sm">location_on</span>
              {villa.location}
            </p>
          )}
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="material-icons text-primary text-base">group</span>
          <span>Up to <strong>{villa.capacity}</strong> {villa.capacity === 1 ? 'guest' : 'guests'}</span>
        </div>

        {/* Activities */}
        {villa.activities && villa.activities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Activities</p>
            <div className="flex flex-wrap gap-1.5">
              {villa.activities.map((act, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full"
                >
                  {act}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Villas({ content }: { content: SiteContent }) {
  const villas = content.villas ?? [];
  if (villas.length === 0) return null;

  return (
    <section className="py-20 bg-white" id="villas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Accommodations</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {content.villasTitle || 'Our Villas'}
          </h3>
          {content.villasSubtitle && (
            <p className="text-gray-500 max-w-2xl mx-auto">{content.villasSubtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {villas.map((villa, i) => (
            <VillaCard key={i} villa={villa} />
          ))}
        </div>
      </div>
    </section>
  );
}
