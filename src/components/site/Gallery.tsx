import { SiteContent } from '@/lib/types';

export default function Gallery({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-white border-t border-gray-100" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Gallery</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Life at the Kamp</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">Every corner of Kamp Lambingan is designed for you.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.gallery.slice(0, 6).map((src, i) => (
            <div key={i} className="group overflow-hidden rounded-xl aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Kamp Lambingan gallery ${i + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
