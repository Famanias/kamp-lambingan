'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, BookOpen } from 'lucide-react';

interface MobileMenuProps {
  navLinks: Array<{ href: string; label: string }>;
}

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 rounded-full nature-glass"
        style={{ color: '#152033' }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-20 left-4 right-4 z-50 max-w-sm mx-auto">
            <div className="nature-glass-strong rounded-2xl p-5 space-y-1 shadow-xl">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-body font-medium flex items-center px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-primary/10 hover:text-primary"
                  style={{ color: 'rgba(21,32,51,0.8)' }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/my-bookings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-2 border border-primary/30 text-primary px-6 py-3 rounded-full font-body font-medium text-sm hover:bg-primary/10 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                My Booking
              </Link>
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-1 pt-3 border-t border-gray-100 bg-primary text-white px-6 py-3 rounded-full font-body font-medium text-sm hover:bg-primary/90 transition-colors"
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
