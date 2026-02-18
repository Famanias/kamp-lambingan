'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/actions/content';

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  previewClass?: string;
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="material-icons text-3xl">close</span>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Full size preview"
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ImageInput({ value, onChange, label, previewClass = 'mt-2 h-24 w-full rounded object-cover' }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadImage(fd);
    setUploading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      onChange(result.url);
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-1">
      {label && <label className={labelClass}>{label}</label>}
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="https://..."
          value={value}
          onChange={(e) => { setError(null); onChange(e.target.value); }}
        />
        <button
          type="button"
          title="Upload image"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50 transition-colors"
        >
          <span className="material-icons text-base">{uploading ? 'hourglass_empty' : 'upload'}</span>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value && (
        <div className="relative group mt-2 cursor-zoom-in w-fit" onClick={() => setLightboxOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className={previewClass} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded transition-colors">
            <span className="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl drop-shadow">
              zoom_in
            </span>
          </div>
        </div>
      )}
      {lightboxOpen && value && (
        <Lightbox src={value} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
