'use client';

import { useEffect } from 'react';

export default function NavbarClient() {
  useEffect(() => {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    const toggleMenu = () => {
      menu.classList.toggle('hidden');
    };

    btn.addEventListener('click', toggleMenu);

    // Close menu when a link inside it is clicked
    const links = menu.querySelectorAll('a');
    const closeMenu = () => {
      menu.classList.add('hidden');
    };
    links.forEach((link) => link.addEventListener('click', closeMenu));

    // Smooth scroll offset for fixed navbar (80px)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    };

    const allAnchorLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    allAnchorLinks.forEach((link) => link.addEventListener('click', handleAnchorClick));

    return () => {
      btn.removeEventListener('click', toggleMenu);
      links.forEach((link) => link.removeEventListener('click', closeMenu));
      allAnchorLinks.forEach((link) => link.removeEventListener('click', handleAnchorClick));
    };
  }, []);

  return null;
}
