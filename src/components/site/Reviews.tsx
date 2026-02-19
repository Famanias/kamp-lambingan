import { SiteContent } from '@/lib/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? '';
  return (first + second).toUpperCase();
}

export default function Reviews({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-white" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Wall of Love</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Guests Say</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Here is what our guests have to say about their riverside escape at Kamp Lambingan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {content.reviews.map((review, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex text-primary mb-3 text-sm">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="material-icons">star</span>
                ))}
              </div>
              <p className="text-gray-700 italic">&ldquo;{review.text}&rdquo;</p>
              {review.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.tags.map((tag, t) => (
                    <span key={t} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {getInitials(review.name)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{review.name}</span>
                  {review.date && <span className="text-xs text-gray-500">{review.date}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a
            href="https://www.facebook.com/kamplambingan/reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            See more reviews on Facebook
            <span className="material-icons text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  );
}
