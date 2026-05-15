'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// Ensure this page is rendered dynamically (client hooks like useSearchParams require CSR)
export const dynamic = 'force-dynamic';

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
  salarySlipOriginalName?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const statusConfig: Record<
  LoanStatus,
  {
    title: string;
    badge: string;
    description: string;
    nextStep: string;
    cardStyle: string;
  }
> = {
  applied: {
    title: 'Application submitted',
    badge: 'Under review',
    description:
      'Your loan request is in the review queue. No action is required right now unless our team contacts you for clarification or more documents.',
    nextStep: 'Wait for the sanction team to review your application.',
    cardStyle: 'from-amber-50 to-yellow-100 border-amber-200',
  },
  sanctioned: {
    title: 'Loan approved',
    badge: 'Sanctioned',
    description:
      'Your loan has been approved by the sanction team and is now waiting for disbursement. You do not need to resubmit the application.',
    nextStep: 'Wait for disbursement confirmation from the disbursement team.',
    cardStyle: 'from-emerald-50 to-green-100 border-emerald-200',
  },
  rejected: {
    title: 'Loan rejected',
    badge: 'Rejected',
    description:
      'Your application was not approved. Review the reason below and correct the issue before submitting a new request.',
    nextStep: 'Fix the reason for rejection and apply again when you are ready.',
    cardStyle: 'from-rose-50 to-red-100 border-rose-200',
  },
  disbursed: {
    title: 'Loan disbursed',
    badge: 'Funds released',
    description:
      'Your loan has been disbursed. Check your account for the credited amount and keep track of repayment details.',
    nextStep: 'Start repayment according to the schedule shared by the team.',
    cardStyle: 'from-sky-50 to-blue-100 border-sky-200',
  },
  closed: {
    title: 'Loan closed',
    badge: 'Completed',
    description:
      'This loan has been fully repaid and marked as closed. You can review the details below for your records.',
    nextStep: 'No further action is required for this loan.',
    cardStyle: 'from-slate-50 to-gray-100 border-slate-200',
  },
};

export default function LoanStatusPage() {
  const router = useRouter();
  // read search params inside effect if needed (avoid useSearchParams during prerender)
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
        const fetchedLoan = response.data.loan as LoanData;

        setLoan(fetchedLoan);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load your loan status');
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [router]);

  const statusDetails = useMemo(() => {
    if (!loan) {
      return null;
    }

    return statusConfig[loan.status];
  }, [loan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-lg font-medium">Loading your loan status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center px-6">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-3xl font-bold">Loan status unavailable</h1>
          <p className="mt-3 text-white/70">{error}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/borrower/loan-config')}
              className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Apply again
            </button>
            <Link
              href="/borrower/personal-details"
              className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Back to profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!loan || !statusDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center px-6">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-3xl font-bold">No loan found</h1>
          <p className="mt-3 text-white/70">Submit a loan application first to view its status here.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/borrower/loan-config')}
              className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Start loan application
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRejected = loan.status === 'rejected';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.24),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/50">Borrower portal</p>
            <h1 className="mt-2 text-4xl font-bold">Loan status</h1>
          </div>
          <Link
            href="/login?logout=true"
            onClick={(e) => {
              e.preventDefault();
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            Logout
          </Link>
        </div>

        <div className={`rounded-[2rem] border bg-gradient-to-br ${statusDetails.cardStyle} p-8 text-slate-900 shadow-2xl`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">
                {statusDetails.badge}
              </div>
              <h2 className="mt-4 text-3xl font-bold">{statusDetails.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">{statusDetails.description}</p>

              <div className="mt-6 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Next step</p>
                <p className="mt-2 text-lg font-medium text-slate-900">{statusDetails.nextStep}</p>
              </div>

              {isRejected && loan.rejectionReason && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Rejection reason</p>
                  <p className="mt-2 text-base leading-7">{loan.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="grid min-w-[280px] gap-4 rounded-3xl bg-slate-950/90 p-6 text-white shadow-xl">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Application ID</p>
                <p className="mt-1 break-all text-sm font-medium text-white/85">{loan._id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Amount</p>
                  <p className="mt-2 text-xl font-bold">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Tenure</p>
                  <p className="mt-2 text-xl font-bold">{loan.tenure} days</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Interest</p>
                  <p className="mt-2 text-xl font-bold">₹{Math.round(loan.simpleInterest).toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Total repay</p>
                  <p className="mt-2 text-xl font-bold">₹{Math.round(loan.totalRepayment).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-white/50">Current status</p>
            <p className="mt-2 text-xl font-semibold capitalize">{loan.status}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-white/50">Submitted on</p>
            <p className="mt-2 text-xl font-semibold">{new Date(loan.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-white/50">Interest rate</p>
            <p className="mt-2 text-xl font-semibold">{loan.interestRate}% p.a.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-white/50">Loan file</p>
            <p className="mt-2 text-xl font-semibold truncate">{loan.salarySlipOriginalName || 'Uploaded slip'}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/borrower/loan-config')}
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            View another application
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}