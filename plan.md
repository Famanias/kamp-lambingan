Revised Implementation Plan: AI Automation Platform using n8n
Goal

Transform Kamp Lambingan from an AI chatbot into an AI-powered resort automation platform.

The chatbot remains responsible for:

Conversational AI
Knowledge retrieval
Detecting user intent
Guiding guests through the booking experience

The CMS remains responsible for:

Business logic
Database integrity
Authentication
Booking creation
Payment processing

n8n becomes the automation orchestrator, reacting to business events and coordinating external services.

High-Level Architecture
                          Guest
                            │
                            ▼
                   Next.js Chat Interface
                            │
                            ▼
                 Existing Groq AI Chatbot
                            │
              Intent Detection + Tool Calls
                            │
            ┌───────────────┴────────────────┐
            ▼                                ▼
      Standard AI Reply              Internal CMS APIs
                                             │
                                             ▼
                                 Booking / Payments / Users
                                             │
                                Domain Events Generated
                                             │
                                             ▼
                                  Automation Gateway
                                             │
                                             ▼
                                            n8n
                                             │
     ┌──────────────┬──────────────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼
Supabase      Payment Gateway    Email APIs     External Services

The important change is this:

The chatbot no longer "owns" the automation. The CMS owns the automation.

This makes every automation reusable outside of chat.

Example:

Booking created via chatbot
Booking created via booking page
Booking created by admin

All three trigger exactly the same workflow.

Phase 1 — Introduce a Domain Event System

Instead of thinking:

Chatbot
↓

Call n8n

Think:

Booking Created

↓

Emit Event

↓

Automation

Create a centralized event emitter inside your CMS.

Examples:

booking.created

booking.confirmed

booking.cancelled

payment.completed

payment.pending

payment.failed

guest.checked_in

guest.checked_out

chat.human_requested

chat.booking_started

chat.booking_completed

Every feature in the CMS emits events.

The chatbot simply becomes one source of events.

Phase 2 — Automation Gateway

Rather than exposing multiple webhook URLs, create one internal automation service.

POST /api/internal/automation

Example payload:

{
  "event": "booking.created",
  "payload": {
    "bookingId": "...",
    "guestEmail": "...",
    "paymentMethod": "gcash_manual"
  }
}

Responsibilities:

Authentication
Logging
Retry
Queueing (future)
Forwarding to n8n

This becomes the only component that knows where n8n lives.

Phase 3 — Introduce AI Tool Calling

Your chatbot should never know implementation details.

Instead, it has tools.

Example tool registry:

check_availability

start_booking

create_booking

cancel_booking

check_booking_status

resend_confirmation

contact_staff

list_packages

calculate_price

start_payment

check_payment_status

The AI only chooses tools.

The CMS executes them.

This keeps prompts extremely clean.

Phase 4 — Dual Payment Architecture

Since you're planning to support both manual GCash and an online gateway, unify the booking flow.

Booking Created

↓

Select Payment Method

↓

┌──────────────┬────────────────────┐
│              │                    │
▼              ▼                    ▼

PayMongo      GCash Transfer

│              │

Webhook       Upload Receipt

│              │

payment.completed

payment.pending_review

│              │

booking.confirmed

Notice something important:

Everything becomes event-driven.

No matter how payment happens, the downstream automation is identical.

Phase 5 — n8n Workflow Library

Instead of a handful of workflows, organize them into categories.

Booking Automation
booking.created
booking.confirmed
booking.cancelled
booking.reminder
booking.expired
Payment Automation
payment.created
payment.completed
payment.failed
payment.pending_review
payment.refunded
Guest Communication
confirmation email
reminder email
thank-you email
review request
abandoned booking follow-up
Staff Automation
New booking notification
Manual payment review notification
Daily arrivals report
Daily departures report
AI Automation
Human escalation
Conversation summary
Conversation analytics
FAQ improvement suggestions
Phase 6 — Event Timeline

Every booking should build an event timeline.

Example:

Booking Created

↓

Guest Verified Email

↓

Payment Started

↓

Payment Completed

↓

Booking Confirmed

↓

Reminder Sent

↓

Checked In

↓

Checked Out

↓

Review Requested

This timeline becomes incredibly useful for debugging.

Phase 7 — Analytics

Instead of storing only chatbot analytics, track business analytics.

Examples:

Bookings

Revenue

Payment Success Rate

Manual Payments

Gateway Payments

Average Response Time

Chat Conversations

Booking Conversion Rate

Abandoned Bookings

AI Usage

Automation Success Rate

n8n can push these into dashboards.

Phase 8 — Future AI Automations

Once the foundation exists, adding automations becomes trivial.

Examples:

CRM
Booking Confirmed

↓

Create Lead

↓

HubSpot
Google Calendar
Booking Confirmed

↓

Create Calendar Event
Discord
New Booking

↓

Notify Resort Staff
Slack
Human Escalation

↓

Notify Reception
Google Sheets
Every Booking

↓

Append Row
Accounting
Payment Completed

↓

Generate Invoice
Loyalty
Third Stay

↓

Issue Discount Coupon
Phase 9 — Automation Dashboard

Inside your CMS, create a dedicated Automation page.

Example:

Automation Runs

✓ Booking Created

✓ Confirmation Email

✓ Calendar Event

✓ Staff Notification

✗ CRM Sync

Instead of logging into n8n, admins can immediately see:

workflow
status
duration
retries
execution ID
error message
Phase 10 — AI-Orchestrated Business Actions

Eventually, your chatbot becomes capable of deciding which business action to take.

Example:

Guest:

I'd like to pay online instead.

AI:

Tool

↓

start_payment

CMS:

Creates PayMongo Checkout

↓

Returns URL

↓

AI sends payment link

Or:

Guest:

I'll pay through GCash.

AI:

Tool

↓

manual_payment

CMS:

Displays QR

↓

Waits for upload

↓

Emits payment.pending_review

The AI doesn't need to know how either payment flow works—it just invokes the appropriate tool.

Final Architecture
                          Guest
                            │
                            ▼
                  Existing AI Chatbot (Groq)
                            │
                  Intent Detection + Tools
                            │
                            ▼
                  Internal CMS Business Layer
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
    Booking API        Payment API         User API
        │                   │                   │
        └───────────────┬───┴───────────────────┘
                        ▼
                 Domain Event Bus
                        │
                        ▼
               Internal Automation Gateway
                        │
                        ▼
                       n8n
                        │
    ┌───────────┬────────────┬─────────────┬──────────────┐
    ▼           ▼            ▼             ▼
 Supabase   PayMongo      Email APIs    Third-Party Apps


Why this revision is stronger

The biggest architectural shift is moving away from "chatbot-driven automation" to "event-driven automation." The chatbot becomes just one interface to the system; bookings created from the website, admin panel, or future mobile app all emit the same events and trigger the same workflows.