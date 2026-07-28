import { SiteContent } from '@/lib/types';
import SectionBackground from './SectionBackground';
import VillaCard from './VillaCard';

export default function Villas({ content }: { content: SiteContent }) {
  const villas = content.villas ?? [];

  if (villas.length === 0) return null;

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="villas"
      style={{ background: 'linear-gradient(to bottom, #c8e4d8 0%, #dde0b0 40%, #f0d490 72%, #feebc5 100%)' }}
    >
      <SectionBackground
        src={content.villasBackground}
        overlayStyle={{
          background:
            'linear-gradient(to bottom, rgba(60,180,110,0.30) 0%, rgba(140,160,60,0.18) 45%, rgba(254,235,197,0.80) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
        <div>
          <div className="text-center mb-14">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {villas.map((villa, i) => (
              <VillaCard key={i} villa={villa} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
