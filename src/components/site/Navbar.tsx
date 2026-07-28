import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { SiteContent } from '@/lib/types';
import MobileMenu from './MobileMenu';

const NAV_LINKS = [
  { href: '#experiences', label: 'Experiences' },
  { href: '#activities', label: 'Activities' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#rates', label: 'Rates' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar({ content }: { content: SiteContent }) {
  return (
    <nav className="fixed w-full z-50 top-3" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="nature-glass rounded-2xl flex items-center justify-between px-5 py-3 shadow-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/assets/logo.png" alt={content.siteTitle} width={34} height={34} className="h-8 w-auto" />
            <span className="font-body font-semibold text-sm hidden sm:block" style={{ color: '#152033' }}>
              {content.siteTitle}
            </span>
          </Link>

          {/* Center pill nav — desktop */}
          <div className="hidden md:flex nature-glass rounded-full px-2 py-1 items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body font-medium text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                style={{ color: 'rgba(21,32,51,0.65)' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: CTA + Mobile menu */}
          <div className="flex items-center gap-2">
            <Link
              href="/my-bookings"
              className="hidden sm:inline-flex items-center gap-1.5 border border-primary/30 text-primary px-4 py-2 rounded-full font-body font-medium text-sm hover:bg-primary/10 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              My Booking
            </Link>
            <Link
              href="/book"
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full font-body font-medium text-sm shadow-sm shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Book Your Stay
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <MobileMenu navLinks={NAV_LINKS} />
          </div>
        </div>
      </div>
    </nav>
  );
}
