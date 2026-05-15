'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

type LoanData = {
  _id: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

const statusStyles: Record<
  LoanStatus,
  {
    label: string;
    ring: string;
    text: string;
    summary: string;
  }
> = {
  applied: {
    label: 'Under review',
    ring: 'ring-amber-300/40',
    text: 'text-amber-100',
    summary: 'Your latest application is waiting for review.',
  },
  sanctioned: {
    label: 'Approved',
    ring: 'ring-emerald-300/40',
    text: 'text-emerald-100',
    summary: 'Your loan has been approved and is waiting to be disbursed.',
  },
  rejected: {
    label: 'Rejected',
    ring: 'ring-rose-300/40',
    text: 'text-rose-100',
    summary: 'Your latest application was rejected. Review the reason and apply again.',
  },
  disbursed: {
    label: 'Disbursed',
    ring: 'ring-sky-300/40',
    text: 'text-sky-100',
    summary: 'Funds were released for your approved loan.',
  },
  closed: {
    label: 'Closed',
    ring: 'ring-slate-300/40',
    text: 'text-slate-100',
    summary: 'Your loan has been fully repaid and closed.',
  },
};

export default function BorrowerPortalPage() {
  const router = useRouter();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchLoan = async () => {
      try {
        const response = await api.get('/borrower/my-loan');
        setLoan(response.data.loan as LoanData);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.error || 'Unable to load your loan information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [router]);

  const status = useMemo(() => {
    if (!loan) return null;
    return statusStyles[loan.status];
  }, [loan]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {
      // ignore
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/50">Borrower workspace</p>
            <h1 className="mt-2 text-4xl font-bold">Welcome back</h1>
            <p className="mt-2 max-w-2xl text-white/70">
              Apply for a new loan, check the status of your previous request, and see what action is required next.
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">Start here</p>
                <h2 className="mt-2 text-3xl font-bold">Choose your next step</h2>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
                New borrowers can begin the application flow here, and returning borrowers can check progress anytime.
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 ring-1 ring-white/5 transition hover:-translate-y-1 hover:bg-slate-900">
                <p className="text-sm uppercase tracking-[0.18em] text-blue-200">Apply for loan</p>
                <h3 className="mt-3 text-2xl font-semibold">Start a new application</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Complete your personal details, upload your salary slip, and configure the amount and tenure.
                </p>
                <button
                  onClick={() => router.push('/borrower/personal-details')}
                  className="mt-6 rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Apply now
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 ring-1 ring-white/5 transition hover:-translate-y-1 hover:bg-slate-900">
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-200">Check updates</p>
                <h3 className="mt-3 text-2xl font-semibold">Review your loan status</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  See whether your request is approved, rejected, or still being reviewed, and read the next action.
                </p>
                <button
                  onClick={() => router.push('/borrower/loan-status')}
                  className="mt-6 rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  View status
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Latest loan</p>
              {loading ? (
                <p className="mt-4 text-white/70">Loading your latest request...</p>
              ) : error ? (
                <p className="mt-4 text-sm text-rose-200">{error}</p>
              ) : loan && status ? (
                <>
                  <div className={`mt-4 rounded-3xl bg-white/5 p-5 ring-1 ${status.ring}`}>
                    <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${status.text}`}>
                      {status.label}
                    </p>
                    <p className="mt-3 text-2xl font-bold">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                    <p className="mt-2 text-sm text-white/70">{status.summary}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-white/45">Status</p>
                      <p className="mt-1 font-medium capitalize">{loan.status}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-white/45">Tenure</p>
                      <p className="mt-1 font-medium">{loan.tenure} days</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-white/45">Applied</p>
                      <p className="mt-1 font-medium">{new Date(loan.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-white/45">Total repay</p>
                      <p className="mt-1 font-medium">₹{Math.round(loan.totalRepayment).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {loan.status === 'rejected' && loan.rejectionReason && (
                    <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                      <p className="font-semibold uppercase tracking-[0.18em] text-rose-200">Rejection reason</p>
                      <p className="mt-2 leading-6">{loan.rejectionReason}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push('/borrower/loan-status')}
                      className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      Open detailed status
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 text-white/70">You do not have a loan request yet.</p>
                  <button
                    onClick={() => router.push('/borrower/personal-details')}
                    className="mt-5 rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Begin application
                  </button>
                </>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">How it works</p>
              <div className="mt-4 space-y-4 text-sm text-white/75">
                <p>1. Fill out your personal details.</p>
                <p>2. Upload your salary slip.</p>
                <p>3. Configure loan amount and tenure.</p>
                <p>4. Return here anytime to review updates.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/borrower/loan-status"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            View loan updates
          </Link>
          <Link
            href="/borrower/personal-details"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Start or resume application
          </Link>
        </div>
      </div>
    </div>
  );
}