import { SiteContent } from '@/lib/types';

export default function Activities({ content }: { content: SiteContent }) {
  return (
    <section
      className="py-24"
      id="activities"
      style={{
        background: 'linear-gradient(135deg, #eaf5f0 0%, #e2f4ec 50%, #ddf0e9 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
            <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
              Things to Do
            </span>
          </div>
          <h2
            className="font-heading italic mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
          >
            {content.activitiesTitle}
          </h2>
          <p className="font-body font-light text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
            {content.activitiesSubtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.activities.map((a, i) => (
            <div
              key={i}
              className="nature-glass-strong rounded-2xl p-6 flex gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(20,184,129,0.15)' }}
              >
                <span className="material-icons text-primary" style={{ fontSize: 22 }}>{a.icon}</span>
              </div>
              <div>
                <h3
                  className="font-body font-semibold text-sm mb-1.5"
                  style={{ color: '#152033' }}
                >
                  {a.title}
                </h3>
                <p className="font-body font-light text-xs leading-relaxed" style={{ color: 'rgba(21,32,51,0.62)' }}>
                  {a.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
