'use client';

import { useState, useRef } from 'react';
import { saveContent, uploadImage } from '@/actions/content';
import { SiteContent, Feature, Activity, Package, FaqItem, Review, Villa } from '@/lib/types';
import IconPicker from './IconPicker';
import ImageInput from './ImageInput';

interface ContentEditorProps {
  initialContent: SiteContent;
}

type Section = 'hero' | 'contact' | 'features' | 'activities' | 'packages' | 'villas' | 'reviews' | 'faq' | 'gallery' | 'payment' | 'footer';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'auto_awesome' },
  { key: 'contact', label: 'Contact', icon: 'contact_phone' },
  { key: 'features', label: 'Features', icon: 'star' },
  { key: 'activities', label: 'Activities', icon: 'hiking' },
  { key: 'packages', label: 'Packages', icon: 'inventory' },
  { key: 'villas', label: 'Villas', icon: 'villa' },
  { key: 'reviews', label: 'Reviews', icon: 'rate_review' },
  { key: 'faq', label: 'FAQ', icon: 'help' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  { key: 'payment', label: 'Payment', icon: 'qr_code_2' },
  { key: 'footer', label: 'Footer', icon: 'web' },
];

const SOCIAL_PLATFORMS: { key: string; label: string; field: keyof SiteContent; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', field: 'facebookUrl', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', field: 'instagramUrl', placeholder: 'https://www.instagram.com/yourpage' },
  { key: 'tiktok', label: 'TikTok', field: 'tiktokUrl', placeholder: 'https://www.tiktok.com/@yourpage' },
  { key: 'threads', label: 'Threads', field: 'threadsUrl', placeholder: 'https://www.threads.net/@yourpage' },
  { key: 'youtube', label: 'YouTube', field: 'youtubeUrl', placeholder: 'https://www.youtube.com/@yourchannel' },
  { key: 'twitter', label: 'Twitter / X', field: 'twitterUrl', placeholder: 'https://twitter.com/yourpage' },
];

