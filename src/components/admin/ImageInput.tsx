'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { uploadImage, listImages } from '@/actions/content';

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  onMultiple?: (urls: string[]) => void;
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

function ImagePickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    listImages().then((res) => {
      setLoading(false);
      if (res.error) setError(res.error);
      else setImages(res.urls);
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">Choose Existing Photo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <span className="material-icons animate-spin mr-2">refresh</span>
              Loading images…
            </div>
          )}
          {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}
          {!loading && !error && images.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No uploaded images yet.</p>
          )}
          {!loading && images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => { onSelect(url); onClose(); }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary focus:outline-none focus:border-primary transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                    <span className="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">check_circle</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImageInput({ value, onChange, onMultiple, label, previewClass = 'mt-2 h-24 w-full rounded object-cover' }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    setUploading(true);

    if (onMultiple && files.length > 1) {
      // Multi-upload: upload all in parallel and return all URLs
      setUploadProgress({ done: 0, total: files.length });
      const results = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          const res = await uploadImage(fd);
          setUploadProgress((p) => p ? { ...p, done: p.done + 1 } : p);
          return res;
        })
      );
      setUploading(false);
      setUploadProgress(null);
      const errors = results.filter((r) => r.error).map((r) => r.error);
      if (errors.length) setError(errors[0]!);
      const urls = results.map((r) => r.url).filter(Boolean) as string[];
      if (urls.length) onMultiple(urls);
    } else {
      // Single upload
      const fd = new FormData();
      fd.append('file', files[0]);
      const result = await uploadImage(fd);
      setUploading(false);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        onChange(result.url);
      }
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleSelect = useCallback((url: string) => {
    setError(null);
    onChange(url);
  }, [onChange]);

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
          title="Choose existing photo"
          onClick={() => setPickerOpen(true)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 transition-colors"
        >
          <span className="material-icons text-base">photo_library</span>
          Library
        </button>
        <button
          type="button"
          title={onMultiple ? 'Upload one or more images' : 'Upload image'}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50 transition-colors"
        >
          <span className="material-icons text-base">{uploading ? 'hourglass_empty' : 'upload'}</span>
          {uploading
            ? uploadProgress
              ? `${uploadProgress.done}/${uploadProgress.total}…`
              : 'Uploading…'
            : onMultiple ? 'Upload' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple={!!onMultiple} className="hidden" onChange={handleFile} />
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
      {pickerOpen && (
        <ImagePickerModal onSelect={handleSelect} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
