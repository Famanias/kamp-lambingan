import Link from 'next/link';
import Image from 'next/image';
import { SiteContent } from '@/lib/types';
import { ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import SectionBackground from './SectionBackground';

const VIDEO_RE = /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i;

export default function Hero({ content }: { content: SiteContent }) {
  const mediaSrc = content.heroBackground || content.heroImage;
  const isVideo = mediaSrc ? VIDEO_RE.test(mediaSrc) : false;

  return (
    <header className="relative overflow-hidden" style={{ height: '1000px' }}>
      {/* Background media layer */}
      <div className="absolute inset-0 z-0">
        {mediaSrc ? (
          isVideo ? (
            <SectionBackground src={mediaSrc} />
          ) : (
            <Image
              src={mediaSrc}
              alt="Kamp Lambingan riverside escape"
              className="object-cover brightness-50"
              fill
              sizes="100vw"
              priority
              fetchPriority="high"
              unoptimized={typeof mediaSrc === 'string' && mediaSrc.startsWith('/api/image')}
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-100 via-cyan-50 to-emerald-50" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24">
        {/* Location badge */}
        <div className="nature-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-8">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
            {content.heroLocation}
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="font-heading italic text-white mb-8"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            maxWidth: '14ch',
            textShadow: '0 2px 24px rgba(0,0,0,0.18)',
          }}
        >
          {content.heroTitle}
        </h1>

        {/* Subtitle */}
        <p
          className="font-body font-light max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.5rem' }}
        >
          {content.heroSubtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-body font-medium text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Reserve Your Stay
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <a
            href="#gallery"
            className="nature-glass inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-body font-medium text-sm transition-all hover:shadow-md"
            style={{ color: '#152033' }}
          >
            Explore Kamp
          </a>
        </div>

        {/* Tagline */}
        {content.tagline && (
          <div className="mt-10 flex items-center gap-3">
            <span className="w-8 h-px bg-primary/50" />
            <span className="font-body text-lg font-light text-primary/90 tracking-wider">
              {content.tagline}
            </span>
            <span className="w-8 h-px bg-primary/50" />
          </div>
        )}

        {/* Scroll indicator */}
        <a
          href="#experiences"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors group"
        >
          <span className="font-body font-medium text-[10px] uppercase tracking-widest">Discover</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </header>
  );
}
