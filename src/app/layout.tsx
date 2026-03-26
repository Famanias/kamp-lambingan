import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Kamp Lambingan – Riverside Glamping in Zambales',
  description:
    'Escape to Kamp Lambingan, your premium riverside glamping destination in San Antonio, Zambales. Private AC villas, river access, and unforgettable nature experiences.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Kamp Lambingan – Riverside Glamping in Zambales',
    description: 'Premium riverside glamping in San Antonio, Zambales.',
    url: 'https://kamplambingan.com',
    siteName: 'Kamp Lambingan',
    locale: 'en_PH',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
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
