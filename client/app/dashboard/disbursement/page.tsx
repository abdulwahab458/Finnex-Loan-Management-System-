'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loan } from '@/types';
import { Search, Download, FileText, X, Check } from 'lucide-react';

export default function DisbursementPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<(Loan & { borrowerId: any; sanctionedBy: any })[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [confirmLoan, setConfirmLoan] = useState<any>(null);

  type FetchLoanOptions = {
    nextTab?: 'pending' | 'history';
    nextSearchTerm?: string;
    nextStartDate?: string;
    nextEndDate?: string;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchLoans({ nextTab: 'pending' });
  }, [router]);

  const fetchLoans = async (options?: FetchLoanOptions) => {
    const effectiveTab = options?.nextTab ?? tab;
    const effectiveSearchTerm = options?.nextSearchTerm ?? searchTerm;
    const effectiveStartDate = options?.nextStartDate ?? startDate;
    const effectiveEndDate = options?.nextEndDate ?? endDate;

    setLoading(true);
    setError('');

    try {
      const params: any = { tab: effectiveTab === 'history' ? 'history' : 'pending' };
      if (effectiveSearchTerm.trim()) params.search = effectiveSearchTerm.trim();
      if (effectiveStartDate) params.startDate = effectiveStartDate;
      if (effectiveEndDate) params.endDate = effectiveEndDate;

      const response = await api.get('/dashboard/disbursement/loans', { params });
      setLoans(response.data.loans || []);
      setSummary(response.data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching loans');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (loanId: string) => {
    setProcessing(loanId);
    try {
      await api.patch(`/loans/${loanId}/disburse`);
      fetchLoans();
      setProcessing(null);
      setConfirmLoan(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error disbursing loan');
      setProcessing(null);
      setConfirmLoan(null);
    }
  };

  const exportCsv = () => {
    if (!loans) return;
    const headers = [
      'Loan ID',
      'Borrower Name',
      'Loan Amount',
      'Total Repayment',
      'Status',
      'Sanctioned Date',
      'Disbursed Date',
      'Sanctioned By',
      'Disbursed By',
      'Salary Slip',
    ];

    const rows = loans.map((l: any) => [
      l._id,
      l.borrowerId?.fullName || '',
      l.loanAmount || 0,
      l.totalRepayment || 0,
      l.status || '',
      l.sanctionedAt ? new Date(l.sanctionedAt).toISOString() : '',
      l.disbursedAt ? new Date(l.disbursedAt).toISOString() : '',
      l.sanctionedBy?.fullName || '',
      l.disbursedBy?.fullName || '',
      l.profileId?.salarySlipUrl || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disbursement_${tab}_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/65">Loading loans...</div>
      );
    }

    if (!loans || loans.length === 0) {
      return (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white/65 shadow-2xl backdrop-blur">No sanctioned loans to disburse</div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur mt-4">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Borrower</th>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Loan Amount</th>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Tenure</th>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Total Repayment</th>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Sanctioned Date</th>
              <th className="px-6 py-4 text-left font-semibold text-white/80">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loans.map((loan) => (
              <tr key={loan._id} className="transition hover:bg-white/5 cursor-pointer" onClick={() => setSelectedLoan(loan)}>
                <td className="px-6 py-4 font-medium text-white">{loan.borrowerId?.fullName}</td>
                <td className="px-6 py-4 text-white/75">₹{(loan.loanAmount||0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-white/75">{loan.tenure} days</td>
                <td className="px-6 py-4 font-semibold text-sky-300">₹{(loan.totalRepayment||0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-sm text-white/65">{loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4">
                  {tab === 'pending' ? (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmLoan(loan); }} disabled={processing === loan._id} className="rounded-2xl bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50">
                      {processing === loan._id ? 'Disbursing...' : 'Disburse'}
                    </button>
                  ) : (
                    <span className="text-white/60">{loan.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-white/50">Disbursement dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Loan Disbursement</h1>
        <p className="mt-2 text-white/65">Disburse sanctioned loans to borrowers.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white/3 p-4">
            <div className="text-sm text-white/60">Total Loans Pending Disbursement</div>
            <div className="text-2xl font-bold text-white mt-2">{summary?.totalLoansPending ?? '-'}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-4">
            <div className="text-sm text-white/60">Total Amount to be Disbursed Today</div>
            <div className="text-2xl font-bold text-sky-300 mt-2">₹{(summary?.totalAmountToDisburseToday || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-4">
            <div className="text-sm text-white/60">Total Loans Disbursed This Month</div>
            <div className="text-2xl font-bold text-white mt-2">{summary?.totalLoansDisbursedThisMonth ?? 0}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-4">
            <div className="text-sm text-white/60">Total Amount Disbursed This Month</div>
            <div className="text-2xl font-bold text-sky-300 mt-2">₹{(summary?.totalAmountDisbursedThisMonth || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchLoans();
                  }
                }}
                placeholder="Search by borrower or loan ID"
                className="w-full rounded-lg bg-white/5 px-4 py-2 text-white placeholder-white/50"
              />
              <div className="absolute right-3 top-2 text-white/50"><Search className="h-4 w-4" /></div>
            </div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-white" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-white" />
            <button onClick={() => fetchLoans()} className="rounded-lg bg-sky-600 px-3 py-2 text-white">Filter</button>
            <button
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                fetchLoans({ nextSearchTerm: '', nextStartDate: '', nextEndDate: '' });
              }}
              className="rounded-lg bg-white/6 px-3 py-2 text-white"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="space-x-2">
            <button
              onClick={() => {
                setTab('pending');
                fetchLoans({ nextTab: 'pending' });
              }}
              className={`px-3 py-2 rounded-lg ${tab==='pending'?'bg-sky-600':'bg-white/5'}`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setTab('history');
                fetchLoans({ nextTab: 'history' });
              }}
              className={`px-3 py-2 rounded-lg ${tab==='history'?'bg-sky-600':'bg-white/5'}`}
            >
              History
            </button>
          </div>
          <button onClick={exportCsv} className="rounded-lg bg-white/5 px-3 py-2 text-white inline-flex items-center gap-2"><Download className="h-4 w-4"/> Export</button>
        </div>
      </div>

      {renderContent()}

      {/* Detail Drawer */}
      {selectedLoan && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-white/5 border-l border-white/10 p-6 backdrop-blur z-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Loan Details</h3>
            <button onClick={() => setSelectedLoan(null)} className="text-white/60"><X className="h-5 w-5"/></button>
          </div>
          <div className="mt-4 space-y-3 text-white/80">
            <div><span className="font-medium">Borrower:</span> {selectedLoan.borrowerId?.fullName}</div>
            <div><span className="font-medium">PAN:</span> {selectedLoan.profileId?.pan || '-'}</div>
            <div><span className="font-medium">Monthly Salary:</span> ₹{selectedLoan.profileId?.monthlySalary || '-'}</div>
            <div><span className="font-medium">Employment:</span> {selectedLoan.profileId?.employmentMode || '-'}</div>
            <div><span className="font-medium">Loan Amount:</span> ₹{(selectedLoan.loanAmount||0).toLocaleString('en-IN')}</div>
            <div><span className="font-medium">Tenure:</span> {selectedLoan.tenure} days</div>
            <div><span className="font-medium">Interest Rate:</span> {selectedLoan.interestRate}%</div>
            <div><span className="font-medium">Simple Interest:</span> ₹{(selectedLoan.simpleInterest||0).toLocaleString('en-IN')}</div>
            <div><span className="font-medium">Total Repayment:</span> ₹{(selectedLoan.totalRepayment||0).toLocaleString('en-IN')}</div>
            <div><span className="font-medium">Sanction Date:</span> {selectedLoan.sanctionedAt ? new Date(selectedLoan.sanctionedAt).toLocaleString() : '-'}</div>
            <div><span className="font-medium">Sanctioned By:</span> {selectedLoan.sanctionedBy?.fullName || '-'}</div>
            <div className="mt-3">
              <a href={selectedLoan.profileId?.salarySlipUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white/6 px-3 py-2 text-white">
                <FileText className="h-4 w-4"/> View Salary Slip
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmLoan && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmLoan(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setConfirmLoan(null); }}
          />
          <div className="relative rounded-lg bg-white/5 p-6 w-[480px] border border-white/10">
            <h3 className="text-lg font-bold text-white">Confirm Disbursement</h3>
            <p className="text-white/75 mt-2">Please confirm before disbursing the loan.</p>
            <div className="mt-4 text-white/80">
              <div><span className="font-medium">Borrower:</span> {confirmLoan.borrowerId?.fullName}</div>
              <div><span className="font-medium">Loan Amount:</span> ₹{(confirmLoan.loanAmount||0).toLocaleString('en-IN')}</div>
              <div><span className="font-medium">Total Repayment:</span> ₹{(confirmLoan.totalRepayment||0).toLocaleString('en-IN')}</div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmLoan(null)} className="rounded-lg bg-white/6 px-4 py-2 text-white">Cancel</button>
              <button onClick={() => handleDisburse(confirmLoan._id)} disabled={processing===confirmLoan._id} className="rounded-lg bg-emerald-500 px-4 py-2 text-white inline-flex items-center gap-2">{processing===confirmLoan._id ? 'Disbursing...' : <>Confirm Disburse <Check className="h-4 w-4"/></>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
