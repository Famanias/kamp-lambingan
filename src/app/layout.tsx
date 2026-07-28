import type { Metadata } from 'next';
import { Barlow, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'optional',
  variable: '--font-barlow',
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'optional',
  variable: '--font-instrument-serif',
  preload: true,
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kamplambingan.site';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Kamp Lambingan – Riverside Glamping in Zambales',
  description:
    'Escape to Kamp Lambingan, your premium riverside glamping destination in San Antonio, Zambales. Private AC villas, river access, and unforgettable nature experiences.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Kamp Lambingan – Riverside Glamping in Zambales',
    description: 'Premium riverside glamping in San Antonio, Zambales.',
    url: 'https://kamplambingan.site',
    siteName: 'Kamp Lambingan',
    locale: 'en_PH',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${instrumentSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="bg-background-light antialiased"
        style={{ fontFamily: "'Barlow', sans-serif", color: '#152033', fontWeight: 300 }}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
