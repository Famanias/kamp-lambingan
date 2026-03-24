import { SiteContent } from '@/lib/types';
import { ArrowUpRight } from 'lucide-react';

const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.0313443005775!2d120.1452688748924!3d14.935346985591652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3395d7a24fd1ba29%3A0xba863a2e2c20d1f6!2sKamp%20Lambingan!5e0!3m2!1sen!2sph!4v1771399717161!5m2!1sen!2sph';

export default function BookSection({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-28 relative overflow-hidden"
      id="book"
      style={{
        background: 'linear-gradient(135deg, #e2f5ee 0%, #d5f0e8 35%, #caeee4 65%, #d8f2eb 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(20,184,129,0.35) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
            <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
              Visit Us
            </span>
          </div>
          <h2
            className="font-heading italic mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
          >
            Find &amp; Contact Us
          </h2>
          <p className="font-body font-light text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
            Ready for your riverside escape? Everything you need to plan your stay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Contact info */}
          <div className="space-y-4">
            {/* Phone */}
            <div className="nature-glass-strong rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,129,0.15)' }}>
                <span className="material-icons text-primary" style={{ fontSize: 20 }}>phone</span>
              </div>
              <div>
                <h3 className="font-body font-semibold text-sm mb-1" style={{ color: '#152033' }}>Phone / SMS</h3>
                <a href={`tel:${content.phone}`} className="font-body font-light text-sm text-primary hover:text-primary/80 transition-colors">
                  {content.phone}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="nature-glass-strong rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,129,0.15)' }}>
                <span className="material-icons text-primary" style={{ fontSize: 20 }}>email</span>
              </div>
              <div>
                <h3 className="font-body font-semibold text-sm mb-1" style={{ color: '#152033' }}>Email</h3>
                <a href={`mailto:${content.email}`} className="font-body font-light text-sm text-primary hover:text-primary/80 transition-colors">
                  {content.email}
                </a>
              </div>
            </div>

            {/* How to book */}
            <div className="nature-glass-strong rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,129,0.15)' }}>
                <span className="material-icons text-primary" style={{ fontSize: 20 }}>assignment</span>
              </div>
              <div>
                <h3 className="font-body font-semibold text-sm mb-2" style={{ color: '#152033' }}>How to Book</h3>
                <ol className="space-y-1.5">
                  {['Fill in the booking form', 'Send your GCash payment', 'Upload your receipt', 'Receive confirmation'].map((step, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full text-[10px] font-body font-semibold flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(20,184,129,0.15)', color: '#14b881' }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-body font-light text-xs" style={{ color: 'rgba(21,32,51,0.7)' }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* CTA button */}
            <a
              href="/book"
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3.5 px-6 rounded-full font-body font-medium text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            >
              Reserve Your Stay
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Map */}
          <div className="nature-glass rounded-2xl overflow-hidden shadow-xl" style={{ height: 480 }}>
            <iframe
              src={GOOGLE_MAPS_EMBED}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Kamp Lambingan location"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
