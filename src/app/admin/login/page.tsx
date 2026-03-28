import { login } from '@/actions/auth';

export const metadata = { title: 'Admin Login – Kamp Lambingan' };

async function loginAction(formData: FormData) {
  'use server';
  await login(formData);
}

export default function AdminLoginPage() {
  return (
    <div
      className="fixed inset-0 overflow-auto flex items-center justify-center px-4"
      style={{ backgroundColor: '#0d1f14' }}
    >
      {/* Decorative radial glow blobs */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(20,184,129,0.18)' }} />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(20,184,129,0.10)' }} />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: 'rgba(20,184,129,0.06)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <img
            src="/assets/logo.png"
            alt="Kamp Lambingan"
            className="h-16 mx-auto mb-5 drop-shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white mb-1">Admin Login</h1>
          <p className="text-white/40 text-sm tracking-wide">Kamp Lambingan CMS</p>
        </div>

        {/* Card */}
        <form
          action={loginAction}
          className="rounded-2xl p-7 space-y-5 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@kamplambingan.com"
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold text-sm tracking-wide transition-colors shadow-lg shadow-primary/30 mt-1"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} Kamp Lambingan
        </p>
      </div>
    </div>
  );
}
