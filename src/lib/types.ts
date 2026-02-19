// Shared TypeScript types for Kamp Lambingan

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Activity {
  icon: string;
  title: string;
  description: string;
}

export interface Package {
  label?: string;
  name: string;
  price: string;
  description?: string;
  featured: boolean;
  features?: string[];
  inclusions?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Review {
  name: string;
  date: string;
  text: string;
  tags: string[];
  stars?: number;
}

export interface Villa {
  name: string;
  location: string;
  images: string[];
  capacity: number;
  activities: string[];
}

export interface SiteContent {
  siteTitle: string;
  tagline?: string;
  heroLocation: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  phone: string;
  email: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  threadsUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  footerTagline?: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: Feature[];
  activitiesTitle: string;
  activitiesSubtitle: string;
  activities: Activity[];
  packagesTitle: string;
  packagesSubtitle: string;
  packages: Package[];
  faqTitle: string;
  faqSubtitle: string;
  faqs: FaqItem[];
  reviews: Review[];
  villasTitle: string;
  villasSubtitle: string;
  villas: Villa[];
  socialLinksOrder?: string[];
  gallery: string[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  package_name: string;
  check_in: string;
  check_out: string;
  pax: number;
  notes: string | null;
  receipt_url: string | null;
  status: BookingStatus;
  reference: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  payment_type: 'full' | 'downpayment' | null;
  amount_due: string | null;
}
