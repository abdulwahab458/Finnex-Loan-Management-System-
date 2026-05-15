'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { AlertCircle, ArrowRight, LogOut } from 'lucide-react';

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [step] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    pan: '',
    dateOfBirth: '',
    monthlySalary: '',
    employmentMode: 'salaried',
  });
  const [error, setError] = useState('');
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    checkProfile();
  }, [router]);

  const checkProfile = async () => {
    try {
      const response = await api.get('/borrower/profile');
      if (response.data.profile) {
        setHasProfile(true);
        router.push('/borrower/upload-salary');
      }
    } catch (err) {
      // Profile doesn't exist yet, show form
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBreErrors([]);
    setLoading(true);

    try {
      const response = await api.post('/borrower/profile', {
        fullName: formData.fullName,
        pan: formData.pan.toUpperCase(),
        dateOfBirth: formData.dateOfBirth,
        monthlySalary: Number.parseInt(formData.monthlySalary),
        employmentMode: formData.employmentMode,
      });

      setHasProfile(true);
      router.push('/borrower/upload-salary');
    } catch (err: any) {
      const serverMessage = err.response?.data?.error;
      if (err.response?.status === 422) {
        setBreErrors(err.response.data.breFailureReasons || []);
      } else if (err.response?.status === 400 && serverMessage) {
        // Show friendly toast for PAN already registered or other 400 errors
        toast.error(serverMessage);
        setError(serverMessage);
      } else {
        setError(err.response?.data?.error || 'Error creating profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white/50">Step 1 of 4</div>
              <Link
                href="/login?logout=true"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="text-sm text-red-600 hover:underline"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              </Link>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Personal Details</h1>
          <p className="text-white/65 mb-6">
            Please provide your personal information. This will be validated according to our lending criteria.
          </p>

          {error && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100 mb-4">
              {error}
            </div>
          )}

          {breErrors.length > 0 && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-white mb-4">
              <p className="mb-2 inline-flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4" />
                Application Requirements Not Met:
              </p>
              <ul className="space-y-2 ml-4 list-disc">
                {breErrors.map((err, idx) => (
                  <li key={idx} className="text-sm">
                    {err}
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-3 text-white/70">Please correct the above issues and try again.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/75 font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-white/75 font-medium mb-2">PAN Number (e.g., ABCDE1234F)</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                placeholder="AAAAA0000A"
                maxLength={10}
                required
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:border-sky-400"
              />
              <p className="text-xs text-white/60 mt-1">Format: 5 letters, 4 numbers, 1 letter</p>
            </div>

            <div>
              <label className="block text-white/75 font-medium mb-2">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:border-sky-400"
              />
              <p className="text-xs text-white/60 mt-1">Must be between 23 and 50 years old</p>
            </div>

            <div>
              <label className="block text-white/75 font-medium mb-2">Monthly Salary (₹)</label>
              <input
                type="number"
                name="monthlySalary"
                value={formData.monthlySalary}
                onChange={handleChange}
                placeholder="25000"
                min="25000"
                required
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:border-sky-400"
              />
              <p className="text-xs text-white/60 mt-1">Minimum ₹25,000</p>
            </div>

            <div>
              <label className="block text-white/75 font-medium mb-2">Employment Mode</label>
              <select
                name="employmentMode"
                value={formData.employmentMode}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-sky-400"
              >
                <option value="salaried">Salaried</option>
                <option value="self-employed">Self-Employed</option>
              </select>
              <p className="text-xs text-white/60 mt-1">Unemployed applicants are not eligible</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Validating...' : <><span>Continue to Next Step</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
