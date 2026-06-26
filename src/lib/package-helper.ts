import { Package } from './types';

export interface ExtendedPackage extends Package {
  capacity: number;
  allowsMultiDay: boolean;
}

/**
 * Returns the package configuration with capacity and allowsMultiDay metadata.
 * If the database record does not contain these metadata fields, they are inferred.
 */
export function getSelectedPackage(packageName: string | null | undefined, packages: Package[]): ExtendedPackage | null {
  if (!packageName || !Array.isArray(packages)) return null;
  
  const pkg = packages.find(p => p.name === packageName);
  if (!pkg) return null;

  // 1. Get capacity (explicit or inferred from description/name)
  let capacity = (pkg as any).capacity;
  if (typeof capacity !== 'number') {
    const desc = (pkg.description || '').toLowerCase();
    const match = desc.match(/up to (\d+)\s*pax/i);
    if (match) {
      capacity = parseInt(match[1], 10) || 2;
    } else if (pkg.name.toLowerCase().includes('couple') || (pkg.label || '').toLowerCase().includes('couple')) {
      capacity = 2;
    } else if (pkg.name.toLowerCase().includes('day tour')) {
      capacity = 30;
    } else if (pkg.name.toLowerCase().includes('hall') || pkg.name.toLowerCase().includes('pool party')) {
      capacity = 100;
    } else {
      capacity = 20; // default safe fallback
    }
  }

  // 2. Get allowsMultiDay (explicit or inferred from name/description)
  let allowsMultiDay = (pkg as any).allowsMultiDay;
  if (typeof allowsMultiDay !== 'boolean') {
    const nameLower = pkg.name.toLowerCase();
    const descLower = (pkg.description || '').toLowerCase();
    const featuresLower = (pkg.features || []).join(' ').toLowerCase();
    
    // Multi-day stays are supported for Exclusive Overnight packages
    allowsMultiDay = nameLower.includes('overnight') || 
                     descLower.includes('2-3 days') || 
                     descLower.includes('2–3 days') ||
                     featuresLower.includes('2-3 days') ||
                     featuresLower.includes('2–3 days');
  }

  return {
    ...pkg,
    capacity,
    allowsMultiDay,
  };
}

/**
 * Calculates local timezone-safe check_in + 1 day in YYYY-MM-DD format.
 */
export function getNextDayString(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats YYYY-MM-DD date to a human readable format.
 */
export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
