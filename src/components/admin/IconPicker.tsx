'use client';

import { useState, useRef, useEffect } from 'react';

const ICON_OPTIONS_RAW = [
  // ── Nature / Outdoors ─────────────────────────────────────────────────
  'forest', 'park', 'landscape', 'terrain', 'water', 'waves', 'fireplace', 'hiking', 'nordic_walking',
  'kayaking', 'rowing', 'pool', 'beach_access', 'grass', 'eco', 'energy_savings_leaf', 'wb_sunny', 'nights_stay', 'cloud',
  'nature', 'emoji_nature', 'local_florist', 'yard', 'deck', 'filter_hdr', 'nature_people', 'wb_twilight', 'bedtime',
  'storm', 'thunderstorm', 'foggy', 'air', 'tsunami', 'sunny', 'brightness_5', 'brightness_6', 'brightness_7',
  'flare', 'wb_cloudy','ac_unit','local_fire_department', 'water_drop',

  // ── Beach / Coastal ───────────────────────────────────────────────────
  'umbrella', 'water_drop', 'anchor', 'directions_boat', 'sailing',
  'surfing', 'scuba_diving', 'kitesurfing', 'hot_tub', 'chair_alt',

  // ── Accommodation / Facilities ────────────────────────────────────────
  'hotel', 'cottage', 'cabin', 'villa', 'bungalow', 'houseboat', 'house',
  'king_bed', 'single_bed', 'bathtub', 'shower', 'wc', 'kitchen', 'outdoor_grill',
  'restaurant', 'local_cafe', 'local_bar', 'dinner_dining',

  // ── Activities / Sports ───────────────────────────────────────────────
  'sports', 'sports_volleyball', 'sports_basketball', 'sports_soccer', 'sports_tennis', 'fitness_center',
  'directions_bike', 'directions_run', 'directions_walk', 'skateboarding', 'downhill_skiing',

  // ── Amenities ─────────────────────────────────────────────────────────
  'local_parking', 'wifi', 'power', 'electrical_services', 'cleaning_services',

  // ── People / Experience ───────────────────────────────────────────────
  'family_restroom', 'groups', 'child_care', 'pets', 'accessibility',
  'celebration', 'cake', 'party_mode', 'festival', 'nightlife', 'diversity_1',

  // ── General / Misc ────────────────────────────────────────────────────
  'star', 'star_border', 'favorite', 'thumb_up', 'emoji_events', 'workspace_premium',
  'security', 'verified', 'shield', 'lock', 'check_circle', 'done_all',
  'photo_camera', 'videocam', 'music_note', 'headset',
  'location_on', 'map', 'explore', 'near_me', 'directions',
  'schedule', 'access_time', 'calendar_today', 'event',
  'info', 'help', 'tips_and_updates', 'lightbulb',
  'phone', 'email', 'chat', 'support_agent',
  'local_offer', 'sell', 'payment', 'credit_card', 'savings',
  'assignment', 'description', 'receipt_long', 'inventory',
  'spa', 'self_improvement', 'sentiment_very_satisfied', 'mood',
];

// Deduplicate to guarantee unique keys
const ICON_OPTIONS = [...new Set(ICON_OPTIONS_RAW)];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? ICON_OPTIONS.filter((ic) => ic.includes(search.toLowerCase().replace(/\s+/g, '_')))
    : ICON_OPTIONS;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      >
        <span className="material-icons text-primary text-base">{value || 'star'}</span>
        <span className="flex-1 text-left text-gray-700">{value || 'star'}</span>
        <span className="material-icons text-gray-400 text-sm">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Grid */}
          <div className="p-2 grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="col-span-6 text-center text-xs text-gray-400 py-4">No icons found</p>
            )}
            {filtered.map((ic) => (
              <button
                key={ic}
                type="button"
                title={ic}
                onClick={() => { onChange(ic); setOpen(false); setSearch(''); }}
                className={`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg hover:bg-primary/10 transition-colors group ${
                  value === ic ? 'bg-primary/10 ring-1 ring-primary' : ''
                }`}
              >
                <span className={`material-icons text-xl ${value === ic ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}>
                  {ic}
                </span>
              </button>
            ))}
          </div>

          {/* Current selection */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <span className="material-icons text-primary text-base">{value || 'star'}</span>
            <span className="text-xs text-gray-500 font-mono">{value || 'star'}</span>
          </div>
        </div>
      )}
    </div>
  );
}