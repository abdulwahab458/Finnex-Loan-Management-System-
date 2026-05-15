'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import FinnexBrand from '@/components/FinnexBrand';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/signup', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set a non-HttpOnly cookie so middleware can detect auth
      try {
        const maxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `token=${response.data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch (e) {
        // ignore server-side contexts
      }
      router.push('/borrower/personal-details');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[linear-gradient(160deg,rgba(15,23,42,0.95),rgba(30,41,59,0.95))] p-10">
            <FinnexBrand subtitle="Lending platform" />
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em]">Join the loan workspace.</h1>
            <p className="mt-5 max-w-md text-white/70">
              Register once and get access to the borrower portal, application status tracking, and future loan requests.
            </p>
          </div>

          <div className="bg-slate-950/85 p-8 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <div className="mb-4 md:hidden">
                <FinnexBrand compact subtitle="Lending platform" />
              </div>
              <h1 className="text-3xl font-bold">Create account</h1>
              <p className="mt-2 text-white/65">Set up your borrower profile.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-white/80">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/10"
                  placeholder="John Doe"
                />
              </div>

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

              <div>
                <label className="mb-2 block font-medium text-white/80">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/10"
                  placeholder="Confirm Password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-6 text-center text-white/65 md:text-left">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-200 hover:text-white">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
