import Link from 'next/link';
import { SiteContent } from '@/lib/types';
import { Check } from 'lucide-react';

export default function Packages({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24"
      id="rates"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #eaf5f0)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
            {content.packagesSubtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-start">
          {content.packages.map((pkg, i) =>
            pkg.featured ? (
              /* Featured card — teal gradient */
              <div
                key={i}
                className="relative rounded-2xl p-8 shadow-2xl shadow-primary/20 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #14b881 0%, #0d9268 100%)',
                }}
              >
                {/* Gradient shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.5) 0%, transparent 60%)',
                  }}
                />
                {pkg.sublabel && (
                  <div className="absolute -top-0 right-6 bg-white text-primary text-[10px] font-body font-semibold px-3 py-1 rounded-b-full shadow-sm uppercase tracking-wider">
                    {pkg.sublabel}
                  </div>
                )}
                <div className="relative">
                  {pkg.label && (
                    <p className="font-body text-[10px] font-medium text-white/70 uppercase tracking-widest mb-3">{pkg.label}</p>
                  )}
                  <h3 className="font-body font-semibold text-xl text-white mb-1">{pkg.name}</h3>
                  <div
                    className="font-heading italic text-white mb-1"
                    style={{ fontSize: '2.5rem', lineHeight: 1, letterSpacing: '-0.02em' }}
                  >
                    {pkg.price}
                  </div>
                  {pkg.description && (
                    <p className="font-body font-light text-xs text-white/70 mb-6 leading-relaxed">{pkg.description}</p>
                  )}
                  <ul className="space-y-2.5 mb-8">
                    {(pkg.features ?? []).map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="font-body text-xs text-white/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book?package=${encodeURIComponent(pkg.name)}`}
                    className="block w-full text-center py-3 rounded-full bg-white text-primary font-body font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                  >
                    Book This Package
                  </Link>
                </div>
              </div>
            ) : (
              /* Non-featured card — nature glass */
              <div
                key={i}
                className="nature-glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {pkg.label && (
                  <p className="font-body text-[10px] font-medium text-primary uppercase tracking-widest mb-3">{pkg.label}</p>
                )}
                <h3 className="font-body font-semibold text-lg mb-1" style={{ color: '#152033' }}>{pkg.name}</h3>
                <div
                  className="font-heading italic mb-1"
                  style={{ fontSize: '2.25rem', lineHeight: 1, letterSpacing: '-0.02em', color: '#152033' }}
                >
                  {pkg.price}
                </div>
                {pkg.description && (
                  <p className="font-body font-light text-xs mb-6 leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>{pkg.description}</p>
                )}
                <ul className="space-y-2.5 mb-8">
                  {(pkg.features ?? []).map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,129,0.15)' }}>
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="font-body text-xs" style={{ color: 'rgba(21,32,51,0.75)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/book?package=${encodeURIComponent(pkg.name)}`}
                  className="block w-full text-center py-3 rounded-full border border-primary text-primary font-body font-medium text-sm hover:bg-primary hover:text-white transition-all"
                >
                  Book This Package
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
