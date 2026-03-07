import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Kamp Lambingan – Riverside Camping in Zambales',
  description:
    'Escape to Kamp Lambingan, your premium riverside camping destination in San Antonio, Zambales. Book your stay online.',
  openGraph: {
    title: 'Kamp Lambingan – Riverside Camping in Zambales',
    description: 'Premium riverside camping in San Antonio, Zambales.',
    url: 'https://kamplambingan.com',
    siteName: 'Kamp Lambingan',
    locale: 'en_PH',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background-light font-[Plus_Jakarta_Sans,sans-serif] text-gray-800 antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
