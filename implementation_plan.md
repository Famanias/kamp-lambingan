AI Prompt: Implement n8n Integration for Kamp Lambingan (Foundation Only)
Objective

Implement the first production-ready iteration of n8n integration for the Kamp Lambingan Resort CMS.

Important: This is NOT a rewrite of the existing chatbot.

The current chatbot already has:

AI chatbot powered by Groq
Knowledge base / RAG
Intent detection
Booking form
Booking creation
Email verification
Booking confirmation emails
Supabase backend
Admin CMS

These features must continue to work exactly as they do today.

The goal is to transform the existing system into an event-driven automation platform by introducing n8n as the automation orchestrator.

Do NOT implement advanced enterprise features such as CRM integrations, loyalty systems, analytics dashboards, or marketing automations in this iteration.

Architecture

The architecture should become:

Guest
    │
    ▼
Next.js Chat UI
    │
    ▼
Existing Groq Chatbot
    │
Intent Detection
    │
Tool Selection
    │
    ▼
Internal CMS APIs
    │
Business Logic
    │
Domain Event
    │
Automation Gateway
    │
    ▼
n8n

The chatbot must never communicate directly with n8n.

Only the CMS communicates with n8n.

Scope

Only implement the following phases.

Phase 1 — Domain Event System

Introduce an internal domain event system.

Business actions should emit events such as:

booking.created

booking.confirmed

booking.cancelled

payment.started

payment.completed

payment.pending_review

payment.failed

chat.human_requested

The chatbot is simply one producer of these events.

The booking page and admin panel should also be capable of producing the same events.

Do not tightly couple automations to the chatbot.

Phase 2 — Automation Gateway

Create a centralized automation layer.

Example endpoint:

POST /api/internal/automation

Responsibilities:

authenticate requests
validate payload
log automation requests
forward events to n8n
retry transient failures

The CMS should never contain hardcoded n8n webhook URLs throughout the codebase.

There should be one reusable automation gateway.

Phase 3 — AI Tool Layer

Introduce a server-side tool registry.

Example tools:

check_availability

create_booking

cancel_booking

check_booking_status

resend_confirmation

contact_staff

start_payment

The chatbot only decides which tool to invoke.

The chatbot must never know implementation details.

The CMS executes the tool.

If a tool requires automation, it emits a domain event.

Phase 4 — Payment Integration Foundation

Prepare the chatbot and automation architecture to support two payment methods.

Manual GCash

Booking

↓

Upload Receipt

↓

payment.pending_review

↓

Admin Review

↓

payment.completed

Online Payment Gateway

Booking

↓

PayMongo Checkout

↓

Webhook

↓

payment.completed

Do NOT implement PayMongo in this task.

Only design the architecture so that both payment methods share the same downstream automation flow.

Phase 5 — Initial n8n Workflows

Implement only these workflows.

Booking Created

Trigger:

booking.created

Actions:

send booking confirmation email
notify staff
Booking Reminder

Scheduled workflow.

Find tomorrow's bookings.

Send reminder email.

Human Escalation

Trigger:

chat.human_requested

Actions:

notify administrator
include conversation summary
Resend Confirmation

Trigger:

resend_confirmation

Actions:

resend booking confirmation email
Payment Completed

Trigger:

payment.completed

Actions:

confirm booking
notify guest
notify staff
Implementation Requirements

The implementation should:

preserve the existing chatbot
preserve the existing booking flow
preserve the existing email verification flow
preserve the existing booking confirmation emails

Do NOT rewrite existing features unless necessary.

Instead, extend them.

Code Quality

The implementation should follow these principles:

event-driven architecture
loose coupling
reusable automation gateway
dependency injection where appropriate
centralized configuration
strongly typed payloads
no duplicated business logic
production-ready error handling
structured logging
retry support for automation requests
Deliverables

Produce:

Complete implementation plan
File-by-file modification list
Database changes (only if required)
API changes
New automation gateway
Tool registry
Event system
n8n workflow definitions
Environment variables
Verification checklist
Important Constraints

Do NOT:

rebuild the chatbot
replace Groq
move conversation handling into n8n
duplicate booking logic
duplicate email logic
tightly couple business logic to n8n

Treat n8n strictly as the automation orchestrator, while the CMS remains the source of truth for business logic and data. The final implementation should make it easy to add future workflows by emitting new domain events and registering new tools, without requiring major changes to the chatbot or core application.