import { SiteContent } from '@/lib/types';
import SectionBackground from './SectionBackground';
import GalleryClient from './GalleryClient';

export default function Gallery({ content }: { content: SiteContent }) {
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 2 }}>
        <div>
          <div className="text-center mb-14">
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
          </div>

          <GalleryClient images={content.gallery} />
        </div>
      </div>
    </section>
  );
}
