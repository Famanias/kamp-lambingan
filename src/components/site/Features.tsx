import { SiteContent } from '@/lib/types';

export default function Features({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24"
      id="experiences"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #ffffff)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
            <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
              The Kamp Difference
            </span>
          </div>
          <h2
            className="font-heading italic mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
          >
            {content.featuresTitle}
          </h2>
          <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
            {content.featuresSubtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.features.map((f, i) => (
            <div
              key={i}
              className="nature-glass rounded-2xl p-6 flex gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(20,184,129,0.12)' }}
              >
                <span className="material-icons text-primary" style={{ fontSize: 22 }}>{f.icon}</span>
              </div>
              <div>
                <h3
                  className="font-body font-semibold text-sm mb-1.5"
                  style={{ color: '#152033' }}
                >
                  {f.title}
                </h3>
                <p className="font-body font-light text-xs leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
