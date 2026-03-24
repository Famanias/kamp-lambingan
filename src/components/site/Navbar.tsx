'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { SiteContent } from '@/lib/types';

const NAV_LINKS = [
  { href: '#experiences', label: 'Experiences' },
  { href: '#activities', label: 'Activities' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#rates', label: 'Rates' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar({ content }: { content: SiteContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'top-0 py-2' : 'top-4'}`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className={`nature-glass rounded-2xl flex items-center justify-between px-5 py-3 transition-shadow duration-300 ${
              scrolled ? 'shadow-md shadow-black/5' : ''
            }`}
          >
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
                  onClick={(e) => scrollTo(e, link.href)}
                  className="font-body font-medium text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  style={{ color: 'rgba(21,32,51,0.65)' }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right: CTA + Mobile toggle */}
            <div className="flex items-center gap-2">
              <Link
                href="/book"
                className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full font-body font-medium text-sm shadow-sm shadow-primary/25 hover:bg-primary/90 transition-colors"
              >
                Book Your Stay
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                className="md:hidden p-2 rounded-full nature-glass"
                style={{ color: '#152033' }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay + menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-20 left-4 right-4 z-50 max-w-sm mx-auto">
            <div className="nature-glass-strong rounded-2xl p-5 space-y-1 shadow-xl">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  className="font-body font-medium flex items-center px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-primary/10 hover:text-primary"
                  style={{ color: 'rgba(21,32,51,0.8)' }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 bg-primary text-white px-6 py-3 rounded-full font-body font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Book Your Stay <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
