import Link from 'next/link';
import { SiteContent } from '@/lib/types';

export default function Hero({ content }: { content: SiteContent }) {
  return (
    <header className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Riverside glamping villa at sunset with warm lighting"
          className="w-full h-full object-cover"
          src={content.heroImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDnj2QB_fyQTs7LqKB3R2SqfUJLaLTei7vxyj83yFBp_ozZ0yPzXx-ILsBq766xaoDjUfGFGhIBtMc5qop2MRcM4K_foZfDMdTE4WTFs1h8J5ljpowXavQqdhqVqeB95_Lh3GXS8ve-WjSjec8fKZ2aSy-zkdW8byUM2NZomYtEYkCkDRqLvMQ-SfI-kgLuEZwRjjwEyrP4lLV91OLGL4DzKiK_ezUc5MkXID8aW0NyRVM_0xHrgV552zd-uCtkQRY2fZ5AjlljktsJ"}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#f6f8f7]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold mb-6 border border-white/30 uppercase tracking-wider animate-[fadeInUp_0.8s_ease-out_forwards]">
          {content.heroLocation}
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg max-w-4xl mx-auto leading-tight animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] opacity-0">
          {content.heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] opacity-0">
          {content.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-[fadeInUp_0.8s_ease-out_0.6s_forwards] opacity-0">
          <Link
            href="/book"
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-lg shadow-xl shadow-primary/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <span className="material-icons text-xl">event_available</span>
            Book Your Stay
          </Link>
          <a
            href="#gallery"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 text-lg font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-icons text-xl">photo_library</span>
            Explore Gallery
          </a>
        </div>
      </div>
    </header>
  );
}
