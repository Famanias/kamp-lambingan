import { SiteContent } from '@/lib/types';

export default function Features({ content }: { content: SiteContent }) {
  return (
    <section className="py-20 bg-white" id="experiences">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">The Kamp Difference</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{content.featuresTitle}</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">{content.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.features.map((f, i) => (
            <div key={i} className="flex gap-4 p-6 bg-background-light rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-icons text-primary">{f.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
