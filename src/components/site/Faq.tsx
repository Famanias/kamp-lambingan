import { SiteContent } from '@/lib/types';

export default function Faq({ content }: { content: SiteContent }) {
  return (
    <section className="py-24 bg-background-light" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Got Questions?</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <p className="text-gray-600">
            Everything you need to know before your visit. Can&apos;t find an answer? Message us on Facebook.
          </p>
        </div>
        <div className="divide-y divide-gray-200 border-y border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          {content.faqs.map((faq, i) => (
            <details key={i} className="group p-0">
              <summary className="flex items-center justify-between gap-4 cursor-pointer p-5 hover:bg-gray-50 transition-colors list-none select-none">
                <span className="font-semibold text-gray-800">{faq.question}</span>
                <span className="material-icons text-primary flex-shrink-0 faq-arrow transition-transform duration-200 group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <p className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-10 text-gray-500 text-sm">
          Still have questions?{' '}
          <a
            href="https://m.me/kamplambingan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Message us on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
