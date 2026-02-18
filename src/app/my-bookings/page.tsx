import { getContent } from '@/actions/content';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import NavbarClient from '@/components/site/NavbarClient';
import MyBookingsClient from './MyBookingsClient';

export const metadata = {
  title: 'My Bookings – Kamp Lambingan',
};

export default async function MyBookingsPage() {
  const content = await getContent();

  return (
    <>
      <Navbar content={content} />
      <main className="min-h-screen bg-background-light pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-500">Enter your email address to view your booking history and status.</p>
          </div>
          <MyBookingsClient />
        </div>
      </main>
      <Footer content={content} />
      <NavbarClient />
    </>
  );
}
