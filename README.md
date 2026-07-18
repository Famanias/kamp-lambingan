# 🌿 Kamp Lambingan: Next-Generation Resort Management System

The **Kamp Lambingan Booking & CMS Platform** is a fully automated system designed exclusively for modern glamping resorts and boutique hospitality businesses. 

It eliminates manual tracking, repetitive customer inquiries, and clunky booking processes by providing a seamless frontend for guests and a powerful, automated backend for administrators.

---

## 🚀 Key System Features

### 🤖 24/7 AI Receptionist
The integrated **AI Chat Assistant** is deeply connected to the resort's knowledge base. It answers questions regarding amenities, pricing, and rules, guiding guests directly to the booking page at any time of day.

### ⚡ Fully Automated Booking & Payments
The platform utilizes an enterprise-grade microservice architecture powered by **n8n, Stripe, and Supabase**:
- **Frictionless Checkout**: Guests select dates, party size, and packages, then securely process payments via Stripe.
- **Automated Emails**: The system automatically generates unique booking reference codes and sends formatted confirmation, failure, or expiration emails directly to the guest via the **Resend API**.
- **Smart Calendar Cleanup**: Background tasks run automatically every 45 minutes to release abandoned checkout slots back to the public, ensuring the calendar remains accurate.

### 🎨 No-Code Content Management (CMS)
The secure **Admin Dashboard** provides full administrative control without requiring technical expertise:
- Instantly update hero images and gallery photos.
- Modify package pricing, inclusions, and Stripe payment links.
- Edit FAQs, policies, and resort features in real time.

### 📊 Centralized Booking Management
Administrators can manage all reservations from a single interface. The system allows users to view incoming bookings, search by reference codes, and track upcoming guest arrivals.

---

## 🌟 The Guest Experience

The platform prioritizes a frictionless user journey for all guests:

1. **Discover**: Visitors browse a fast, mobile-responsive website showcasing villas, activities, and packages.
2. **Engage**: Guests can ask the AI widget specific questions and receive immediate, accurate responses.
3. **Book & Pay**: A streamlined two-step checkout process securely handles payments via Stripe.
4. **Confirm**: Within seconds, guests receive a branded email confirmation containing a unique reference code.

---

## 🛠 Technical Architecture

The platform is built on modern, scalable technologies to ensure high performance and reliability:

- **Next.js 16 (App Router)** for optimized frontend performance and SEO.
- **Supabase (PostgreSQL)** for secure, real-time database management and image storage.
- **n8n Automation Engine** serving as the integration layer connecting webhooks, databases, and emails.
- **Stripe** for secure payment processing.
- **Resend** for reliable transactional email delivery.
- **Vercel AI SDK + Groq** for intelligent, low-latency chatbot responses.

## ⚠️ Disclaimer

**Notice of Development Environment:** The Stripe payment gateway is currently configured in test mode. Please refrain from submitting live financial data or production credit card information. All transactions processed during this phase are simulations for validation purposes only.