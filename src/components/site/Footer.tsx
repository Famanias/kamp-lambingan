'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const NAV_LINKS = [
  { label: 'Experiences', href: '#experiences' },
  { label: 'Activities', href: '#activities' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Rates', href: '#rates' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Book', href: '#book' },
];

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M22 12C22 6.48 17.52 2 12 2S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);
const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.312-.883-2.378-.889h-.028c-.847 0-1.821.247-2.486 1.216l-1.757-1.146c.98-1.454 2.568-2.252 4.128-2.29h.073c3.517.025 5.622 2.103 5.994 5.9.077.031.153.063.228.097 1.268.56 2.292 1.44 2.959 2.557.925 1.553 1.11 3.812-.017 5.898-1.132 2.095-3.13 3.29-6.004 3.554-.218.02-.437.03-.657.03zm2.157-11.768a11.99 11.99 0 0 0-2.645-.12c-.956.055-1.7.329-2.21.793-.45.39-.67.894-.64 1.42.046.838.719 1.585 2.088 1.508.979-.053 1.718-.39 2.198-1.003.49-.625.737-1.553.809-2.598z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer({ content }: { content: SiteContent }) {
  const year = new Date().getFullYear();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-5% 0px' });

  const ALL_SOCIALS = [
    { key: 'facebook', url: content.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { key: 'instagram', url: content.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { key: 'tiktok', url: content.tiktokUrl, label: 'TikTok', Icon: TikTokIcon },
    { key: 'threads', url: content.threadsUrl, label: 'Threads', Icon: ThreadsIcon },
    { key: 'youtube', url: content.youtubeUrl, label: 'YouTube', Icon: YouTubeIcon },
    { key: 'twitter', url: content.twitterUrl, label: 'Twitter / X', Icon: TwitterIcon },
  ];
  const order = content.socialLinksOrder ?? ALL_SOCIALS.map((s) => s.key);
  const socials = order
    .map((key) => ALL_SOCIALS.find((s) => s.key === key)!)
    .filter(Boolean)
    .filter((s) => s.url);

  return (
    <footer
      className="pt-0 pb-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0b3c5d 0%, #082f49 42%, #020617 100%)',
      }}
    >
      {/* Admin-set video / image override */}
      <SectionBackground
        src={content.footerBackground}
        overlayStyle={{
          background:
            'linear-gradient(180deg, rgba(11,60,93,0.92) 0%, rgba(2,6,23,0.97) 100%)',
        }}
      />

      {/* Wave divider — continues seamlessly from BookSection's bottom wave */}
      <div className="relative pointer-events-none" style={{ marginTop: -1 }}>
        <div style={{ animation: 'wave-bob 16s ease-in-out 4s infinite' }}>
          <svg
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 48 }}
          >
            <path
              d="M0,28 C320,50 640,8 960,32 C1150,46 1300,18 1440,35 L1440,0 L0,0 Z"
              fill="#0b3c5d"
            />
            <path
              d="M0,38 C240,20 480,50 720,35 C960,20 1200,45 1440,38 L1440,0 L0,0 Z"
              fill="rgba(8,47,73,0.55)"
            />
          </svg>
        </div>
      </div>

      {/* Sparse deep-ocean fish silhouettes — very slow, low opacity */}
      {([
        { top: '22%', sw: 65, bw: 22, d: 0,  w: 30, h: 13, o: 0.10, rtl: false, blur: 1.0 },
        { top: '62%', sw: 80, bw: 28, d: 25, w: 26, h: 11, o: 0.08, rtl: true,  blur: 1.5 },
        { top: '43%', sw: 92, bw: 32, d: 48, w: 22, h: 10, o: 0.07, rtl: false, blur: 2.0 },
      ] as const).map((f, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: f.top, left: 0, right: 0, height: 0, zIndex: 2, overflow: 'visible' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: f.w,
              height: f.h,
              animation: `${f.rtl ? 'fish-swim-rtl' : 'fish-swim-ltr'} ${f.sw}s linear ${f.d}s infinite`,
              filter: `blur(${f.blur}px)`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                animation: `fish-bob ${f.bw}s ease-in-out ${f.d * 0.5}s infinite`,
                color: 'rgba(148,196,242,1)',
                opacity: f.o,
              }}
            >
              <svg
                viewBox="0 0 60 24"
                fill="currentColor"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: f.rtl ? 'scaleX(-1)' : undefined,
                }}
              >
                <path d="M55,12 C48,2 28,0 16,5 C7,9 3,12 3,12 C3,12 7,15 16,19 C28,24 48,22 55,12 Z" />
                <path d="M3,12 L0,4 L5,12 L0,20 Z" />
                <circle cx="47" cy="10" r="2" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="pt-12 pb-0">
        <motion.div
          ref={ref}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
          style={{ zIndex: 10 }}
          variants={CONTAINER}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div
            variants={ITEM}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <Image
                  src="/assets/logo.png"
                  alt={content.siteTitle}
                  width={38}
                  height={38}
                  className="h-9 w-auto"
                />
                <span className="font-body font-semibold text-base text-white">
                  {content.siteTitle || 'Kamp Lambingan'}
                </span>
              </Link>
              <p
                className="font-body font-light text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.52)' }}
              >
                {content.footerTagline ||
                  content.tagline ||
                  'Your riverside glamping escape in the heart of nature.'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className="font-body font-semibold text-xs uppercase tracking-widest mb-4"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Quick Links
              </h4>
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-body font-light text-sm transition-colors hover:text-sky-300"
                      style={{ color: 'rgba(255,255,255,0.52)' }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4
                className="font-body font-semibold text-xs uppercase tracking-widest mb-4"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Connect
              </h4>
              {socials.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {socials.map(({ url, label, Icon }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:text-sky-300"
                      style={{
                        color: 'rgba(255,255,255,0.48)',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          '0 0 14px rgba(56,189,248,0.35)';
                        (e.currentTarget as HTMLElement).style.background =
                          'rgba(56,189,248,0.12)';
                        (e.currentTarget as HTMLElement).style.borderColor =
                          'rgba(56,189,248,0.35)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '';
                        (e.currentTarget as HTMLElement).style.background =
                          'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLElement).style.borderColor =
                          'rgba(255,255,255,0.12)';
                      }}
                      aria-label={label}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              )}
              {content.phone && (
                <p className="font-body font-light text-sm mb-1">
                  <a
                    href={`tel:${content.phone}`}
                    className="transition-colors hover:text-sky-300"
                    style={{ color: 'rgba(255,255,255,0.52)' }}
                  >
                    {content.phone}
                  </a>
                </p>
              )}
              {content.email && (
                <p className="font-body font-light text-sm">
                  <a
                    href={`mailto:${content.email}`}
                    className="transition-colors hover:text-sky-300"
                    style={{ color: 'rgba(255,255,255,0.52)' }}
                  >
                    {content.email}
                  </a>
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={ITEM}
            className="pt-8 text-center font-body font-light text-xs"
            style={{ color: 'rgba(255,255,255,0.26)' }}
          >
            &copy; {year} {content.siteTitle || 'Kamp Lambingan'}. All rights reserved.
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}

