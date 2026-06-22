# Booking Capacity System

Transition the booking system from a binary availability model ("is date booked") to a guest-capacity-based model. Every date defaults to a capacity of 50 guests, which can be customized by administrators in the admin panel. Date availability is determined by the remaining capacity for all dates in a requested check-in/check-out range.

## User Review Required

> [!IMPORTANT]
> **Booking Occupancy Rules**
>
> Capacity consumption is calculated using accommodation-style occupancy:
>
> * Occupied dates include the check-in date.
> * Occupied dates exclude the check-out date.
>
> Example:
>
> * Check-in: `2026-07-01`
> * Check-out: `2026-07-03`
>
> Capacity is consumed on:
>
> * `2026-07-01`
> * `2026-07-02`
>
> Capacity is **not** consumed on:
>
> * `2026-07-03`
>
> Formula:
>
> ```
> check_in <= date < check_out
> ```

> [!IMPORTANT]
> **Pending Booking Capacity Consumption**
>
> To reduce overbooking risk, both `pending` and `confirmed` bookings consume date capacity.
>
> However, stale pending bookings must not permanently reserve capacity.
>
> Capacity-consuming statuses:
>
> * `pending` (within expiration window)
> * `confirmed`
>
> Non-capacity-consuming statuses:
>
> * `cancelled`
> * `archived`
> * `expired`
>
> Pending bookings older than the configured expiration period (e.g. 30 minutes) should automatically transition to `expired`.

> [!IMPORTANT]
> **AI Confirmation Requirement**
>
> The AI booking assistant must never create a booking immediately after collecting all required information.
>
> Before invoking the booking tool, the AI must:
>
> 1. Present a complete booking summary.
> 2. Ask for explicit confirmation.
> 3. Wait for a clear confirmation response.
>
> Accepted confirmation examples:
>
> * "Yes"
> * "Confirm"
> * "Proceed"
> * "Book it"
>
> Only after explicit confirmation may the booking creation tool be called.

## Open Questions

None at this stage. We have all details needed.

---

## Proposed Changes

### Database Component

Create a table to store custom date-specific capacities.

#### [NEW] date-capacities.sql

```sql
CREATE TABLE IF NOT EXISTS public.date_capacities (
  date          date PRIMARY KEY,
  max_capacity  integer NOT NULL CHECK (max_capacity >= 0)
);

ALTER TABLE public.date_capacities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read date_capacities"
ON public.date_capacities
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin all date_capacities"
ON public.date_capacities
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admins
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admins
  )
);
```

### Booking Expiration Support

If not already implemented, add support for automatic expiration of stale pending bookings.

Requirements:

* Pending bookings expire after the configured timeout.
* Expired bookings no longer consume capacity.
* Capacity calculations must ignore expired bookings.

---

### Backend Component

#### [MODIFY] bookings.ts

Add new server actions:

* `getDateCapacities()`
* `setDateCapacity(date: string, maxCapacity: number)`
* `deleteDateCapacity(date: string)`

All administrative actions must use `requireAdmin()`.

Add helper:

```ts
getCapacityForDates(checkIn, checkOut)
```

Returns per-date capacity information:

```ts
{
  date,
  maximumCapacity,
  bookedGuests,
  remainingCapacity,
  isFullyBooked
}
```

Capacity calculations must:

* Use `check_in <= date < check_out`
* Include valid `pending` bookings
* Include `confirmed` bookings
* Exclude `cancelled`
* Exclude `archived`
* Exclude `expired`

Rename:

```ts
getBookedDates()
```

to:

```ts
getFullyBookedDates()
```

since the function now represents dates whose remaining capacity has reached zero.

---

### Overbooking Protection

#### [CRITICAL]

Capacity validation must not rely solely on a pre-insert availability check.

The system must perform booking creation in a concurrency-safe manner to prevent simultaneous requests from exceeding capacity.

Acceptable approaches include:

* Database transactions
* Row locking
* Serializable isolation
* Atomic reservation logic

The booking process must guarantee that two concurrent requests cannot both consume the same remaining capacity.

---

### Booking Creation Flow

#### [MODIFY] createBooking(formData)

Before creating a booking:

1. Recalculate capacity for every date in the requested stay.
2. Verify remaining capacity is sufficient for the requested `pax`.
3. Perform validation and insertion inside a concurrency-safe transaction.
4. Reject the booking if any date in the range lacks sufficient capacity.

---

### AI Assistant Component

#### [MODIFY] route.ts

Update the `checkAvailability` tool.

Tool description should explicitly state that availability is capacity-based rather than date-based.

Return:

```ts
{
  available: boolean,
  maxGuestsAllowed: number,
  maximumCapacity: number,
  bookedGuests: number,
  remainingCapacity: number,
  isFullyBooked: boolean,
  details: Array<{
    date: string,
    maximumCapacity: number,
    bookedGuests: number,
    remainingCapacity: number,
    isFullyBooked: boolean
  }>
}
```

Definitions:

* `maxGuestsAllowed` = minimum remaining capacity across all dates in the requested range.
* `available` = requested guest count fits within `maxGuestsAllowed`.

The AI should use `maxGuestsAllowed` when responding to users.

Example:

> "This date range is available for up to 12 guests."

---

### AI Booking Guardrails

Update booking instructions:

* Never auto-create bookings after collecting information.
* Always present a booking summary.
* Always ask for confirmation.
* Only call the booking tool after explicit user approval.
* Never infer confirmation from unrelated messages.

---

### Admin Dashboard Component

#### [MODIFY] page.tsx

* Fetch custom capacities using `getDateCapacities()`.
* Render a new `CapacityManager` component.

#### [NEW] CapacityManager.tsx

Features:

* Date selector
* Maximum capacity input
* Save/Update button
* Reset-to-default button
* Table showing:

  * Date
  * Custom capacity
  * Current booked guests
  * Remaining capacity

This gives administrators visibility into actual utilization rather than only configured limits.

---

## Verification Plan (DO NOT EXECUTE THIS YET! THIS IS ONLY FOR REFERENCE!)

### Automated Tests

* Build verification: `npm run build`
* Capacity calculation unit tests
* Pending booking expiration tests
* Concurrent booking protection tests

### Manual Verification

#### 1. Set Custom Capacity

Set:

```text
2026-07-01 → 10 guests
```

Verify admin dashboard updates correctly.

#### 2. Capacity Validation

Create booking:

```text
2026-07-01 → 2026-07-02
5 guests
```

Verify success.

Attempt booking:

```text
2026-07-01 → 2026-07-02
8 guests
```

Verify rejection because only 5 spots remain.

#### 3. Check-Out Day Validation

Booking A:

```text
Check-in: 2026-07-01
Check-out: 2026-07-03
5 guests
```

Booking B:

```text
Check-in: 2026-07-03
Check-out: 2026-07-05
5 guests
```

Verify both are allowed because the checkout day is not counted as occupied.

#### 4. Pending Expiration

Create a pending booking.

Allow it to expire.

Verify:

* Status becomes `expired`.
* Capacity becomes available again.

#### 5. AI Assistant Verification

Ask:

> "Can I book July 1–3 for 8 guests?"

Verify:

* AI checks remaining capacity.
* AI reports available capacity.
* AI does not create a booking automatically.
* AI presents a booking summary.
* AI waits for explicit confirmation.

#### 6. Concurrency Test

Submit two simultaneous booking requests that would exceed remaining capacity if both succeeded.

Verify:

* One request succeeds.
* One request fails.
* Capacity is never exceeded.

#### 7. Reset Capacity

Delete the custom capacity entry.

Verify:

* Capacity returns to the default value of 50.
* Availability updates correctly.