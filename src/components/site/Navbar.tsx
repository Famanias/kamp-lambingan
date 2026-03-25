import Link from 'next/link';
import Image from 'next/image';
import { SiteContent } from '@/lib/types';

export default function Navbar({ content }: { content: SiteContent }) {
  const navLinks = [
    { href: '/#experiences', label: 'Experiences' },
    { href: '/#activities', label: 'Activities' },
    { href: '/#gallery', label: 'Gallery' },
    { href: '/#rates', label: 'Rates' },
    { href: '/#reviews', label: 'Reviews' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/#book', label: 'Contact' },
  ];

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/assets/logo.png" alt="Kamp Lambingan logo" width={36} height={36} className="h-9 w-auto object-contain" />
            <span className="font-bold text-xl tracking-tight text-gray-900">{content.siteTitle}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                {link.label}
              </a>
            ))}
            <Link href="/book" className="ml-4 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-primary/20">
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div id="mobile-menu" className="hidden md:hidden bg-white border-t border-gray-100">
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium">
              {link.label}
            </a>
          ))}
          <Link href="/book" className="block px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-all text-center mt-2">
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
