import { SiteContent } from '@/lib/types';

export function getGeneralInfo(content: SiteContent): string {
  const activities = content.activities.map((a) => `  - ${a.title}: ${a.description}`).join('\n');
  const features = content.features.map((f) => `  - ${f.title}: ${f.description}`).join('\n');
  const villas = (content.villas ?? [])
    .map((v) => `  - ${v.name} (${v.location}): capacity ${v.capacity} guests. Activities: ${(v.activities ?? []).join(', ')}.`)
    .join('\n');

  return `=== RESORT OVERVIEW ===
Name: ${content.siteTitle}
Location: ${content.heroLocation}${content.address ? `\nAddress: ${content.address}` : ''}
Tagline: ${content.heroTitle} — ${content.heroSubtitle}

=== FEATURES & HIGHLIGHTS ===
${features}

=== ACTIVITIES ===
${activities}

=== ACCOMMODATIONS (VILLAS) ===
${villas || '  No villa information available currently.'}`;
}

export function getPackagesInfo(content: SiteContent, packageName?: string): string {
  let pkgs = content.packages;
  if (packageName) {
    const matched = pkgs.filter(p => p.name.toLowerCase().includes(packageName.toLowerCase()));
    if (matched.length > 0) pkgs = matched;
  }

  const packagesList = pkgs
    .map((p) => {
      const inclusions = (p.features ?? p.inclusions ?? []).join(', ');
      return `  - ${p.name}: ${p.price}${p.description ? ` — ${p.description}` : ''}${inclusions ? `. Inclusions: ${inclusions}` : ''}`;
    })
    .join('\n');

  return `=== PACKAGES & PRICING ===
${packagesList || '  No packages listed.'}`;
}

export function getPoliciesInfo(content: SiteContent): string {
  return `=== RESORT POLICIES ===
- Payment Options: Full payment or 50% downpayment (remaining balance due upon check-in).
- Check-in Time: 2:00 PM
- Check-out Time: 12:00 PM (noon)
- Pets Policy: Pets are allowed at the resort, but guests are responsible for cleaning up after them.
- Cancellation Policy: Inquire with our staff for rescheduling options.`;
}

export function getFAQsInfo(content: SiteContent): string {
  const faqs = content.faqs
    .map((f) => `  Q: ${f.question}\n  A: ${f.answer}`)
    .join('\n\n');

  return `=== FREQUENTLY ASKED QUESTIONS ===
${faqs || '  No FAQs listed.'}`;
}

export function getPaymentInfo(content: SiteContent): string {
  return `=== GCASH PAYMENT DETAILS ===
- GCash Number: ${content.gcashNumber || 'N/A'}
- Account Name: ${content.gcashName || 'N/A'}
- Payment is verified manually by the admin once proof of payment is uploaded.`;
}

export function getContactInfo(content: SiteContent): string {
  const socials = [
    content.facebookUrl ? `Facebook: ${content.facebookUrl}` : '',
    content.instagramUrl ? `Instagram: ${content.instagramUrl}` : '',
    content.tiktokUrl ? `TikTok: ${content.tiktokUrl}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return `=== CONTACT INFORMATION ===
Phone: ${content.phone}
Email: ${content.email}
${socials ? `Social media: ${socials}` : ''}`;
}

export function getBookingWorkflowInfo(): string {
  return `=== BOOKING VIA CHAT ===
If the guest wants to book or make a reservation:
1. Immediately call the showBookingForm tool to display the booking form card.
2. Instruct the user to fill out the form displayed in the chat.
3. Do NOT ask for their name, email, dates, package, phone, or guest count conversationally. The form will handle all detail collection and validation.

Important rules:
- NEVER ask the guest for check-in/out dates, guest name, email, or guest count yourself. Always use the showBookingForm tool.
- If the user asks about availability, call the showBookingForm tool so they can check it.
- After a booking is completed, the user will see GCash payment details and can upload their receipt directly through the card in the chat widget.
- The booking system requires the guest to enter their expected number of guests (pax), which is validated dynamically against the selected package's maximum guest capacity metadata.
- Package stay duration is driven entirely by metadata. For packages with a maximum stay of 1 day, the check-out date is automatically calculated (Check-in + 1 day). For multi-day packages (maximum stay > 1 day), the guest can choose a check-out date within the configured maximum stay duration limit.
- Do NOT reference specific package names when explaining these booking rules, as the package system is fully metadata-driven.`;
}

export function buildOptimizedPrompt(
  content: SiteContent,
  bookingState: any,
  conversationSummary: string,
  activeModules: string[]
): string {
  const modules: string[] = [];

  if (activeModules.includes('general')) modules.push(getGeneralInfo(content));
  if (activeModules.includes('packages')) modules.push(getPackagesInfo(content, bookingState?.package_name));
  if (activeModules.includes('policies')) modules.push(getPoliciesInfo(content));
  if (activeModules.includes('faqs')) modules.push(getFAQsInfo(content));
  if (activeModules.includes('payment')) modules.push(getPaymentInfo(content));
  if (activeModules.includes('contact')) modules.push(getContactInfo(content));
  if (activeModules.includes('booking')) modules.push(getBookingWorkflowInfo());

  const stateStr = bookingState && bookingState.booking_completed
    ? `=== COMPLETED BOOKING INFO ===
Booking Reference: ${bookingState.reference || 'N/A'}
Guest Name: ${bookingState.guest_name || 'N/A'}
Package: ${bookingState.package_name || 'N/A'}
Dates: ${bookingState.check_in || 'N/A'} to ${bookingState.check_out || 'N/A'}
Amount Due: ${bookingState.amount_due || 'N/A'}
Status: Pending (GCash payment required)`
    : '';

  const summaryStr = conversationSummary
    ? `=== CONVERSATION SUMMARY ===\n${conversationSummary}`
    : '';

  return `You are the friendly and professional guest assistant for Kamp Lambingan, a riverside glamping resort in ${content.heroLocation}.
Your ONLY purpose is to answer questions about the resort and assist with bookings. Refuse all off-topic questions politely.

${summaryStr}

${stateStr}

${modules.join('\n\n')}

=== CONVERSATIONAL GUIDELINES ===
- Be friendly, warm, and concise.
- Direct guests to check-in/out times and basic amenities if they ask.
- If they want to make a reservation, ALWAYS call the showBookingForm tool. Do NOT ask for details yourself.`;
}

// Fallback for compatibility
export function buildKnowledgeBase(content: SiteContent): string {
  return buildOptimizedPrompt(content, null, '', ['general', 'packages', 'policies', 'faqs', 'payment', 'contact', 'booking']);
}
