'use client';

import { useRef, useEffect } from 'react';

const VIDEO_RE = /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i;
const HLS_RE   = /\.m3u8(\?|#|$)/i;

/** Shared full-bleed section background.
 *  - HLS (.m3u8) → hls.js with MP4 fallback
 *  - MP4/WebM    → native <video> autoPlay muted loop
 *  - Image URL   → <img objectFit cover> with slow parallax drift
 *  Always renders a nature gradient overlay on top.
 */
export default function SectionBackground({
  src,
  overlayStyle,
}: {
  src?: string | null;
  overlayStyle?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video || !VIDEO_RE.test(src)) return;

    let cleanup: (() => void) | undefined;

    if (HLS_RE.test(src)) {
      import('hls.js').then(({ default: Hls }) => {
        const v = videoRef.current;
        if (!v) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ autoStartLoad: true, maxBufferLength: 30 });
          hls.loadSource(src);
          hls.attachMedia(v);
          hls.on(Hls.Events.MANIFEST_PARSED, () => void v.play().catch(() => {}));
          cleanup = () => hls.destroy();
        } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS (Safari/iOS)
          v.src = src;
          void v.play().catch(() => {});
        }
      });
    } else {
      video.src = src;
      void video.play().catch(() => {});
    }

    return () => cleanup?.();
  }, [src]);

  const DEFAULT_OVERLAY: React.CSSProperties = {
    background:
      'linear-gradient(to bottom, rgba(20,184,129,0.08) 0%, rgba(255,255,255,0.55) 55%, rgba(245,249,247,0.95) 100%)',
  };

  if (!src) return null;

  const isVid = VIDEO_RE.test(src);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {isVid ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          role="presentation"
          className="w-full h-full object-cover"
          style={{ animation: 'parallax-drift 24s ease-in-out infinite' }}
        />
      )}
      <div className="absolute inset-0" style={overlayStyle ?? DEFAULT_OVERLAY} />
    </div>
  );
}
