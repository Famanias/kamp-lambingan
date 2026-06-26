import { NextResponse } from 'next/server';
import { getCapacityForDates } from '@/actions/bookings';

export async function POST(req: Request) {
  try {
    const { check_in, check_out, pax } = await req.json();

    if (!check_in || !check_out || !pax) {
      return NextResponse.json(
        { error: 'Missing check_in, check_out, or pax.' },
        { status: 400 }
      );
    }

    if (check_out <= check_in) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date.' },
        { status: 400 }
      );
    }

    const details = await getCapacityForDates(check_in, check_out);
    if (details.length === 0) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    const maxGuestsAllowed = details.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
    const maximumCapacity = details.reduce((min, d) => Math.min(min, d.maximumCapacity), Infinity);
    const bookedGuests = details.reduce((max, d) => Math.max(max, d.bookedGuests), 0);
    const isFullyBooked = details.some((d) => d.isFullyBooked);

    const available = maxGuestsAllowed >= pax;

    return NextResponse.json({
      available,
      maxGuestsAllowed,
      maximumCapacity,
      bookedGuests,
      remainingCapacity: maxGuestsAllowed,
      isFullyBooked,
      details,
    });
  } catch (err: any) {
    console.error('[API booking/check] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
