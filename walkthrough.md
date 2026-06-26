# Walkthrough: Metadata-Driven Package System

I have successfully converted the booking and package systems of Kamp Lambingan to be fully **metadata-driven**. The behavior of guest counts and check-out selections is now controlled entirely by package configurations set in the Admin Panel rather than hardcoded rules or package names.

---

## What Has Been Built

### 1. Extended Package Model & Defaults
- **Types Update**: Extended the `Package` interface in [types.ts](file:///d:/repos/kamp-lambingan/src/lib/types.ts) to require `price: number`, `description: string`, `capacity: number` (Maximum Guests), and `maxStayDays: number` (Maximum Stay (Days)).
- **Default Package Setup**: Configured standard options in [defaults.ts](file:///d:/repos/kamp-lambingan/src/lib/defaults.ts) to use these new fields explicitly (Weekday and Weekend packages are set to `maxStayDays: 1`, Group Retreat set to `maxStayDays: 3`).

### 2. Auto-Migration & Normalization
- **Legacy Fallbacks**: Updated `getContent()` in [content.ts](file:///d:/repos/kamp-lambingan/src/actions/content.ts) to intercept legay package data loaded from the DB, clean up price string representations into numbers, and assign sensible defaults for capacity and stay duration. This keeps old database entries backwards-compatible.
- **Shared Matching Utility**: Modified `getSelectedPackage()` in [package-helper.ts](file:///d:/repos/kamp-lambingan/src/lib/package-helper.ts) to fetch stay limits and guest capacities directly from the newly created metadata properties.

### 3. Admin Panel UI Updates
- **Inputs added**: Added input controls to the Packages editor under the **Admin → Content** tab in [ContentEditor.tsx](file:///d:/repos/kamp-lambingan/src/components/admin/ContentEditor.tsx):
  - **Maximum Guests**: Numeric required input, minimum value `1`.
  - **Maximum Stay (Days)**: Numeric required input, minimum value `1`.
  - **Price (₱)**: Converted to a numeric required input.
  - **Description**: Marked as a required textarea.
- **Package Addition**: Configured the "Add Package" action to default new packages to `maxStayDays: 1` and `capacity: 2`.

### 4. Parity Booking Form Enhancements
- **Dynamic Check-out Logic**: Updated the Chat Widget Booking Wizard [ChatWidget.tsx](file:///d:/repos/kamp-lambingan/src/components/site/ChatWidget.tsx) and the Standalone Page Form [BookForm.tsx](file:///d:/repos/kamp-lambingan/src/components/site/BookForm.tsx):
  - **`maxStayDays === 1`**: Check-out input is replaced by a read-only date view automatically locked to `Check-in + 1 day`. Displays helper message: `"This package includes a 1-day stay. The check-out date is calculated automatically."`
  - **`maxStayDays > 1`**: Check-out input is editable. Displays helper message: `"Maximum stay: X days"`. Prevents submission if the selected range exceeds the maximum allowed stay duration.
- **Dynamic Pax Clamping**: Enforces guest limits dynamically up to `package.capacity`, preventing form submission if exceeded. Displays: `"Maximum guests allowed: X"` helper labels.

### 5. Multi-Layered Backend API Securing
- Enforced identical checks on the backend (capacity checking, stay duration matching stay limits) in:
  - `createBooking` server action inside [bookings.ts](file:///d:/repos/kamp-lambingan/src/actions/bookings.ts).
  - API start session endpoint [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/start/route.ts).
  - API complete checkout endpoint [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/complete/route.ts).

### 6. AI Agent Synchronization
- Updated AI instruction templates in [knowledge-base.ts](file:///d:/repos/kamp-lambingan/src/lib/knowledge-base.ts) so the bot dynamically understands configuration limits and ceases explaining name-based checks.

---

## Verification Results

### Automated Verification
Next.js production build (`npm run build`) runs and compiles successfully with zero TypeScript or path errors:
```text
▲ Next.js 16.1.6 (Turbopack)
- Environments: .env
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (13/13) in 583.6ms
  Finalizing page optimization ...
```
All route endpoints and client components are verified to compile.

---

## Rejection Status Tracking & Display (New Update)

I have implemented tracking of the payment rejection reason in the database to display a detailed **`rejected`** status and custom reason message to guests and admins instead of generic `cancelled` statuses.

### Changes Made

1. **Database Schema updates**:
   - Added the `status_reason` column to the schema definitions in [bookings-table.sql](file:///d:/repos/kamp-lambingan/bookings-table.sql) and [bookings-capacity.sql](file:///d:/repos/kamp-lambingan/bookings-capacity.sql):
     `ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_reason text;`
2. **TypeScript & Model Integration**:
   - Added `status_reason: string | null` to the `Booking` interface in [types.ts](file:///d:/repos/kamp-lambingan/src/lib/types.ts).
   - Added `status_reason?: string | null` to the `BookingSummary` type in [MyBookingsClient.tsx](file:///d:/repos/kamp-lambingan/src/app/my-bookings/MyBookingsClient.tsx).
3. **Server Actions Logic**:
   - Modified `updateBookingStatus` inside [bookings.ts](file:///d:/repos/kamp-lambingan/src/actions/bookings.ts) to write the `status_reason: reason` value to the database when updating status.
   - Updated `getBookingByReference` to explicitly retrieve the `status_reason` column when guests look up their reference code.
4. **Guest Lookup Pages**:
   - Modified [MyBookingsClient.tsx](file:///d:/repos/kamp-lambingan/src/app/my-bookings/MyBookingsClient.tsx) to check if a booking is cancelled with a `payment_rejected` reason. It dynamically renders the status as **`rejected`** with a red badge, displaying the rejection alert message:
     `Booking rejected due to inauthentic payment image given.`
   - Updated [page.tsx](file:///d:/repos/kamp-lambingan/src/app/booking/[id]/page.tsx) to dynamically adjust headings, icons, status badges, and instructions for all booking states (`pending`, `confirmed`, `cancelled`, `rejected`, `expired`). Under the rejected state, it displays the message:
     `booking rejected due to inauthentic payment image given. If you believe this is a mistake, please make a new booking with a valid receipt, or reach out to us.`
5. **Admin Dashboard Views**:
   - Updated [BookingsTable.tsx](file:///d:/repos/kamp-lambingan/src/app/admin/bookings/BookingsTable.tsx) to map and show `rejected` in red for rejected bookings in both the table rows and the details dialog popup.
   - Updated [page.tsx](file:///d:/repos/kamp-lambingan/src/app/admin/bookings/[id]/page.tsx) to display the `rejected` status in the details card view.

