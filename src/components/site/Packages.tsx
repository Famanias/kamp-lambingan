import Link from 'next/link';
import { SiteContent } from '@/lib/types';
import { Check } from 'lucide-react';
import SectionBackground from './SectionBackground';

export default function Packages({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24 relative overflow-hidden"
      id="rates"
      style={{ background: 'linear-gradient(to bottom, #d0e8dc 0%, #c8e4d8 100%)' }}
    >
      <SectionBackground
        src={content.packagesBackground}
        overlayStyle={{
          background:
            'linear-gradient(135deg, rgba(101,254,175,0.55) 0%, rgba(0,175,94,0.42) 50%, rgba(204,254,229,0.88) 100%)',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute rounded-full border-2 border-primary/15 w-72 h-72"
          style={{ top: '20%', left: '3%', animation: 'water-ring 6s ease-out infinite' }}
        />
        <div
          className="absolute rounded-full border border-primary/10 w-56 h-56"
          style={{ bottom: '15%', right: '6%', animation: 'water-ring 6s ease-out 3s infinite' }}
        />
        <div
          className="absolute rounded-full border border-teal-300/20 w-40 h-40"
          style={{ top: '45%', left: '45%', animation: 'water-ring 7s ease-out 1.5s infinite' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 10 }}>
        <div>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
              <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
                Rates &amp; Packages
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              {content.packagesTitle}
            </h2>
            <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
              {content.packagesSubtitle}
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {content.packages.map((pkg, i) => {
              const isFeatured = pkg.featured;
              return (
                <div
                  key={i}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isFeatured ? 'nature-glass-strong ring-2 ring-primary/40 shadow-xl' : 'nature-glass'
                  }`}
                  style={{
                    boxShadow: isFeatured
                      ? '0 20px 48px rgba(20,184,129,0.18), inset 0 1px 0 rgba(255,255,255,0.9)'
                      : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      {pkg.label && (
                        <span className="font-body font-semibold text-[11px] uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10">
                          {pkg.label}
                        </span>
                      )}
                      {pkg.sublabel && (
                        <span className="font-body font-medium text-[10px] text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-100">
                          {pkg.sublabel}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading italic text-2xl mb-2" style={{ color: '#152033' }}>
                      {pkg.name}
                    </h3>
                    <p className="font-body font-light text-xs leading-relaxed mb-6" style={{ color: 'rgba(21,32,51,0.6)' }}>
                      {pkg.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="font-body font-light text-sm" style={{ color: 'rgba(21,32,51,0.5)' }}>₱</span>
                      <span className="font-heading italic text-4xl" style={{ color: '#152033' }}>
                        {pkg.price.toLocaleString()}
                      </span>
                      <span className="font-body font-light text-xs ml-1" style={{ color: 'rgba(21,32,51,0.5)' }}>
                        / stay
                      </span>
                    </div>

                    {/* Features list */}
                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 font-body font-light text-xs" style={{ color: 'rgba(21,32,51,0.75)' }}>
                            <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-primary" />
                            </div>
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Link
                    href={`/book?package=${encodeURIComponent(pkg.name)}`}
                    className={`w-full py-3.5 px-6 rounded-full font-body font-medium text-xs text-center transition-all duration-300 ${
                      isFeatured
                        ? 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    Select Package
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
