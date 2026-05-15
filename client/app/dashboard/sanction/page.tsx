'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loan } from '@/types';
import { CheckCircle, CircleX, FileText } from 'lucide-react';

export default function SanctionPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<(Loan & { borrowerId: any; profileId: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoanId, setActionLoanId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchLoans();
  }, [router]);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/dashboard/sanction/loans');
      setLoans(response.data.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching loans');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId: string) => {
    setProcessing(true);
    try {
      await api.patch(`/loans/${loanId}/sanction`, { action: 'approve' });
      fetchLoans();
      setActionLoanId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error approving loan');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (loanId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/loans/${loanId}/sanction`, {
        action: 'reject',
        reason: rejectionReason,
      });
      fetchLoans();
      setActionLoanId(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error rejecting loan');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-white/50">Sanction dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Loan Sanction</h1>
        <p className="mt-2 text-white/65">Review and approve or reject loan applications.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/65">
          Loading loans...
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white/65 shadow-2xl backdrop-blur">
          No pending loans to sanction
        </div>
      ) : (
        <div className="grid gap-6">
          {loans.map((loan) => (
            <div key={loan._id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-white/50">Borrower</p>
                  <p className="font-semibold text-white">{loan.borrowerId?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">PAN</p>
                  <p className="font-semibold text-white">{loan.profileId?.pan}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Monthly Salary</p>
                  <p className="font-semibold text-white">₹{loan.profileId?.monthlySalary.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Loan Amount</p>
                  <p className="font-semibold text-white">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 border-b border-white/10 pb-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-white/50">Tenure</p>
                  <p className="font-semibold text-white">{loan.tenure} days</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Interest Rate</p>
                  <p className="font-semibold text-white">{loan.interestRate}% p.a.</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Total Repayment</p>
                  <p className="font-semibold text-sky-300">₹{loan.totalRepayment.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Salary Slip</p>
                  <a
                    href={`http://localhost:5000${loan.salarySlipUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-200 hover:text-white hover:underline"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View
                    </span>
                  </a>
                </div>
              </div>

              {actionLoanId === loan._id ? (
                <div className="space-y-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-white">
                  <p className="font-semibold text-white">Confirm Action</p>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      rows={3}
                      placeholder="Enter reason if you want to reject this loan"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(loan._id)}
                      disabled={processing}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : <><CheckCircle className="h-4 w-4" /> Approve</>}
                    </button>
                    <button
                      onClick={() => handleReject(loan._id)}
                      disabled={processing}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 py-2 text-white transition hover:bg-rose-400 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : <><CircleX className="h-4 w-4" /> Reject</>}
                    </button>
                    <button
                      onClick={() => {
                        setActionLoanId(null);
                        setRejectionReason('');
                      }}
                      className="flex-1 rounded-2xl bg-white/10 py-2 text-white transition hover:bg-white/15"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActionLoanId(loan._id)}
                  className="w-full rounded-2xl bg-white px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Review & Process
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
