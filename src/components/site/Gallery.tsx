import { SiteContent } from '@/lib/types';
import GalleryClient from './GalleryClient';

export default function Gallery({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-white border-t border-gray-100" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Gallery</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Life at the Kamp</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">Every corner of Kamp Lambingan is designed for you.</p>
        </div>
        <GalleryClient images={content.gallery} />
      </div>
    </section>
  );
}
