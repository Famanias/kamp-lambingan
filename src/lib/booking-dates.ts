export interface BookingDateRange {
  check_in: string | null;
  check_out: string | null;
  status?: string | null;
  is_archived?: boolean | null;
}

function parseDateUTC(dateStr: string): Date | null {
  const parts = dateStr.split('-').map((part) => Number(part));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function expandDateRange(checkIn: string, checkOut: string, inclusive = true): string[] {
  const start = parseDateUTC(checkIn);
  const end = parseDateUTC(checkOut);
  if (!start || !end) return [];

  const last = new Date(end.getTime());
  if (!inclusive) last.setUTCDate(last.getUTCDate() - 1);
  if (last.getTime() < start.getTime()) return [];

  const dates: string[] = [];
  for (const cursor = new Date(start.getTime()); cursor.getTime() <= last.getTime(); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(formatDateUTC(cursor));
  }
  return dates;
}

export function collectBookedDates(
  bookings: BookingDateRange[],
  options?: {
    includeCancelled?: boolean;
    includeArchived?: boolean;
    inclusive?: boolean;
    startDate?: string;
  }
): string[] {
  const includeCancelled = options?.includeCancelled ?? false;
  const includeArchived = options?.includeArchived ?? false;
  const inclusive = options?.inclusive ?? true;
  const startDate = options?.startDate ?? null;

  const dates = new Set<string>();
  for (const booking of bookings) {
    if (!booking.check_in || !booking.check_out) continue;
    if (!includeCancelled && booking.status === 'cancelled') continue;
    if (!includeArchived && booking.is_archived) continue;

    for (const date of expandDateRange(booking.check_in, booking.check_out, inclusive)) {
      if (startDate && date < startDate) continue;
      dates.add(date);
    }
  }

  return Array.from(dates).sort();
}
