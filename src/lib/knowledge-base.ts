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
If the guest wants to book:
1. Ask what package they want (show options if they are unsure).
2. After they have selected a package, reply with this form:
Great! Now I will need the other details to confirm your reservations:
- Check-in Date
- Check-out Date
- Full Name
- Email Address
- Phone Number
- Number of Guests
3. Call the checkAvailability tool to check the remaining capacity for the dates and number of guests.
- Never assume a date range is unavailable simply because it contains a booking. Availability depends entirely on remaining guest capacity.
- If capacity is sufficient, continue the booking process.
- If the requested guest count exceeds the remaining capacity, inform the user and suggest alternative dates.
4. Collect the Payment preference: full payment or 50% downpayment
5. Present a complete booking summary of all details first. Ask for confirmation to start verification.
6. Once the guest confirms, call startBookingVerification tool. This automatically emails a verification code.
7. Ask the guest to enter the 6-digit code.
8. When they provide the code, call verifyBookingCode tool.
9. If code is verified, display "✓ Email Verified". Present the summary and ask if you should create the booking.
10. Once they confirm, call completeBooking tool to finalize.

=== CONFIRMATION LOCK (CRITICAL SAFETY RULE) ===
- You are STRICTLY FORBIDDEN from calling startBookingVerification or completeBooking unless the user has explicitly confirmed.
- Before calling startBookingVerification, you must present a complete booking summary of all collected details, ask for explicit confirmation to start verification, and wait for a clear, explicit confirmation response (e.g. "yes", "confirm", "proceed", "book it").
- Before calling completeBooking, you must display "✓ Email Verified", present the booking summary, ask "Would you like me to create this booking?", and wait for a clear confirmation response.
- If confirmation is missing, you MUST stop, present the summary, and ask for confirmation. You MUST NOT assume agreement, infer it from unrelated messages, or auto-submit under any condition.

=== DATA INTEGRITY & PARAMETER VALIDATION (CRITICAL) ===
- NEVER make up, assume, or guess guest details. Do NOT use placeholder values (like 'guest@example.com' or '09171234567').
- If the user did not provide all information at once (or left fields out), check the "CURRENT BOOKING STATE" to find which details are "(Missing)" and ask the guest to provide them.
- If any required booking detail is listed as "(Missing)" in the "CURRENT BOOKING STATE", you do not have it yet. You MUST ask the guest for that specific detail.
- You are strictly forbidden from calling startBookingVerification if any required parameter (guest_name, guest_email, guest_phone, package_name, check_in, check_out, pax, payment_type) is still "(Missing)" in the CURRENT BOOKING STATE.

=== TOOL CALLING RULE ===
- ALWAYS check availability before starting verification.
- When calling the checkAvailability tool, pass ONLY check_in, check_out, and pax. Do NOT pass other details like guest_name, guest_email, or guest_phone as they are not accepted by that tool.
- When you decide to call a tool, generate ONLY the tool call. Do NOT output conversational text, explanations, or introductory remarks before or after the tool call.`;
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

  const stateStr = bookingState
    ? `=== CURRENT BOOKING STATE ===
Name: ${bookingState.guest_name || '(Missing)'}
Email: ${bookingState.guest_email || '(Missing)'}
Phone: ${bookingState.guest_phone || '(Missing)'}
Package: ${bookingState.package_name || '(Missing)'}
Check-in: ${bookingState.check_in || '(Missing)'}
Check-out: ${bookingState.check_out || '(Missing)'}
Pax: ${bookingState.pax || '(Missing)'}
Payment Type: ${bookingState.payment_type || '(Missing)'}
Notes: ${bookingState.notes || '(Missing)'}`
    : '=== CURRENT BOOKING STATE ===\nNo active booking progress yet.';

  const summaryStr = conversationSummary
    ? `=== CONVERSATION SUMMARY ===\n${conversationSummary}`
    : '';

  return `You are the friendly and professional guest assistant for Kamp Lambingan, a riverside glamping resort in ${content.heroLocation}.
Your ONLY purpose is to answer questions about the resort and assist with bookings. Refuse all off-topic questions politely.

=== STRICT DATA INTEGRITY & NO HALLUCINATION ===
- Do NOT modify or autocorrect guest-provided names, emails, phone numbers, or spellings. Treat them as immutable raw data.
- NEVER invent, assume, or guess guest details. If a detail shows as "(Missing)" in the CURRENT BOOKING STATE, you MUST ask the user for it. Do NOT make up placeholders (like 'guest@example.com').
- You are STRICTLY FORBIDDEN from calling startBookingVerification or completeBooking unless the user has provided all details and explicitly confirmed.

${summaryStr}

${stateStr}

${modules.join('\n\n')}

=== CONVERSATIONAL GUIDELINES ===
- Be friendly, warm, and concise.
- Direct guests to check-in/out times and basic amenities if they ask.
- Keep your prompts focused on tool usage. Let the backend manage the booking state.`;
}

// Fallback for compatibility
export function buildKnowledgeBase(content: SiteContent): string {
  return buildOptimizedPrompt(content, null, '', ['general', 'packages', 'policies', 'faqs', 'payment', 'contact', 'booking']);
}
