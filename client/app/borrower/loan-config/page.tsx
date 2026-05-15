'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle, LogOut } from 'lucide-react';

export default function LoanConfigPage() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(180);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const interestRate = 12;

  const simpleInterest = (loanAmount * interestRate * tenure) / (365 * 100);
  const totalRepayment = loanAmount + simpleInterest;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const salarySlipUrl = sessionStorage.getItem('salarySlipUrl');
      const salarySlipOriginalName = sessionStorage.getItem('salarySlipOriginalName');

      if (!salarySlipUrl || !salarySlipOriginalName) {
        setError('Salary slip not found. Please upload again.');
        setLoading(false);
        router.push('/borrower/upload-salary');
        return;
      }

      const response = await api.post('/loans/apply', {
        loanAmount,
        tenure,
        salarySlipUrl,
        salarySlipOriginalName,
      });

      setSuccess(true);
      sessionStorage.removeItem('salarySlipUrl');
      sessionStorage.removeItem('salarySlipOriginalName');

      setTimeout(() => {
        router.push(`/borrower/loan-status?loanId=${response.data.loan._id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error applying for loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white/50">Step 3 of 4</div>
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
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Loan Configuration</h1>
          <p className="text-white/65 mb-6">Adjust the sliders to configure your loan amount and tenure.</p>

          {error && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-300/20 bg-green-500/10 px-4 py-3 text-green-100 mb-4">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Loan application submitted successfully! Redirecting...
              </span>
            </div>
          )}

          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side - Sliders */}
            <div className="space-y-8">
              <div>
                <label className="block text-white/75 font-medium mb-4">
                  Loan Amount: <span className="text-sky-300 text-xl">₹{loanAmount.toLocaleString('en-IN')}</span>
                </label>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="5000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/60 mt-2">
                  <span>₹50,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              <div>
                <label className="block text-white/75 font-medium mb-4">
                  Tenure: <span className="text-sky-300 text-xl">{tenure} days</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="1"
                  value={tenure}
                  onChange={(e) => setTenure(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/60 mt-2">
                  <span>30 days</span>
                  <span>365 days</span>
                </div>
              </div>
            </div>

            {/* Right Side - Calculation Display */}
            <div className="rounded-lg p-6 bg-white/5 h-fit">
              <h3 className="text-lg font-bold text-white mb-6">Loan Breakdown</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/75">Interest Rate (p.a.):</span>
                  <span className="font-medium text-white">{interestRate}%</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/75">Principal Amount:</span>
                  <span className="font-medium text-white">₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/75">Simple Interest:</span>
                  <span className="font-medium text-white">₹{Math.round(simpleInterest).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center bg-sky-600 text-white px-4 py-3 rounded-lg mt-6">
                  <span className="font-bold">Total Repayment:</span>
                  <span className="text-xl font-bold">₹{Math.round(totalRepayment).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-xs text-white/65 bg-white/5 px-3 py-2 rounded">
                <span className="font-bold">Formula:</span> SI = (P × R × T) / (365 × 100)
              </p>
            </div>
          </form>

          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full mt-8 bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg"
          >
            {loading ? 'Submitting...' : 'Apply for Loan'}
          </button>
        </div>
      </div>
    </div>
  );
}