export default function ContentEditor({ initialContent }: ContentEditorProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [reviewDateDir, setReviewDateDir] = useState<'asc' | 'desc'>('desc');
  const [reviewStarsDir, setReviewStarsDir] = useState<'asc' | 'desc'>('desc');
  const dragSrc = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    const result = await saveContent(content);
    setSaving(false);
    if (result.error) {
      setSaveMsg('Error: ' + result.error);
    } else {
      setSaveMsg('Saved successfully!');
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const updateField = (key: keyof SiteContent, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  };

  const onDragStart = (i: number) => { dragSrc.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const onDragEnd = () => { dragSrc.current = null; setDragOverIdx(null); };
  const onDrop = <T,>(arr: T[], field: keyof SiteContent, i: number) => {
    if (dragSrc.current !== null && dragSrc.current !== i) updateField(field, reorder(arr, dragSrc.current, i));
    dragSrc.current = null;
    setDragOverIdx(null);
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Section nav */}
      <aside className="w-44 flex-shrink-0 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left border-b border-gray-50 last:border-0 transition-colors ${
                activeSection === s.key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="material-icons text-sm">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Editor panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden gap-3">
        {/* Sticky header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-900 capitalize">{activeSection}</h3>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Scrollable content + sticky add button */}
        <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm flex flex-col">
          <div className="flex-1 overflow-y-auto p-5">

          {activeSection === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Site Title</label>
                <input className={inputClass} value={content.siteTitle || ''} onChange={(e) => updateField('siteTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input className={inputClass} value={content.tagline || ''} onChange={(e) => updateField('tagline', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Hero Title</label>
                <input className={inputClass} value={content.heroTitle || ''} onChange={(e) => updateField('heroTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Hero Subtitle</label>
                <textarea className={inputClass} rows={3} value={content.heroSubtitle || ''} onChange={(e) => updateField('heroSubtitle', e.target.value)} />
              </div>
              <div>
                <ImageInput
                  label="Hero Image"
                  value={content.heroImage || ''}
                  onChange={(url) => updateField('heroImage', url)}
                />
              </div>
              <div>
                <label className={labelClass}>Hero Background (video or image URL)</label>
                <input className={inputClass} value={content.heroBackground || ''} onChange={(e) => updateField('heroBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
                <p className="text-xs text-gray-400 mt-1">Overrides Hero Image when set. Supports HLS (.m3u8), MP4, or any image URL.</p>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={content.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={content.email || ''} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input className={inputClass} value={content.address || ''} onChange={(e) => updateField('address', e.target.value)} />
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.featuresBackground || ''} onChange={(e) => updateField('featuresBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              {content.features.map((f: Feature, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.features, 'features', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-4 space-y-3 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Feature {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('features', content.features.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Icon</label>
                      <IconPicker value={f.icon} onChange={(icon) => updateField('features', content.features.map((item, idx) => idx === i ? { ...item, icon } : item))} />
                    </div>
                    <div>
                      <label className={labelClass}>Title</label>
                      <input className={inputClass} value={f.title} onChange={(e) => updateField('features', content.features.map((item, idx) => idx === i ? { ...item, title: e.target.value } : item))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea className={inputClass} rows={2} value={f.description} onChange={(e) => updateField('features', content.features.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'activities' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.activitiesBackground || ''} onChange={(e) => updateField('activitiesBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              {content.activities.map((a: Activity, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.activities, 'activities', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-4 space-y-3 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Activity {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('activities', content.activities.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Icon</label>
                      <IconPicker value={a.icon} onChange={(icon) => updateField('activities', content.activities.map((item, idx) => idx === i ? { ...item, icon } : item))} />
                    </div>
                    <div>
                      <label className={labelClass}>Title</label>
                      <input className={inputClass} value={a.title} onChange={(e) => updateField('activities', content.activities.map((item, idx) => idx === i ? { ...item, title: e.target.value } : item))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea className={inputClass} rows={2} value={a.description} onChange={(e) => updateField('activities', content.activities.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'packages' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.packagesBackground || ''} onChange={(e) => updateField('packagesBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              {content.packages.map((p: Package, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.packages, 'packages', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${dragOverIdx === i ? 'border-primary ring-2 ring-primary/20' : p.featured ? 'border-primary' : 'border-gray-200'}`}
                >
                  {/* Card header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${p.featured ? 'bg-primary/10' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className={`material-icons text-base ${p.featured ? 'text-primary' : 'text-gray-400'}`}>inventory_2</span>
                      <span className="font-semibold text-sm text-gray-800">{p.name || `Package ${i + 1}`}</span>
                      {p.featured && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Featured</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">{p.price || '—'}</span>
                      <button
                        onClick={() => updateField('packages', content.packages.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Remove package"
                      >
                        <span className="material-icons text-base">delete_outline</span>
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Package Name</label>
                        <input className={inputClass} value={p.name} onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} />
                      </div>
                      <div>
                        <label className={labelClass}>Price</label>
                        <input className={inputClass} value={p.price} onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, price: e.target.value } : item))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Category Label <span className="text-gray-400 font-normal normal-case">(shown on all cards)</span></label>
                        <input className={inputClass} value={p.label ?? ''} placeholder="e.g. Best Weekend" onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, label: e.target.value } : item))} />
                      </div>
                      <div>
                        <label className={`${labelClass} ${!p.featured ? 'opacity-40' : ''}`}>Featured Badge <span className="text-gray-400 font-normal normal-case">(pill badge on featured card only)</span></label>
                        <input className={`${inputClass} ${!p.featured ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`} value={p.sublabel ?? ''} placeholder="e.g. Most Popular" disabled={!p.featured} onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, sublabel: e.target.value } : item))} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea className={inputClass} rows={2} value={p.description} onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} />
                    </div>
                    <div>
                      <label className={labelClass}>Inclusions (one per line)</label>
                      <textarea
                        className={inputClass}
                        rows={4}
                        value={(p.features ?? p.inclusions ?? []).join('\n')}
                        onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, features: e.target.value.split('\n').filter(Boolean) } : item))}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={p.featured || false}
                        onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, featured: e.target.checked } : item))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-xs text-gray-600 font-medium">Mark as Featured</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'villas' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.villasBackground || ''} onChange={(e) => updateField('villasBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Section Title</label>
                  <input className={inputClass} value={content.villasTitle ?? ''} onChange={(e) => updateField('villasTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Section Subtitle</label>
                  <input className={inputClass} value={content.villasSubtitle ?? ''} onChange={(e) => updateField('villasSubtitle', e.target.value)} />
                </div>
              </div>
              {(content.villas ?? []).map((v: Villa, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.villas ?? [], 'villas', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-4 space-y-3 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Villa {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('villas', (content.villas ?? []).filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Villa Name</label>
                      <input className={inputClass} value={v.name} onChange={(e) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input className={inputClass} value={v.location} onChange={(e) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, location: e.target.value } : item))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Capacity (number of guests)</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={v.capacity}
                      onChange={(e) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, capacity: Number(e.target.value) } : item))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>What's Included? (comma-separated)</label>
                    <input
                      className={inputClass}
                      value={(v.activities ?? []).join(', ')}
                      onChange={(e) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, activities: e.target.value.split(',').map((t) => t.trim()) } : item))}
                      onBlur={(e) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, activities: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : item))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Photos</label>
                    <div className="space-y-2">
                      {(v.images ?? []).map((img: string, imgIdx: number) => (
                        <div key={imgIdx} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <ImageInput
                              value={img}
                              onChange={(newUrl) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, images: (item.images ?? []).map((im, ii) => ii === imgIdx ? newUrl : im) } : item))}
                              previewClass="mt-1 h-24 w-full rounded object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, images: (item.images ?? []).filter((_, ii) => ii !== imgIdx) } : item))}
                            className="mt-2 text-red-400 hover:text-red-600"
                          >
                            <span className="material-icons text-sm">close</span>
                          </button>
                        </div>
                      ))}
                      <ImageInput
                        value=""
                        onChange={(url) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, images: [...(item.images ?? []), url] } : item))}
                        onMultiple={(urls) => updateField('villas', (content.villas ?? []).map((item, idx) => idx === i ? { ...item, images: [...(item.images ?? []), ...urls] } : item))}
                        label="Add Photos (select multiple to batch upload)"
                        previewClass="hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'reviews' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.reviewsBackground || ''} onChange={(e) => updateField('reviewsBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <span className="text-xs text-gray-500 font-medium">Sort by:</span>
                <button
                  onClick={() => {
                    const next = reviewDateDir === 'desc' ? 'asc' : 'desc';
                    setReviewDateDir(next);
                    updateField('reviews', [...content.reviews].sort((a, b) => {
                      const da = a.date ? new Date(a.date).getTime() : 0;
                      const db = b.date ? new Date(b.date).getTime() : 0;
                      return next === 'desc' ? db - da : da - db;
                    }));
                  }}
                  className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors"
                >
                  <span className="material-icons" style={{ fontSize: 13 }}>calendar_today</span>
                  Date
                  <span className="material-icons" style={{ fontSize: 13 }}>{reviewDateDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>
                </button>
                <button
                  onClick={() => {
                    const next = reviewStarsDir === 'desc' ? 'asc' : 'desc';
                    setReviewStarsDir(next);
                    updateField('reviews', [...content.reviews].sort((a, b) =>
                      next === 'desc' ? (b.stars ?? 0) - (a.stars ?? 0) : (a.stars ?? 0) - (b.stars ?? 0)
                    ));
                  }}
                  className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors"
                >
                  <span className="material-icons" style={{ fontSize: 13 }}>star</span>
                  Stars
                  <span className="material-icons" style={{ fontSize: 13 }}>{reviewStarsDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>
                </button>
              </div>
              {content.reviews.map((r: Review, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.reviews, 'reviews', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-4 space-y-3 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Review {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('reviews', content.reviews.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input className={inputClass} value={r.name} onChange={(e) => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input className={inputClass} value={r.date || ''} onChange={(e) => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, date: e.target.value } : item))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Stars</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, stars: star } : item))}
                          className={`text-2xl leading-none transition-colors ${star <= (r.stars ?? 0) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                        >
                          ★
                        </button>
                      ))}
                      {(r.stars ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, stars: 0 } : item))}
                          className="text-xs text-gray-400 hover:text-gray-600 ml-1 self-center"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Review Text</label>
                    <textarea className={inputClass} rows={3} value={r.text} onChange={(e) => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, text: e.target.value } : item))} />
                  </div>
                  <div>
                    <label className={labelClass}>Tags (comma-separated)</label>
                    <input
                      className={inputClass}
                      value={(r.tags ?? []).join(', ')}
                      onChange={(e) => updateField('reviews', content.reviews.map((item, idx) => idx === i ? { ...item, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : item))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.faqBackground || ''} onChange={(e) => updateField('faqBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              {content.faqs.map((f: FaqItem, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.faqs, 'faqs', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-4 space-y-3 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">FAQ {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('faqs', content.faqs.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Question</label>
                    <input className={inputClass} value={f.question} onChange={(e) => updateField('faqs', content.faqs.map((item, idx) => idx === i ? { ...item, question: e.target.value } : item))} />
                  </div>
                  <div>
                    <label className={labelClass}>Answer</label>
                    <textarea className={inputClass} rows={3} value={f.answer} onChange={(e) => updateField('faqs', content.faqs.map((item, idx) => idx === i ? { ...item, answer: e.target.value } : item))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'footer' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Footer Background (video or image URL)</label>
                <input className={inputClass} value={content.footerBackground || ''} onChange={(e) => updateField('footerBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              <div>
                <label className={labelClass}>Book Section Background (video or image URL)</label>
                <input className={inputClass} value={content.bookBackground || ''} onChange={(e) => updateField('bookBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              <div>
                <label className={labelClass}>Footer Tagline</label>
                <textarea className={inputClass} rows={2} value={content.footerTagline || ''} onChange={(e) => updateField('footerTagline', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Short description shown under the logo in the footer.</p>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Social Media Links</p>
              <p className="text-xs text-gray-400 -mt-2">Drag to reorder. Leave any field blank to hide that icon in the footer.</p>
              <div className="space-y-2">
                {(content.socialLinksOrder ?? SOCIAL_PLATFORMS.map((p) => p.key))
                  .map((key) => SOCIAL_PLATFORMS.find((p) => p.key === key)!)
                  .filter(Boolean)
                  .map((platform, i) => (
                    <div
                      key={platform.key}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={(e) => onDragOver(e, i)}
                      onDrop={() => {
                        if (dragSrc.current !== null && dragSrc.current !== i) {
                          const order = content.socialLinksOrder ?? SOCIAL_PLATFORMS.map((p) => p.key);
                          updateField('socialLinksOrder', reorder(order, dragSrc.current, i));
                        }
                        dragSrc.current = null;
                        setDragOverIdx(null);
                      }}
                      onDragEnd={onDragEnd}
                      className={`flex items-center gap-2 border rounded-lg p-3 transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
                    >
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base flex-shrink-0">drag_indicator</span>
                      <div className="flex-1">
                        <label className={labelClass}>{platform.label} URL</label>
                        <input
                          className={inputClass}
                          type="url"
                          placeholder={platform.placeholder}
                          value={(content[platform.field] as string) || ''}
                          onChange={(e) => updateField(platform.field, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-2">Also displayed in the footer (edit in other sections):</p>
                <p>• <strong>Site Title</strong> — Hero section</p>
                <p>• <strong>Phone &amp; Email</strong> — Contact section</p>
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Configure GCash payment options. Guests can either scan the QR code or enter the GCash details manually.
                </p>
              </div>

              {/* QR Code Section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">GCash QR Code</h4>
                <p className="text-xs text-gray-500">Upload your GCash QR code. Guests can scan this to pay directly.</p>
                <ImageInput
                  label="QR Code Image"
                  value={content.gcashQrImage ?? ''}
                  onChange={(url) => updateField('gcashQrImage', url)}
                  previewClass="mt-2 h-48 w-48 mx-auto rounded object-contain border border-gray-200 p-2"
                />
                {content.gcashQrImage && (
                  <button
                    type="button"
                    onClick={() => updateField('gcashQrImage', '')}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <span className="material-icons text-sm">delete_outline</span>
                    Remove QR image
                  </button>
                )}
              </div>

              {/* Manual Entry Section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">Alternative GCash Details</h4>
                <p className="text-xs text-gray-500">Provide GCash number and account holder name for guests who cannot scan the QR code.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>GCash Number <span className="text-gray-400 font-normal">(e.g. 09123456789)</span></label>
                    <input
                      className={inputClass}
                      placeholder="09123456789"
                      value={content.gcashNumber ?? ''}
                      onChange={(e) => updateField('gcashNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Account Holder Name</label>
                    <input
                      className={inputClass}
                      placeholder="Juan Dela Cruz"
                      value={content.gcashName ?? ''}
                      onChange={(e) => updateField('gcashName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'gallery' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Section Background (video or image URL)</label>
                <input className={inputClass} value={content.galleryBackground || ''} onChange={(e) => updateField('galleryBackground', e.target.value)} placeholder="https://... (.m3u8, .mp4, or image URL)" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Paste a URL or upload an image. All images are displayed in the gallery.</p>
                <button
                  type="button"
                  disabled={galleryUploading}
                  onClick={() => galleryFileRef.current?.click()}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-medium text-primary disabled:opacity-50 transition-colors"
                >
                  <span className="material-icons text-base">{galleryUploading ? 'hourglass_empty' : 'upload'}</span>
                  {galleryUploading && galleryUploadProgress ? `Uploading ${galleryUploadProgress.done}/${galleryUploadProgress.total}…` : 'Upload Images'}
                </button>
                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    setGalleryUploading(true);
                    setGalleryUploadProgress({ done: 0, total: files.length });
                    const results = await Promise.all(
                      files.map(async (file) => {
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await uploadImage(fd);
                        setGalleryUploadProgress((p) => p ? { ...p, done: p.done + 1 } : p);
                        return res;
                      })
                    );
                    setGalleryUploading(false);
                    setGalleryUploadProgress(null);
                    const urls = results.map((r) => r.url).filter(Boolean) as string[];
                    if (urls.length) updateField('gallery', [...(content.gallery ?? []), ...urls]);
                    e.target.value = '';
                  }}
                />
              </div>
              {(content.gallery ?? []).map((url: string, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(content.gallery ?? [], 'gallery', i)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg p-3 space-y-2 border transition-colors cursor-default ${dragOverIdx === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-gray-300 cursor-grab active:cursor-grabbing select-none text-base">drag_indicator</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Image {i + 1}</span>
                    </div>
                    <button
                      onClick={() => updateField('gallery', (content.gallery ?? []).filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                  <ImageInput
                    value={url}
                    onChange={(newUrl) => updateField('gallery', (content.gallery ?? []).map((item, idx) => idx === i ? newUrl : item))}
                    previewClass="mt-1 h-32 w-full rounded object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          </div>

          {/* Footer add button - only for list sections */}
          {['features', 'activities', 'packages', 'villas', 'reviews', 'faq', 'gallery'].includes(activeSection) && (
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3">
              <button
                onClick={() => {
                  if (activeSection === 'features') updateField('features', [...content.features, { icon: 'star', title: 'New Feature', description: '' }]);
                  if (activeSection === 'activities') updateField('activities', [...content.activities, { icon: 'hiking', title: 'New Activity', description: '' }]);
                  if (activeSection === 'packages') updateField('packages', [...content.packages, { name: 'New Package', price: '₱0', description: '', inclusions: [], featured: false }]);
                  if (activeSection === 'reviews') updateField('reviews', [...content.reviews, { name: 'New Reviewer', text: '', tags: [], date: '' }]);
                  if (activeSection === 'villas') updateField('villas', [...(content.villas ?? []), { name: 'New Villa', location: '', images: [], capacity: 2, activities: [] }]);
                  if (activeSection === 'faq') updateField('faqs', [...content.faqs, { question: 'New Question?', answer: '' }]);
                  if (activeSection === 'gallery') updateField('gallery', [...(content.gallery ?? []), '']);
                }}
                className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
              >
                <span className="material-icons text-sm">add_circle</span>
                {activeSection === 'faq' ? 'Add FAQ' : activeSection === 'features' ? 'Add Feature' : activeSection === 'activities' ? 'Add Activity' : activeSection === 'packages' ? 'Add Package' : activeSection === 'villas' ? 'Add Villa' : activeSection === 'reviews' ? 'Add Review' : 'Add Gallery Image'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
