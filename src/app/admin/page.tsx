import { getAllBookingsForAnalytics } from '@/actions/bookings';
import AnalyticsDashboard, { AnalyticsData } from '@/components/admin/AnalyticsDashboard';

export const metadata = { title: 'Analytics – Admin' };
export const dynamic = 'force-dynamic';

const parseAmount = (s: string | null) =>
  parseInt((s ?? '').replace(/[^\d]/g, ''), 10) || 0;

export default async function AdminDashboard() {
  const { data: bookings } = await getAllBookingsForAnalytics();

  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const pending = bookings.filter((b) => b.status === 'pending');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const totalRevenue = confirmed.reduce((sum, b) => sum + parseAmount(b.amount_due), 0);
  const avgBookingValue =
    confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0;
  const conversionRate =
    bookings.length > 0 ? Math.round((confirmed.length / bookings.length) * 100) : 0;

  // Monthly trend — last 12 months based on created_at
  const now = new Date();
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const matching = bookings.filter((b) => {
      const bd = new Date(b.created_at);
      return bd.getFullYear() === year && bd.getMonth() === month;
    });
    return {
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      bookings: matching.length,
      revenue: matching
        .filter((b) => b.status === 'confirmed')
        .reduce((s, b) => s + parseAmount(b.amount_due), 0),
    };
  });

  // Bookings by package
  const packageNames = [...new Set(bookings.map((b) => b.package_name))];
  const byPackage = packageNames
    .map((name) => {
      const pkgBookings = bookings.filter((b) => b.package_name === name);
      return {
        name: name.length > 20 ? name.slice(0, 20) + '…' : name,
        bookings: pkgBookings.length,
        confirmed: pkgBookings.filter((b) => b.status === 'confirmed').length,
        revenue: pkgBookings
          .filter((b) => b.status === 'confirmed')
          .reduce((s, b) => s + parseAmount(b.amount_due), 0),
      };
    })
    .sort((a, b) => b.bookings - a.bookings);

  // Peak check-in month from confirmed bookings
  const checkInMonthCounts: Record<string, number> = {};
  confirmed.forEach((b) => {
    if (b.check_in) {
      const d = new Date(b.check_in);
      const key = d.toLocaleString('default', { month: 'long' });
      checkInMonthCounts[key] = (checkInMonthCounts[key] ?? 0) + 1;
    }
  });
  const topCheckinMonth =
    Object.entries(checkInMonthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  // Full payment rate
  const fullPaymentCount = bookings.filter((b) => b.payment_type === 'full').length;
  const fullPaymentRate =
    bookings.length > 0 ? Math.round((fullPaymentCount / bookings.length) * 100) : 0;

  const analyticsData: AnalyticsData = {
    totalBookings: bookings.length,
    confirmedBookings: confirmed.length,
    pendingBookings: pending.length,
    cancelledBookings: cancelled.length,
    totalRevenue,
    avgBookingValue,
    conversionRate,
    monthlyTrend,
    byPackage,
    topCheckinMonth,
    fullPaymentRate,
    statusBreakdown: [
      { name: 'Confirmed', value: confirmed.length },
      { name: 'Pending', value: pending.length },
      { name: 'Cancelled', value: cancelled.length },
    ],
    paymentBreakdown: [
      { name: 'Full Payment', value: fullPaymentCount },
      {
        name: 'Downpayment',
        value: bookings.filter((b) => b.payment_type === 'downpayment').length,
      },
    ],
  };

  return <AnalyticsDashboard data={analyticsData} />;
}
