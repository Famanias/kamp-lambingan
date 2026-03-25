import Link from 'next/link';
import { SiteContent } from '@/lib/types';

export default function Packages({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-background-light" id="rates">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Rates &amp; Packages</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{content.packagesTitle}</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">{content.packagesSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {content.packages.map((pkg, i) => (
            pkg.featured ? (
              <div key={i} className="bg-primary rounded-2xl p-8 shadow-xl shadow-primary/30 relative">
                {pkg.sublabel && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-extrabold px-4 py-1 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap">
                    {pkg.sublabel}
                  </div>
                )}
                <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">{pkg.label}</div>
                <h4 className="text-xl font-extrabold text-white mb-1">{pkg.name}</h4>
                <div className="text-3xl font-extrabold text-white mb-2">{pkg.price}</div>
                {pkg.description && <p className="text-sm text-white/70 mb-6">{pkg.description}</p>}
                <ul className="space-y-3 mb-8 text-sm text-white/90">
                  {(pkg.features ?? []).map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className="material-icons text-white text-base">check_circle</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/book?package=${encodeURIComponent(pkg.name)}`} className="block w-full text-center py-3 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-colors">
                  Book This Package
                </Link>
              </div>
            ) : (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{pkg.label}</div>
                <h4 className="text-xl font-extrabold text-gray-900 mb-1">{pkg.name}</h4>
                <div className="text-3xl font-extrabold text-gray-900 mb-2">{pkg.price}</div>
                {pkg.description && <p className="text-sm text-gray-500 mb-6">{pkg.description}</p>}
                <ul className="space-y-3 mb-8 text-sm text-gray-600">
                  {(pkg.features ?? []).map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className="material-icons text-primary text-base">check_circle</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/book?package=${encodeURIComponent(pkg.name)}`} className="block w-full text-center py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                  Book This Package
                </Link>
              </div>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
