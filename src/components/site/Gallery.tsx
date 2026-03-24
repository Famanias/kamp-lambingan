import { SiteContent } from '@/lib/types';
import GalleryClient from './GalleryClient';

export default function Gallery({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24"
      id="gallery"
      style={{ background: 'linear-gradient(to bottom, #ffffff, #f5f9f7)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    </section>
  );
}
