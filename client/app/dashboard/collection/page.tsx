'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Download, Search, ChevronDown, ChevronUp, AlertTriangle, BadgeInfo, CalendarClock, CircleDollarSign, FileDown, X } from 'lucide-react';

interface CollectionLoan {
  _id: string;
  borrowerId: any;
  status: 'disbursed' | 'closed';
  loanAmount: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  paymentCount: number;
  tenure: number;
  disbursedAt?: string;
  closedAt?: string;
  repaymentEndDate?: string;
  isOverdue?: boolean;
  isNearlyDue?: boolean;
  payments?: Array<{
    _id: string;
    utrNumber: string;
    amount: number;
    paymentDate: string;
    recordedBy?: { fullName?: string; email?: string };
  }>;
}

interface PaymentModal {
  loanId: string | null;
  utrNumber: string;
  amount: string;
  paymentDate: string;
}

interface Summary {
  totalActiveLoansUnderCollection: number;
  totalAmountOutstandingAcrossAllLoans: number;
  totalAmountCollectedThisMonth: number;
  totalLoansClosedThisMonth: number;
}

export default function CollectionPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<CollectionLoan[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalActiveLoansUnderCollection: 0,
    totalAmountOutstandingAcrossAllLoans: 0,
    totalAmountCollectedThisMonth: 0,
    totalLoansClosedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'nearly-due' | 'recently-disbursed'>('all');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [paymentHistoryLoan, setPaymentHistoryLoan] = useState<CollectionLoan | null>(null);
  const [paymentModal, setPaymentModal] = useState<PaymentModal>({
    loanId: null,
    utrNumber: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [processing, setProcessing] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState('');

  const visibleLoans = loans.filter((loan) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const disbursedAtTime = loan.disbursedAt ? new Date(loan.disbursedAt).getTime() : null;
    const matchesSearch =
      !normalizedSearch ||
      loan.borrowerId?.fullName?.toLowerCase().includes(normalizedSearch) ||
      String(loan._id).toLowerCase().includes(normalizedSearch);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && loan.isOverdue) ||
      (filter === 'nearly-due' && loan.isNearlyDue) ||
      (filter === 'recently-disbursed' && disbursedAtTime !== null && disbursedAtTime >= Date.now() - 7 * 24 * 60 * 60 * 1000);

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    void fetchLoans(tab);
  }, [router, tab]);

  const fetchLoans = async (nextTab: 'active' | 'closed' = tab) => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/collection/loans', {
        params: {
          tab: nextTab === 'closed' ? 'closed' : 'active',
        },
      });
      setLoans(response.data.loans || []);
      setSummary(response.data.summary || summary);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching loans');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercent = (loan: CollectionLoan) => {
    if (!loan.totalRepayment) return 0;
    return Math.min(100, Math.round((loan.totalPaid / loan.totalRepayment) * 100));
  };

  const getProgressClass = (loan: CollectionLoan) => {
    const percent = getCompletionPercent(loan);
    if (percent > 75) return 'bg-emerald-500';
    if (percent >= 40) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  const exportLoanCsv = (loan: CollectionLoan) => {
    const rows = [
      ['UTR Number', 'Amount Paid', 'Payment Date', 'Recorded By'],
      ...(loan.payments || []).map((payment) => [
        payment.utrNumber,
        String(payment.amount),
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.recordedBy?.fullName || payment.recordedBy?.email || '-',
      ]),
      ['', '', 'Total', String((loan.payments || []).reduce((sum, payment) => sum + payment.amount, 0))],
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan-${loan._id}-payments.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredPaymentsTotal = (paymentHistoryLoan?.payments || []).reduce((sum, payment) => sum + payment.amount, 0);

  const currentLoanForExport = paymentHistoryLoan || visibleLoans.find((item) => item._id === expandedLoanId) || null;

  const handleRecordPayment = async () => {
    if (!paymentModal.loanId) return;

    setProcessing(true);
    setError('');

    try {
      await api.post(`/loans/${paymentModal.loanId}/payments`, {
        utrNumber: paymentModal.utrNumber,
        amount: Number.parseInt(paymentModal.amount, 10),
        paymentDate: paymentModal.paymentDate,
      });

      await fetchLoans(tab);
      setPaymentModal({
        loanId: null,
        utrNumber: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setPaymentWarning('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error recording payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setPaymentModal({ ...paymentModal, amount: value });
    const numericAmount = Number.parseInt(value, 10);
    if (!Number.isNaN(numericAmount) && numericAmount > 0 && numericAmount < 1000) {
      setPaymentWarning('This is a very small payment, are you sure?');
    } else {
      setPaymentWarning('');
    }
  };

  const handleSearchSubmit = async () => {
    setError('');
  };

  const handleFilterChange = async (nextFilter: 'all' | 'overdue' | 'nearly-due' | 'recently-disbursed') => {
    setFilter(nextFilter);
    setError('');
  };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-white/50">Collection dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Loan Collection</h1>
        <p className="mt-2 text-white/65">Record repayments and track outstanding balances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <p className="text-sm text-white/55">Total Active Loans Under Collection</p>
          <p className="mt-2 text-2xl font-bold text-white">{summary.totalActiveLoansUnderCollection}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <p className="text-sm text-white/55">Total Amount Outstanding Across All Loans</p>
          <p className="mt-2 text-2xl font-bold text-rose-200">₹{summary.totalAmountOutstandingAcrossAllLoans.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <p className="text-sm text-white/55">Total Amount Collected This Month</p>
          <p className="mt-2 text-2xl font-bold text-emerald-200">₹{summary.totalAmountCollectedThisMonth.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <p className="text-sm text-white/55">Total Loans Closed This Month</p>
          <p className="mt-2 text-2xl font-bold text-sky-200">{summary.totalLoansClosedThisMonth}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSearchSubmit();
                }
              }}
              placeholder="Search by borrower name or loan ID"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSearchSubmit()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
              aria-label="Search loans"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['all', 'All'],
            ['overdue', 'Overdue'],
            ['nearly-due', 'Nearly Due'],
            ['recently-disbursed', 'Recently Disbursed'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => void handleFilterChange(value as any)}
              className={`rounded-2xl px-4 py-2 text-sm transition ${filter === value ? 'bg-sky-500 text-white' : 'bg-white/5 text-white/75 hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTab('active');
            setExpandedLoanId(null);
            setPaymentHistoryLoan(null);
          }}
          className={`rounded-2xl px-4 py-2 text-sm transition ${tab === 'active' ? 'bg-sky-500 text-white' : 'bg-white/5 text-white/75 hover:bg-white/10'}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('closed');
            setExpandedLoanId(null);
            setPaymentHistoryLoan(null);
          }}
          className={`rounded-2xl px-4 py-2 text-sm transition ${tab === 'closed' ? 'bg-sky-500 text-white' : 'bg-white/5 text-white/75 hover:bg-white/10'}`}
        >
          Closed
        </button>
        <button
          type="button"
          onClick={() => {
            if (currentLoanForExport) exportLoanCsv(currentLoanForExport);
          }}
          disabled={!currentLoanForExport}
          className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export Payment Report
        </button>
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
      ) : visibleLoans.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white/65 shadow-2xl backdrop-blur">
          No loans match the current view
        </div>
      ) : (
        <div className="grid gap-6">
          {visibleLoans.map((loan) => (
            <div key={loan._id} className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur ${loan.isOverdue ? 'border-rose-400/30 bg-rose-500/10' : 'border-white/10 bg-white/5'}`}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {loan.isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
                    <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                  </span>
                )}
                {loan.isNearlyDue && !loan.isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100">
                    <CalendarClock className="h-3.5 w-3.5" /> Nearly Due
                  </span>
                )}
                {loan.status === 'closed' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Closed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-white/50">Borrower</p>
                  <p className="font-semibold text-white">{loan.borrowerId?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Loan Amount</p>
                  <p className="font-semibold text-white">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Total Repayment</p>
                  <p className="font-semibold text-sky-300">₹{loan.totalRepayment.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Closed / Due Date</p>
                  <p className="font-semibold text-white">
                    {loan.status === 'closed'
                      ? loan.closedAt
                        ? new Date(loan.closedAt).toLocaleDateString()
                        : '-'
                      : loan.repaymentEndDate
                        ? new Date(loan.repaymentEndDate).toLocaleDateString()
                        : '-'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-white">Repayment Progress</p>
                  <p className="text-sm text-white/60">
                    {loan.paymentCount} payment{loan.paymentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressClass(loan)}`}
                    style={{
                      width: `${getCompletionPercent(loan)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 border-b border-white/10 pb-6">
                <div className="rounded-2xl bg-blue-500/10 p-4">
                  <p className="text-xs text-white/50">Amount Paid</p>
                  <p className="font-bold text-blue-200">₹{loan.totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl bg-rose-500/10 p-4">
                  <p className="text-xs text-white/50">Outstanding Balance</p>
                  <p className="font-bold text-rose-200">₹{loan.outstandingBalance.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Completion</p>
                  <p className="font-bold text-white">{getCompletionPercent(loan)}%</p>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedLoanId(expandedLoanId === loan._id ? null : loan._id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  {expandedLoanId === loan._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {expandedLoanId === loan._id ? 'Hide Payments' : 'View Payments'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentHistoryLoan(loan)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  <BadgeInfo className="h-4 w-4" /> Payment History Modal
                </button>
                <button
                  type="button"
                  onClick={() => exportLoanCsv(loan)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  <FileDown className="h-4 w-4" /> Export CSV
                </button>
              </div>

              {expandedLoanId === loan._id && (
                <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Payments</h3>
                    <p className="text-sm text-white/60">{loan.paymentCount} payment{loan.paymentCount !== 1 ? 's' : ''}</p>
                  </div>
                  {loan.payments && loan.payments.length > 0 ? (
                    <div className="space-y-3">
                      {loan.payments.map((payment) => (
                        <div key={payment._id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 md:grid-cols-4">
                          <p><span className="text-white/45">UTR:</span> <span className="text-white">{payment.utrNumber}</span></p>
                          <p><span className="text-white/45">Amount:</span> <span className="text-white">₹{payment.amount.toLocaleString('en-IN')}</span></p>
                          <p><span className="text-white/45">Date:</span> <span className="text-white">{new Date(payment.paymentDate).toLocaleDateString()}</span></p>
                          <p><span className="text-white/45">Recorded By:</span> <span className="text-white">{payment.recordedBy?.fullName || payment.recordedBy?.email || '-'}</span></p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                        <span>Running Total</span>
                        <span>₹{loan.totalPaid.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/55">No payments recorded yet.</p>
                  )}
                </div>
              )}

              {paymentModal.loanId === loan._id ? (
                <div className="space-y-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-white">
                  <h3 className="font-semibold text-white">Record Payment</h3>

                  {paymentWarning && (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                      {paymentWarning}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">UTR Number</label>
                    <input
                      type="text"
                      value={paymentModal.utrNumber}
                      onChange={(e) =>
                        setPaymentModal({ ...paymentModal, utrNumber: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      placeholder="Unique Transaction Reference"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentModal.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      max={loan.outstandingBalance}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      placeholder={`Max: ₹${loan.outstandingBalance.toLocaleString('en-IN')}`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">Payment Date</label>
                    <input
                      type="date"
                      value={paymentModal.paymentDate}
                      onChange={(e) =>
                        setPaymentModal({ ...paymentModal, paymentDate: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRecordPayment}
                      disabled={processing}
                      className="flex-1 rounded-2xl bg-emerald-500 py-2 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {processing ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button
                      onClick={() =>
                        setPaymentModal({
                          loanId: null,
                          utrNumber: '',
                          amount: '',
                          paymentDate: new Date().toISOString().split('T')[0],
                        })
                      }
                      className="flex-1 rounded-2xl bg-white/10 py-2 text-white transition hover:bg-white/15"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPaymentModal({ ...paymentModal, loanId: loan._id })}
                  disabled={loan.outstandingBalance <= 0}
                  className="w-full rounded-2xl bg-white px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loan.outstandingBalance <= 0 ? 'Fully Paid' : 'Record Payment'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {paymentHistoryLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <button type="button" aria-label="Close payment history" className="absolute inset-0" onClick={() => setPaymentHistoryLoan(null)} />
          <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">Payment history</p>
                <h3 className="mt-1 text-2xl font-bold text-white">{paymentHistoryLoan.borrowerId?.fullName}</h3>
                <p className="text-white/60">Loan ID: {paymentHistoryLoan._id}</p>
              </div>
              <button type="button" onClick={() => setPaymentHistoryLoan(null)} className="rounded-full bg-white/5 p-2 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 max-h-[60vh] overflow-auto space-y-3 pr-1">
              {(paymentHistoryLoan.payments || []).length > 0 ? (
                (paymentHistoryLoan.payments || []).map((payment) => (
                  <div key={payment._id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
                    <p><span className="text-white/45">UTR:</span> <span className="text-white">{payment.utrNumber}</span></p>
                    <p><span className="text-white/45">Amount Paid:</span> <span className="text-white">₹{payment.amount.toLocaleString('en-IN')}</span></p>
                    <p><span className="text-white/45">Payment Date:</span> <span className="text-white">{new Date(payment.paymentDate).toLocaleDateString()}</span></p>
                    <p><span className="text-white/45">Recorded By:</span> <span className="text-white">{payment.recordedBy?.fullName || payment.recordedBy?.email || '-'}</span></p>
                  </div>
                ))
              ) : (
                <p className="text-white/60">No payments recorded for this loan.</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <span className="text-white/70">Running total</span>
              <span className="text-lg font-bold text-white">₹{filteredPaymentsTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
