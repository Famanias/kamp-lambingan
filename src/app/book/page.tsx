import { Suspense } from 'react';
import { getContent } from '@/actions/content';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import BookForm from '@/components/site/BookForm';
import NavbarClient from '@/components/site/NavbarClient';

export const metadata = {
  title: 'Book Your Stay – Kamp Lambingan',
};

export default async function BookPage() {
  const content = await getContent();

  return (
    <>
      <Navbar content={content} />
      <main className="min-h-screen bg-background-light pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Reserve Your Stay</h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              Fill in your details, choose your package, and upload your payment receipt. We&apos;ll confirm your booking within 24 hours.
            </p>
          </div>
          <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading form...</div>}>
            <BookForm content={content} />
          </Suspense>
        </div>
      </main>
      <Footer content={content} />
      <NavbarClient />
    </>
  );
}
