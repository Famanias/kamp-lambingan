/**
 * Seed script — populates Supabase with default site content and a sample booking.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Prerequisites:
 *   - .env.local must have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - The site_content and bookings tables must already exist (run bookings-table.sql first)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local manually (no dotenv dependency needed) ───────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.split('=').map((p, i) => (i === 0 ? p.trim() : line.slice(line.indexOf('=') + 1).trim())))
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']; // optional but preferred for seeding

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

// Use service role key if available (bypasses RLS — better for seeding)
// Otherwise falls back to anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// ─── Default site content (mirrors src/lib/defaults.ts) ──────────────────────
const DEFAULT_CONTENT = {
  siteTitle: 'Kamp Lambingan',
  tagline: 'Your private riverside sanctuary. Escape the city noise and embrace the calming sounds of nature.',
  heroLocation: 'San Antonio, Philippines',
  heroTitle: 'Riverside Glamping Escape',
  heroSubtitle:
    'Reconnect with nature in our private AC villas. Experience serene river views, starry nights, and the luxury of doing absolutely nothing.',
  heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnj2QB_fyQTs7LqKB3R2SqfUJLaLTei7vxyj83yFBp_ozZ0yPzXx-ILsBq766xaoDjUfGFGhIBtMc5qop2MRcM4K_foZfDMdTE4WTFs1h8J5ljpowXavQqdhqVqeB95_Lh3GXS8ve-WjSjec8fKZ2aSy-zkdW8byUM2NZomYtEYkCkDRqLvMQ-SfI-kgLuEZwRjjwEyrP4lLV91OLGL4DzKiK_ezUc5MkXID8aW0NyRVM_0xHrgV552zd-uCtkQRY2fZ5AjlljktsJ',
  phone: '0939 594 5555',
  email: 'kamplambingan@gmail.com',
  address: 'San Antonio, Zambales, Philippines',
  featuresTitle: 'Not Your Typical Beach Trip',
  featuresSubtitle:
    'Kamp Lambingan offers a unique riverside experience — think tents, mountains, and forest instead of sand and saltwater.',
  features: [
    { icon: 'ac_unit', title: 'Air Conditioned Villas', description: 'Private, fully air-conditioned villas with double beds, clean linens, and shower facilities for a truly glamping experience.' },
    { icon: 'water_drop', title: 'Riverside Views', description: 'Wake up to the soothing sounds of the river. Enjoy meals or morning brunch along the waterway.' },
    { icon: 'local_fire_department', title: 'Bonfire Nights', description: 'Gather around the fireside under a canopy of stars. These moments create lifelong memories that last forever.' },
    { icon: 'diversity_1', title: 'Family Friendly', description: 'Kid-approved grounds perfect for families. Ride our bikes, cool down in the river, and discover the outdoors.' },
    { icon: 'landscape', title: 'Mountain Retreat', description: 'Experience our surrounding Zambales mountain range — a peaceful escape from the noise and pollution of city life.' },
    { icon: 'star_border', title: 'Stargazing', description: 'Far from city lights, we offer stunning views of the night sky — the Milky Way is a regular guest here.' },
  ],
  activitiesTitle: 'Nature at Your Doorstep',
  activitiesSubtitle: "From thrilling river adventures to peaceful riverside lounging — there's something for everyone.",
  activities: [
    { icon: 'pool', title: 'River Swimming & Fishing', description: 'Dive into the cool, crystal-clear river or throw a fishing line for a relaxing afternoon in nature.' },
    { icon: 'hot_tub', title: 'Guso Hot Baths', description: 'Soak in our traditional thermal-esque baths — uniquely rejuvenating and unforgettable.' },
    { icon: 'terrain', title: 'Mountain Hiking', description: 'Explore trails around a beautiful mountain range. Ideal for fit adventurers looking for raw exploration.' },
    { icon: 'waves', title: 'Freshwater Dipping Pool', description: 'Our fresh water pool is perfect for kids and adults who want to cool off from the tropical heat.' },
    { icon: 'deck', title: 'Lakeside Picnics', description: 'Set up a picnic along the banks, bring some snacks, and enjoy tranquil moments with your loved ones.' },
    { icon: 'outdoor_grill', title: 'Outdoor BBQ & Cooking', description: 'Bring your own provisions and use our BBQ stations for an authentic outdoor cooking experience.' },
  ],
  packagesTitle: 'Simple, Transparent Pricing',
  packagesSubtitle: 'All rates include river access, facilities, and parking. Message us for customized group packages.',
  packages: [
    {
      label: 'Best for Couple',
      name: 'Weekday Escape',
      price: '₱3,500',
      featured: false,
      features: ['Air conditioned room', 'River access & dipping pool', 'In-room amenities', 'Comprehensive concierge'],
    },
    {
      label: 'Most Popular',
      name: 'Weekend Glamping',
      price: '₱5,500',
      featured: true,
      features: ['Air conditioned room', 'All inclusive activities', 'Riverside BBQ & cooking area', 'Bonfire setup', 'Complimentary meals (x2)', 'Customized room coordinator'],
    },
    {
      label: 'Best for Groups',
      name: 'Group Retreat',
      price: '₱15,000',
      featured: false,
      features: ['2–3 days all connected', 'All inclusive activities', 'Private BBQ & cooking area', 'Guided tours', 'Bonfire setup', 'Dedicated room coordinator'],
    },
  ],
  faqTitle: 'Frequently Asked Questions',
  faqSubtitle: 'Everything you need to know before planning your escape.',
  faqs: [
    { question: 'What are your amenities?', answer: 'We offer private air-conditioned villas, a freshwater dipping pool, river access, bonfire area, outdoor BBQ stations, bike rentals, and free parking. All villas include linens, towels, and shower facilities.' },
    { question: 'Can we bring outside food?', answer: 'Yes! You are welcome to bring your own food and drinks. BBQ grills and cooking stations are available for your use on-site.' },
    { question: 'Pet friendly?', answer: 'Yes, we are pet friendly! Small to medium-sized dogs are welcome. Please keep them leashed in common areas and be responsible for cleaning up after them.' },
    { question: 'Do you accept day tour?', answer: 'Yes, we accept day tour guests subject to availability. Please message us in advance to check schedules and day tour rates.' },
    { question: 'Where are you located?', answer: 'We are in San Antonio, Zambales, Philippines — approximately 2 hours from Manila via NLEX → SCTEX. Drop a pin to "Kamp Lambingan" on Google Maps for precise directions.' },
    { question: 'How to get there?', answer: 'Via private car: Take NLEX → SCTEX → exit San Antonio, Zambales and follow Google Maps to Kamp Lambingan. Via commute: Take a bus bound for Olongapo or San Antonio at EDSA/Cubao, then hire a tricycle to our location.' },
  ],
  reviews: [
    { name: 'Rasvie Perez', date: '8h ago', text: 'Peaceful life away from the city. Highly recommended!', tags: ['Romantic atmosphere', 'Spacious rooms', 'Family-friendly', 'Good room service'] },
    { name: 'Michelle Mae', date: 'December 4, 2025', text: 'Very accommodating po ang staffs, makakapaglambingan talaga kayo kasi peaceful sa lugar, may magandang tanawin pa. 😍', tags: ['Family-friendly'] },
    { name: 'Krisha Mae Mose', date: 'July 3, 2025', text: 'We really enjoyed our overnight stay, sobrang peaceful at nakakarelax plus ang babait pa po nila at sobrang accommodating. Kahit umuulan naenjoy pa rin namin. We will surely come back next time yung hindi naman umuulan ☺️❤️', tags: [] },
    { name: 'Chichay Cortes Mendoza', date: 'August 21, 2025', text: "We've been here twice and for sure babalikbalikan pa rin namin 🥰 not just because of the good ambiance and the nice view, but also dahil sa mga staff na very accommodating and friendly 🥰", tags: ['Romantic atmosphere', 'Family-friendly', 'Quiet rooms', 'Good room service', 'Spacious rooms', 'Thoughtful amenities'] },
    { name: 'SJ Billones', date: 'July 18, 2025', text: 'Sobrang accommodating ng mga staff, peaceful yung lugar babalikan mo talaga ☺️❤️', tags: ['Family-friendly'] },
    { name: 'Chyna Bacolor', date: 'April 15, 2025', text: 'The staff during our stay was incredibly friendly and ensured we were comfortable and had everything we needed. The place was clean, and the overall vibe of the villa was very nice. As a fur parent of two, I especially appreciated that we could bring our pets with us. Will comeback soon. 🫶🏻', tags: [] },
  ],
  gallery: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAXNQaGLYREOz3acnRrhy1AuetxU-alp4OXCvL8323A5Q2OUEuDgj4hJR8JJQYZgPcA_aqPIAQTtBBHBDzlulRTSDHR99L2F8_NysdtZZclFzbAfMOXM2iSGGAYedSzpQO_p66qFiaFyLK8yX3UndElBwEcRaZzZYaEpKEbNVnmapSTXd8wzDVA-bxvRBMTAuQs_GD3rwzu8xlgAvI4hOkC00MPj-0W52nz87JyMkaWkeL0rET0E7pHJrqnUrMMLm4eOyX-ni5GkBwR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBa0SwVECRZViydbOUe3cVh01mGR2ms8uirzkA6ZhMdvbKEqi_uIMM5v4wfAfB4ihioZfbMXr84DxFSz8iZ4C0USBZM23ttvjFufki1R74C52ePAkE3BW5eg7HjQglT1kVsICvdLOQQKEULojUfAEtHM6st3l7GWFgmu7_EfTqIJ9G0MXlTQKNdBSF7CyHe0BWYb8E_8LqqB1Vg-WCuqN__3b4KjOcgvHfoiogKNsL4F5FGkLE_J6rBzafLxbXvKS8BjbnGICcvwVBM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDNWpRUAbqJ5_r1OgTnnhTZKRwEJ9Qqsj0KD-lLwhkvC2Nrq1Dt35UX2LPPw2tvLCJiYZMwjrFiuZ3Rox7vmmkjYnayK6SznIxiu-NPmPnJB7TW_4-fBRjDciFz3YP2UXNFGrxJcu5nD2BFh4JxBhM68tCYugu4iCY1bKddlIbegYgUXHKeAaO7fjhtCv4otHanvfd-p1oAJKvdrVkg6wpeVHTgGGuTPASjKeo0aE1pQgIza6fBKO0mRuntzXwqhtWdEcyhT58Y1xUG',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCDH4cSgHM9wrqQYP2JfY6UpGDkdNXh6V9JvNvj3cRQwr9BvV_Cj5-sBTsEPCGQR2m43Z0b7k9lyj0MHrhWR04yyDy0N-Z2SN1iqPwQlU-DX5WxRAehr7GHV42J-lkBk6Jj-BzfxuvFnhFIwgQ_gyjx8G6YuRk1gmUBSDUHAwLg0uSePQTQITSjV4Uk6GfMO_YihYIzEuhtqP_O8gc_aSWVIeDlPNzVI7TP-Mi0J8kuCgNvhNr7lNMj3rP20zOSdYEdzH2KCSNSxv3G',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuArAI9r0bJRMPgpjYHhtYwtjicWCG0mrhI56PQfkm3fBPOp4Bsyegl2acMsQHx4fBPmXWMUBOSIzuz7QtFJAinVYcAcsW7youDG48kYCU1WoZvRWSS6Mb6B8O2LS76qkOV-3U9jZ6ekgxiGjMHIpvui7vrlVYwNF5Ry4EQR5xd2FzRE1w2LHDsp7Q-2J5NHKKCARdXoXsqCbzbLMKRFD8Hja9OB8RjJbL4i6djAMWcs_o20hypbjvdRmjUuvpUNgdf2b46Ffk7jyK-4',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBekNEnrmCCAtcBwWSaD4X-oRHLV3NT8dRbFBmSk9BfzCLpXEbHwQylkVAkLdwLOyhnEnj4ZTiZxC4aacoE5S9UqkyBJyHz1fXE998sDrTs6iCO_iyyDsTUOWINgDGPsG58978B8BFYh8lAtnzoBFZXkUoJl8AEDvaTelr31kAd77910lN_QTi-UEGqngWE_9unmHfHAO5yj2V7lI8yQDMpEKbGlUn8_BSao4k_-QyM-cOtxY2116EPjMOm7KmoQ2gQxekoi0OUqD9x',
  ],
};

// ─── Sample bookings for testing ─────────────────────────────────────────────
const SAMPLE_BOOKINGS = [
  {
    guest_name: 'Juan dela Cruz',
    guest_email: 'juan@example.com',
    guest_phone: '09171234567',
    package_name: 'Weekend Glamping',
    check_in: '2026-03-15',
    check_out: '2026-03-17',
    pax: 2,
    notes: 'Anniversary celebration — surprise setup if possible!',
    status: 'confirmed',
  },
  {
    guest_name: 'Maria Santos',
    guest_email: 'maria@example.com',
    guest_phone: '09189876543',
    package_name: 'Group Retreat',
    check_in: '2026-03-22',
    check_out: '2026-03-24',
    pax: 10,
    notes: 'Team building event. Need extra tables.',
    status: 'pending',
  },
  {
    guest_name: 'Rico Reyes',
    guest_email: 'rico@example.com',
    guest_phone: '09205551234',
    package_name: 'Weekday Escape',
    check_in: '2026-04-01',
    check_out: '2026-04-02',
    pax: 2,
    notes: null,
    status: 'pending',
  },
];

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedSiteContent() {
  console.log('\n📄 Seeding site_content...');

  const { error } = await supabase
    .from('site_content')
    .upsert({ id: 1, data: DEFAULT_CONTENT }, { onConflict: 'id' });

  if (error) {
    console.error('   ❌ Failed:', error.message);
    return false;
  }

  console.log('   ✅ site_content seeded (id = 1)');
  return true;
}

async function seedBookings() {
  console.log('\n📋 Seeding sample bookings...');

  const { data, error } = await supabase
    .from('bookings')
    .insert(SAMPLE_BOOKINGS)
    .select('id, guest_name, status');

  if (error) {
    console.error('   ❌ Failed:', error.message);
    return false;
  }

  data.forEach((b) => {
    console.log(`   ✅ Booking created: ${b.guest_name} (${b.status}) — id: ${b.id}`);
  });

  return true;
}

async function clearBookings() {
  console.log('\n🗑️  Clearing existing bookings...');
  const { error } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error('   ❌ Failed to clear:', error.message);
    return false;
  }
  console.log('   ✅ All bookings cleared');
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const reset = args.includes('--reset'); // pass --reset to wipe bookings first

async function main() {
  console.log('🌱 Kamp Lambingan — Supabase Seed Script');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Key: ${SUPABASE_SERVICE_KEY ? 'service_role (full access)' : 'anon (limited)'}`);

  await seedSiteContent();

  if (reset) {
    await clearBookings();
  }

  await seedBookings();

  console.log('\n✨ Done! Your Supabase database is seeded.');
  console.log('   Run: npm run dev — then visit http://localhost:3000\n');
}

main().catch((err) => {
  console.error('\n💥 Seed script failed:', err);
  process.exit(1);
});
