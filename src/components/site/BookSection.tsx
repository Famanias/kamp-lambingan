import { SiteContent } from '@/lib/types';

const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3855.0313443005775!2d120.1452688748924!3d14.935346985591652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3395d7a24fd1ba29%3A0xba863a2e2c20d1f6!2sKamp%20Lambingan!5e0!3m2!1sen!2sph!4v1771399717161!5m2!1sen!2sph';

export default function BookSection({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-white" id="book">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Visit Us</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Find &amp; Contact Us</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ready for your riverside escape? Here is everything you need to plan your stay at Kamp Lambingan.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Location */}
            {/* <div className="flex items-start gap-4 p-5 bg-background-light rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-primary">location_on</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Location</h4>
                <p className="text-gray-600 text-sm">{content.address || 'San Antonio, Zambales, Philippines'}</p>
              </div>
            </div> */}

            {/* Phone */}
            <div className="flex items-start gap-4 p-5 bg-background-light rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-primary">phone</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Phone / SMS</h4>
                <a href={`tel:${content.phone}`} className="text-gray-600 text-sm hover:text-primary transition-colors">
                  {content.phone}
                </a>
              </div>
            </div>

            {/* Email / Facebook */}
            <div className="flex items-start gap-4 p-5 bg-background-light rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-primary">email</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Email &amp; Facebook</h4>
                <a href={`mailto:${content.email}`} className="text-gray-600 text-sm hover:text-primary transition-colors block">
                  {content.email}
                </a>
                <a
                  href="https://www.facebook.com/kamplambingan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 text-sm hover:text-primary transition-colors block mt-1"
                >
                  /kamplambingan on Facebook
                </a>
              </div>
            </div>

            {/* Booking Process */}
            <div className="flex items-start gap-4 p-5 bg-background-light rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-primary">assignment</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How to Book</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Fill in the booking form on this page</li>
                  <li>Send your GCash / bank payment</li>
                  <li>Upload your receipt as proof of payment</li>
                  <li>Wait for our confirmation email</li>
                </ol>
              </div>
            </div>

            <a
              href="/book"
              className="block w-full text-center bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Reserve Your Stay
            </a>
          </div>

          {/* Google Maps */}
          <div className="rounded-xl overflow-hidden shadow-lg h-[480px]">
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
