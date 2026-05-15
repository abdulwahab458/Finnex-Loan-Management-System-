'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import FinnexBrand from '@/components/FinnexBrand';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getRoleRedirectPath = (role: string) => {
    switch (role) {
      case 'borrower':
        return '/borrower/portal';
      case 'sales':
      case 'admin':
        return '/dashboard/sales';
      case 'sanction':
        return '/dashboard/sanction';
      case 'disbursement':
        return '/dashboard/disbursement';
      case 'collection':
        return '/dashboard/collection';
      default:
        return '/dashboard/sales';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set a non-HttpOnly cookie so middleware can read the token
      try {
        const maxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `token=${response.data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch (e) {
        // ignore server-side rendering contexts
      }

      router.push(getRoleRedirectPath(response.data.user.role));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden flex-col justify-between bg-[linear-gradient(160deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))] p-10 md:flex">
            <div>
              <FinnexBrand subtitle="Lending platform" />
              <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em]">Borrow, monitor, and close loans in one place.</h1>
              <p className="mt-5 max-w-md text-white/70">
                A single workspace for borrowers, sales, sanction, disbursement, and collection teams.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-white/75">
              <div className="rounded-2xl bg-white/5 p-4">Borrower portal with application tracking.</div>
              <div className="rounded-2xl bg-white/5 p-4">Role-based dashboards for operations teams.</div>
              <div className="rounded-2xl bg-white/5 p-4">Live loan lifecycle from profile to repayment.</div>
            </div>
          </div>

          <div className="bg-slate-950/85 p-8 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <div className="mb-4 md:hidden">
                <FinnexBrand compact subtitle="Lending platform" />
              </div>
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="mt-2 text-white/65">Sign in to continue to your loan workspace.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-white/80">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/10"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-white/80">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/10"
                  placeholder="Password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-white/65 md:text-left">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-200 hover:text-white">
                Sign up
              </Link>
            </p>

            <hr className="my-6 border-white/10" />

            <div className="space-y-1 text-xs text-white/45">
              <p className="font-bold text-white/70">Demo Credentials:</p>
              <p>Borrower: borrower@lms.com / Borrower@123</p>
              <p>Sales: sales@lms.com / Sales@123</p>
              <p>Sanction: sanction@lms.com / Sanction@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
