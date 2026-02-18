'use client';

import { useState } from 'react';
import { saveContent } from '@/actions/content';
import { SiteContent, Feature, Activity, Package, FaqItem, Review } from '@/lib/types';

interface ContentEditorProps {
  initialContent: SiteContent;
}

type Section = 'hero' | 'contact' | 'features' | 'activities' | 'packages' | 'reviews' | 'faq' | 'gallery';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'auto_awesome' },
  { key: 'contact', label: 'Contact', icon: 'contact_phone' },
  { key: 'features', label: 'Features', icon: 'star' },
  { key: 'activities', label: 'Activities', icon: 'hiking' },
  { key: 'packages', label: 'Packages', icon: 'inventory' },
  { key: 'reviews', label: 'Reviews', icon: 'rate_review' },
  { key: 'faq', label: 'FAQ', icon: 'help' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' },
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
    <div className="flex gap-6">
      {/* Section nav */}
      <aside className="w-44 flex-shrink-0">
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
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
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

        <div className="bg-white rounded-xl shadow-sm p-5">
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
                      <label className={labelClass}>Icon (Material Icons name)</label>
                      <input className={inputClass} value={f.icon} onChange={(e) => updateField('features', content.features.map((item, idx) => idx === i ? { ...item, icon: e.target.value } : item))} />
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
              <button
                onClick={() => updateField('features', [...content.features, { icon: 'star', title: 'New Feature', description: '' }])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add Feature
              </button>
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
                      <input className={inputClass} value={a.icon} onChange={(e) => updateField('activities', content.activities.map((item, idx) => idx === i ? { ...item, icon: e.target.value } : item))} />
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
              <button
                onClick={() => updateField('activities', [...content.activities, { icon: 'hiking', title: 'New Activity', description: '' }])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add Activity
              </button>
            </div>
          )}

          {activeSection === 'packages' && (
            <div className="space-y-4">
              {content.packages.map((p: Package, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Package {i + 1}</span>
                    <div className="flex gap-3 items-center">
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={p.featured || false}
                          onChange={(e) => updateField('packages', content.packages.map((item, idx) => idx === i ? { ...item, featured: e.target.checked } : item))}
                        />
                        Featured
                      </label>
                      <button
                        onClick={() => updateField('packages', content.packages.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
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
                </div>
              ))}
              <button
                onClick={() => updateField('packages', [...content.packages, { name: 'New Package', price: '₱0', description: '', inclusions: [], featured: false }])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add Package
              </button>
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
              <button
                onClick={() => updateField('reviews', [...content.reviews, { name: 'New Reviewer', text: '', tags: [], date: '' }])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add Review
              </button>
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
              <button
                onClick={() => updateField('faqs', [...content.faqs, { question: 'New Question?', answer: '' }])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add FAQ
              </button>
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
              <button
                onClick={() => updateField('gallery', [...(content.gallery ?? []), ''])}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add Image URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
