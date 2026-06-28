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

  const displayStatus = booking.status === 'cancelled' && booking.status_reason === 'payment_rejected'
    ? 'rejected'
    : booking.status;

  const configMap: Record<string, any> = {
    pending: {
      icon: 'hourglass_empty',
      iconBg: 'bg-yellow-100 text-yellow-600',
      heading: 'Booking Received!',
      subheading: (
        <>
          Thank you, <strong>{booking.guest_name}</strong>! We&apos;ve received your booking request.
        </>
      ),
      badgeClass: 'bg-yellow-100 text-yellow-800',
      emailDesc: (
        <>
          A copy of your request details has been sent to <strong>{booking.guest_email}</strong>. Check your inbox (and spam folder).
        </>
      ),
      nextBoxBg: 'bg-amber-50 border border-amber-200',
      nextBoxIcon: 'phone_in_talk',
      nextBoxIconColor: 'text-amber-500',
      nextBoxTitle: "We'll text or call you to confirm",
      nextBoxText: (
        <>
          Our team will reach out to you at <strong>{booking.guest_phone}</strong> within 24 hours to confirm your booking. Make sure your phone is on!
        </>
      ),
      nextBoxLink: true,
    },
    confirmed: {
      icon: 'check_circle',
      iconBg: 'bg-green-100 text-green-600',
      heading: 'Booking Confirmed!',
      subheading: (
        <>
          Congratulations, <strong>{booking.guest_name}</strong>! Your booking has been confirmed.
        </>
      ),
      badgeClass: 'bg-green-100 text-green-800',
      emailDesc: (
        <>
          A confirmation email has been sent to <strong>{booking.guest_email}</strong>. Check your inbox (and spam folder).
        </>
      ),
      nextBoxBg: 'bg-green-50 border border-green-200',
      nextBoxIcon: 'celebration',
      nextBoxIconColor: 'text-green-500',
      nextBoxTitle: "You're all set!",
      nextBoxText: (
        <>
          We look forward to hosting you at Kamp Lambingan! See you soon. 🌿
        </>
      ),
      nextBoxLink: false,
    },
    cancelled: {
      icon: 'cancel',
      iconBg: 'bg-red-100 text-red-600',
      heading: 'Booking Cancelled',
      subheading: (
        <>
          Hi <strong>{booking.guest_name}</strong>, this booking request has been cancelled.
        </>
      ),
      badgeClass: 'bg-red-100 text-red-800',
      emailDesc: (
        <>
          Cancellation details have been sent to <strong>{booking.guest_email}</strong>.
        </>
      ),
      nextBoxBg: 'bg-red-50 border border-red-200',
      nextBoxIcon: 'info',
      nextBoxIconColor: 'text-red-500',
      nextBoxTitle: 'Booking Cancelled',
      nextBoxText: (
        <>
          This booking is no longer active. If you need assistance, please contact us.
        </>
      ),
      nextBoxLink: false,
    },
    rejected: {
      icon: 'cancel',
      iconBg: 'bg-red-100 text-red-600',
      heading: 'Booking Rejected',
      subheading: (
        <>
          Hi <strong>{booking.guest_name}</strong>, your booking request was rejected.
        </>
      ),
      badgeClass: 'bg-red-100 text-red-800',
      emailDesc: (
        <>
          An email notification has been sent to <strong>{booking.guest_email}</strong>.
        </>
      ),
      nextBoxBg: 'bg-red-50 border border-red-200',
      nextBoxIcon: 'info',
      nextBoxIconColor: 'text-red-500',
      nextBoxTitle: 'Payment Verification Failed',
      nextBoxText: (
        <>
          booking rejected due to inauthentic payment image given. If you believe this is a mistake, please make a new booking with a valid receipt, or reach out to us.
        </>
      ),
      nextBoxLink: false,
    },
    expired: {
      icon: 'history',
      iconBg: 'bg-gray-100 text-gray-600',
      heading: 'Booking Expired',
      subheading: (
        <>
          Hi <strong>{booking.guest_name}</strong>, this booking request has expired.
        </>
      ),
      badgeClass: 'bg-gray-100 text-gray-800',
      emailDesc: (
        <>
          Please submit a new booking request if you would still like to stay.
        </>
      ),
      nextBoxBg: 'bg-gray-50 border border-gray-200',
      nextBoxIcon: 'info',
      nextBoxIconColor: 'text-gray-500',
      nextBoxTitle: 'Request Expired',
      nextBoxText: (
        <>
          Booking requests automatically expire if they are not confirmed within the reservation window.
        </>
      ),
      nextBoxLink: false,
    }
  };

  const config = configMap[displayStatus] || {
    icon: 'info',
    iconBg: 'bg-gray-100 text-gray-600',
    heading: 'Booking Status',
    subheading: (
      <>
        Booking status: <strong>{displayStatus}</strong>
      </>
    ),
    badgeClass: 'bg-gray-100 text-gray-800',
    emailDesc: '',
    nextBoxBg: 'bg-gray-50 border border-gray-200',
    nextBoxIcon: 'info',
    nextBoxIconColor: 'text-gray-500',
    nextBoxTitle: 'Booking Details',
    nextBoxText: (
      <>
        Review your booking summary details below.
      </>
    ),
    nextBoxLink: false,
  };

  return (
    <>
      <Navbar content={content} />
      <main className="min-h-screen bg-background-light pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-4`}>
              <span className="material-icons text-3xl">{config.icon}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.heading}</h1>
            <p className="text-gray-600 mb-6">
              {config.subheading}
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${config.badgeClass}`}>
                  {displayStatus}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              {config.emailDesc}
            </p>

            {/* What happens next / Status info box */}
            <div className={`${config.nextBoxBg} rounded-xl p-4 text-left mb-6`}>
              <div className="flex items-start gap-3">
                <span className={`material-icons ${config.nextBoxIconColor} mt-0.5`}>{config.nextBoxIcon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{config.nextBoxTitle}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {config.nextBoxText}
                  </p>
                  {config.nextBoxLink && (
                    <a
                      href={`tel:${content.phone}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 hover:text-amber-900"
                    >
                      <span className="material-icons text-base">call</span>
                      {content.phone}
                    </a>
                  )}
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
