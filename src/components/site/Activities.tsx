import { SiteContent } from '@/lib/types';

export default function Activities({ content }: { content: SiteContent }) {
  return (
    <section className="py-20 bg-[#1a3a2e]" id="activities">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Things to Do</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.activitiesTitle}</h3>
          <p className="text-green-200 max-w-2xl mx-auto">{content.activitiesSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.activities.map((a, i) => (
            <div key={i} className="flex gap-4 p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-icons text-primary">{a.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{a.title}</h4>
                <p className="text-sm text-green-200 leading-relaxed">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
