import { getBooking } from '@/actions/bookings';
import { getContent } from '@/actions/content';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import NavbarClient from '@/components/site/NavbarClient';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Booking Confirmed – Kamp Lambingan',
};

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: booking }, content] = await Promise.all([getBooking(id), getContent()]);

  if (!booking) notFound();

  return (
    <>
      <Navbar content={content} />
      <main className="min-h-screen bg-background-light pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-primary text-3xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Received!</h1>
            <p className="text-gray-600 mb-6">
              Thank you, <strong>{booking.guest_name}</strong>! We&apos;ve received your booking request.
            </p>

            <div className="bg-background-light rounded-lg p-4 text-left text-sm space-y-2 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Booking Summary</h2>

              {/* Reference code highlight */}
              {booking.reference && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Booking Reference</p>
                    <p className="font-mono font-bold text-xl tracking-widest text-primary">{booking.reference}</p>
                  </div>
                  <span className="material-icons text-primary text-3xl">confirmation_number</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Package</span>
                <span className="text-gray-900">{booking.package_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="text-gray-900">{booking.check_in}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-out</span>
                <span className="text-gray-900">{booking.check_out}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guests</span>
                <span className="text-gray-900">{booking.pax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Type</span>
                <span className="text-gray-900">{booking.payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}</span>
              </div>
              {booking.amount_due && (
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-1">
                  <span className="text-gray-700">Amount Due</span>
                  <span className="text-primary">{booking.amount_due}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                  {booking.status}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to <strong>{booking.guest_email}</strong>. Check your inbox (and spam folder).
            </p>

            {/* What happens next */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
              <div className="flex items-start gap-3">
                <span className="material-icons text-amber-500 mt-0.5">phone_in_talk</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">We&apos;ll text or call you to confirm</p>
                  <p className="text-sm text-amber-800">
                    Our team will reach out to you at <strong>{booking.guest_phone}</strong> within 24 hours to confirm your booking. Make sure your phone is on!
                  </p>
                  <a
                    href={`tel:${content.phone}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 hover:text-amber-900"
                  >
                    <span className="material-icons text-base">call</span>
                    {content.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/my-bookings"
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors text-center"
              >
                View My Bookings
              </Link>
              <a
                href="https://m.me/kamplambingan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors text-center"
              >
                Message Us
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer content={content} />
      <NavbarClient />
    </>
  );
}
