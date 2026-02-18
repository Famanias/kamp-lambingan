'use client';

import { useState } from 'react';
import { saveContent } from '@/actions/content';
import { SiteContent, Feature, Activity, Package, FaqItem, Review } from '@/lib/types';
import IconPicker from './IconPicker';

interface ContentEditorProps {
  initialContent: SiteContent;
}

type Section = 'hero' | 'contact' | 'features' | 'activities' | 'packages' | 'reviews' | 'faq' | 'gallery' | 'footer';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'auto_awesome' },
  { key: 'contact', label: 'Contact', icon: 'contact_phone' },
  { key: 'features', label: 'Features', icon: 'star' },
  { key: 'activities', label: 'Activities', icon: 'hiking' },
  { key: 'packages', label: 'Packages', icon: 'inventory' },
  { key: 'reviews', label: 'Reviews', icon: 'rate_review' },
  { key: 'faq', label: 'FAQ', icon: 'help' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
  { key: 'footer', label: 'Footer', icon: 'web' },
];

export default function ContentEditor({ initialContent }: ContentEditorProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

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
                <label className={labelClass}>Hero Image URL</label>
                <input className={inputClass} value={content.heroImage || ''} onChange={(e) => updateField('heroImage', e.target.value)} />
                {content.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={content.heroImage} alt="Hero preview" className="mt-2 h-24 rounded object-cover" />
                )}
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
              {content.features.map((f: Feature, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Feature {i + 1}</span>
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
              {content.activities.map((a: Activity, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Activity {i + 1}</span>
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
              {content.packages.map((p: Package, i: number) => (
                <div key={i} className={`rounded-xl border-2 overflow-hidden ${p.featured ? 'border-primary' : 'border-gray-200'}`}>
                  {/* Card header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${p.featured ? 'bg-primary/10' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
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

          {activeSection === 'reviews' && (
            <div className="space-y-4">
              {content.reviews.map((r: Review, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Review {i + 1}</span>
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
              {content.faqs.map((f: FaqItem, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">FAQ {i + 1}</span>
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
                <label className={labelClass}>Footer Tagline</label>
                <textarea className={inputClass} rows={2} value={content.footerTagline || ''} onChange={(e) => updateField('footerTagline', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Short description shown under the logo in the footer.</p>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Social Media Links</p>
              <p className="text-xs text-gray-400 -mt-2">Leave any field blank to hide that icon in the footer.</p>
              <div>
                <label className={labelClass}>Facebook URL</label>
                <input className={inputClass} type="url" placeholder="https://www.facebook.com/yourpage" value={content.facebookUrl || ''} onChange={(e) => updateField('facebookUrl', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Instagram URL</label>
                <input className={inputClass} type="url" placeholder="https://www.instagram.com/yourpage" value={content.instagramUrl || ''} onChange={(e) => updateField('instagramUrl', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>TikTok URL</label>
                <input className={inputClass} type="url" placeholder="https://www.tiktok.com/@yourpage" value={content.tiktokUrl || ''} onChange={(e) => updateField('tiktokUrl', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Threads URL</label>
                <input className={inputClass} type="url" placeholder="https://www.threads.net/@yourpage" value={content.threadsUrl || ''} onChange={(e) => updateField('threadsUrl', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>YouTube URL</label>
                <input className={inputClass} type="url" placeholder="https://www.youtube.com/@yourchannel" value={content.youtubeUrl || ''} onChange={(e) => updateField('youtubeUrl', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Twitter / X URL</label>
                <input className={inputClass} type="url" placeholder="https://twitter.com/yourpage" value={content.twitterUrl || ''} onChange={(e) => updateField('twitterUrl', e.target.value)} />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-2">Also displayed in the footer (edit in other sections):</p>
                <p>• <strong>Site Title</strong> — Hero section</p>
                <p>• <strong>Phone &amp; Email</strong> — Contact section</p>
              </div>
            </div>
          )}

          {activeSection === 'gallery' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add direct image URLs (Google Photos, etc.). 6 images are displayed on the homepage.</p>
              {(content.gallery ?? []).map((url: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>Image {i + 1} URL</label>
                    <input
                      className={inputClass}
                      value={url}
                      onChange={(e) => updateField('gallery', (content.gallery ?? []).map((item, idx) => idx === i ? e.target.value : item))}
                    />
                  </div>
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Gallery ${i + 1}`} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                  )}
                  <button
                    onClick={() => updateField('gallery', (content.gallery ?? []).filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 mt-4 flex-shrink-0"
                  >
                    <span className="material-icons text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          </div>

          {/* Footer add button - only for list sections */}
          {['features', 'activities', 'packages', 'reviews', 'faq', 'gallery'].includes(activeSection) && (
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3">
              <button
                onClick={() => {
                  if (activeSection === 'features') updateField('features', [...content.features, { icon: 'star', title: 'New Feature', description: '' }]);
                  if (activeSection === 'activities') updateField('activities', [...content.activities, { icon: 'hiking', title: 'New Activity', description: '' }]);
                  if (activeSection === 'packages') updateField('packages', [...content.packages, { name: 'New Package', price: '₱0', description: '', inclusions: [], featured: false }]);
                  if (activeSection === 'reviews') updateField('reviews', [...content.reviews, { name: 'New Reviewer', text: '', tags: [], date: '' }]);
                  if (activeSection === 'faq') updateField('faqs', [...content.faqs, { question: 'New Question?', answer: '' }]);
                  if (activeSection === 'gallery') updateField('gallery', [...(content.gallery ?? []), '']);
                }}
                className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
              >
                <span className="material-icons text-sm">add_circle</span>
                Add {activeSection === 'faq' ? 'FAQ' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1, -1) === 'activitie' ? 'Activity' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1, -1)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
