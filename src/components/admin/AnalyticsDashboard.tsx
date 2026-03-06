'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface AnalyticsData {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  conversionRate: number;
  monthlyTrend: { month: string; bookings: number; revenue: number }[];
  byPackage: { name: string; bookings: number; confirmed: number; revenue: number }[];
  statusBreakdown: { name: string; value: number }[];
  paymentBreakdown: { name: string; value: number }[];
  topCheckinMonth: string;
  fullPaymentRate: number;
}

const PIE_STATUS = ['#16a34a', '#eab308', '#ef4444'];
const PIE_PAYMENT = ['#16a34a', '#6366f1'];

const formatCurrency = (v: number) =>
  v > 0 ? '₱' + v.toLocaleString('en-PH') : '₱0';

const CustomTooltipCurrency = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function EmptyChart() {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-gray-300 gap-2">
      <span className="material-icons text-4xl">insert_chart</span>
      <p className="text-sm">No data yet</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${colorClass}`}>
        <span className="material-icons text-sm">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs font-medium text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const hasBookings = data.totalBookings > 0;
  const hasPackageData = data.byPackage.length > 0;
  const hasPaymentData = data.paymentBreakdown.some((p) => p.value > 0);

  const kpis = [
    {
      label: 'Total Bookings',
      value: data.totalBookings,
      icon: 'book_online',
      colorClass: 'text-blue-600 bg-blue-50',
      sub: 'All time, all statuses',
    },
    {
      label: 'Confirmed',
      value: data.confirmedBookings,
      icon: 'check_circle',
      colorClass: 'text-green-600 bg-green-50',
      sub: `${data.conversionRate}% conversion rate`,
    },
    {
      label: 'Pending Review',
      value: data.pendingBookings,
      icon: 'pending',
      colorClass: 'text-yellow-600 bg-yellow-50',
      sub: 'Awaiting confirmation',
    },
    {
      label: 'Cancelled',
      value: data.cancelledBookings,
      icon: 'cancel',
      colorClass: 'text-red-600 bg-red-50',
      sub: 'Guest or admin cancelled',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: 'payments',
      colorClass: 'text-emerald-600 bg-emerald-50',
      sub: 'From confirmed bookings',
    },
    {
      label: 'Avg. Booking Value',
      value: formatCurrency(data.avgBookingValue),
      icon: 'trending_up',
      colorClass: 'text-purple-600 bg-purple-50',
      sub: 'Per confirmed booking',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Booking insights derived from all-time data.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Secondary stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-indigo-600 text-sm">event_available</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{data.topCheckinMonth || '—'}</p>
            <p className="text-xs text-gray-500">Peak check-in month</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-teal-600 text-sm">payment</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {data.fullPaymentRate > 0 ? `${data.fullPaymentRate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">Full payment rate</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-orange-600 text-sm">star_rate</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {data.byPackage[0]?.name || '—'}
            </p>
            <p className="text-xs text-gray-500">Most booked package</p>
          </div>
        </div>
      </div>

      {/* Row 1: Bookings Trend + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Bookings Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Last 12 months</p>
          {hasBookings ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthlyTrend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltipCurrency />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16a34a' }}
                  activeDot={{ r: 5 }}
                  name="bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Booking Status</h3>
          <p className="text-xs text-gray-400 mb-4">Confirmed / Pending / Cancelled</p>
          {hasBookings ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_STATUS[i % PIE_STATUS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Row 2: Package Performance + Payment Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Package Performance</h3>
          <p className="text-xs text-gray-400 mb-4">Total bookings vs confirmed per package</p>
          {hasPackageData ? (
            <ResponsiveContainer width="100%" height={Math.max(220, data.byPackage.length * 56)}>
              <BarChart
                data={data.byPackage}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip content={<CustomTooltipCurrency />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bookings" name="Total" fill="#93c5fd" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Payment Type</h3>
          <p className="text-xs text-gray-400 mb-4">Full payment vs 50% downpayment</p>
          {hasPaymentData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.paymentBreakdown.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_PAYMENT[i % PIE_PAYMENT.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Row 3: Revenue Trend */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Revenue Trend</h3>
        <p className="text-xs text-gray-400 mb-4">
          Monthly revenue from confirmed bookings (last 12 months)
        </p>
        {hasBookings ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthlyTrend} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `₱${Math.round(v / 1000)}k` : `₱${v}`)}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* Traffic & Visitors — Vercel Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-blue-600 text-sm">bar_chart</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Traffic & Visitor Analytics</h3>
              <p className="text-xs text-gray-500">Powered by Vercel Analytics</p>
            </div>
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            View in Vercel
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Unique Visitors', icon: 'person' },
            { label: 'Page Views', icon: 'visibility' },
            { label: 'Top Traffic Source', icon: 'share' },
            { label: 'Top Country', icon: 'public' },
          ].map((m) => (
            <div
              key={m.label}
              className="border border-dashed border-gray-200 rounded-xl p-4 text-center"
            >
              <span className="material-icons text-gray-200 text-3xl">{m.icon}</span>
              <p className="text-xs text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            📊 How to view visitor data
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Vercel Analytics is already integrated into this site. Visit your{' '}
            <strong>Vercel Dashboard → your project → Analytics tab</strong> to see real-time
            visitors, page views, traffic sources (direct, social, search), device types, and
            geographic breakdowns. Data is available from the moment the{' '}
            <code className="bg-blue-100 px-1 rounded">@vercel/analytics</code> script was first
            deployed.
          </p>
        </div>
      </div>

      {/* Chatbot Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-purple-600 text-sm">smart_toy</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Chatbot Usage</h3>
              <p className="text-xs text-gray-500">AI assistant interaction analytics</p>
            </div>
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sessions Started', icon: 'chat_bubble_outline' },
            { label: 'Questions Asked', icon: 'help_outline' },
            { label: 'Converted to Booking', icon: 'shopping_cart' },
            { label: 'Top Query Topic', icon: 'topic' },
          ].map((m) => (
            <div
              key={m.label}
              className="border border-dashed border-gray-200 rounded-xl p-4 text-center"
            >
              <span className="material-icons text-gray-200 text-3xl">{m.icon}</span>
              <p className="text-xs text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Chatbot session tracking will be added in a future update. Conversations are currently
          powered by Groq and processed server-side without persistent logging.
        </p>
      </div>
    </div>
  );
}
