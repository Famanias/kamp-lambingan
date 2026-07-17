# Booking System Migration Walkthrough (Revised)

The codebase has been successfully migrated to support the new n8n and Stripe-driven booking architecture, while maintaining the familiar, token-efficient React form on the frontend.

## 1. Database & State Machine Upgrades (Supabase)

We started by creating a robust set of Remote Procedure Calls (RPCs) to act as the single source of truth for business rules, allowing n8n to safely orchestrate without knowing SQL.

### What Changed?
- **State Machine Constraints**: We updated the `bookings.status` check constraint to support the new, fine-grained state machine: `draft`, `awaiting_payment`, `paid`, `confirmed`, `checked_in`, `completed`, `expired`, and `cancelled`.
- **Global Settings**: Injected `booking_hold_minutes` (default 30) into the `app_settings` table to drive your expiration cron jobs.
- **New RPCs**:
  - `check_booking_availability(check_in, check_out, pax)`: Iterates through dates, respects `date_capacities`, and returns `{ available: true/false }`.
  - `create_pending_booking(...)`: Locks the table and inserts a new booking securely into the `awaiting_payment` state.
  - `confirm_booking(booking_id)`, `expire_booking(booking_id)`, `cancel_booking(booking_id)`: Secure mutation functions for state transitions.

> [!TIP]
> n8n simply needs to execute these RPCs using the Supabase node. No raw SQL logic is needed in the workflow.

## 2. Token-Efficient AI & Hybrid UI

Instead of using the AI to conversationally collect details (which burns tokens), the AI will act strictly as a receptionist, immediately calling the `showBookingForm` tool.

### What Changed?
- **AI Knowledge Base**: The AI system prompt has been reverted to strictly call `showBookingForm` and offload collection to the React UI.
- **Form UI Flow**: The frontend `ChatWidget` continues to manage the multi-step `form` -> `verification` -> `summary` state natively, keeping the experience exactly as it was.
- **Stripe Integration**: Upon completing the summary step, the form drops the user into the new `payment` step, rendering a native **Pay Now** button linking to the Stripe session (replacing the old GCash image upload).

## 3. Next.js APIs as n8n Proxies

To make this hybrid flow work without rewriting the frontend form state machine, the Next.js `/api/booking` routes were transformed into secure proxies.

### What Changed?
- **`/api/booking/check`**: No longer does manual date math. It simply calls the `check_booking_availability` RPC and returns the result.
- **`/api/booking/start` & `/api/booking/verify`**: Kept intact. These still securely generate and verify the OTP and store the initial booking payload session.
- **`/api/booking/complete`**: Completely rewritten. Instead of inserting into Supabase directly, this endpoint validates the OTP session and fires a POST request to your `N8N_WEBHOOK_URL` containing the payload. It waits for n8n to return the `{ checkoutUrl }` and sends it back to the frontend.

## 4. Legacy API Deprecation

- `/api/booking/upload-receipt` now returns a `410 Gone` status indicating it is deprecated, as Stripe handles all payments now.

> [!IMPORTANT]
> **Action Required: n8n Workflow Construction**
>
> The Next.js API expects a synchronous response from n8n containing the Stripe URL. 
> 
> 1. Set up a Webhook node in n8n (POST request, Respond: "Using Respond to Webhook Node").
> 2. Add the URL to your `.env` file as `N8N_WEBHOOK_URL`.
> 3. Build the n8n flow to sequentially call: `check_booking_availability` -> `create_pending_booking` -> Create Stripe Checkout Session.
> 4. Use a **Respond to Webhook** node in n8n to return `{ "success": true, "checkoutUrl": "https://stripe...", "bookingId": "KL-..." }` back to Next.js.
