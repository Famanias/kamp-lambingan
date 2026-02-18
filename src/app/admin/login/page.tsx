import { login } from '@/actions/auth';

export const metadata = { title: 'Admin Login – Kamp Lambingan' };

async function loginAction(formData: FormData) {
  'use server';
  await login(formData);
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Login</h1>
          <p className="text-white/50 text-sm">Kamp Lambingan CMS</p>
        </div>
        <form action={loginAction} className="bg-white rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@kamplambingan.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
