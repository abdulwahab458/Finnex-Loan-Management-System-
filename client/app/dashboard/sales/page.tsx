'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Lead {
  _id: string;
  fullName: string;
  email: string;
  signupDate: string;
  profileStatus: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchLeads();
  }, [router]);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/dashboard/sales/leads');
      setLeads(response.data.leads || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'No Profile':
        return 'bg-gray-100 text-gray-800';
      case 'BRE Failed':
        return 'bg-red-100 text-red-800';
      case 'BRE Passed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Applied':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-white/50">Sales dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Sales Leads</h1>
        <p className="mt-2 text-white/65">Track all borrowers and their application status.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/65">
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white/65 shadow-2xl backdrop-blur">
          No leads found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-white/80">Name</th>
                <th className="px-6 py-4 font-semibold text-white/80">Email</th>
                <th className="px-6 py-4 font-semibold text-white/80">Signup Date</th>
                <th className="px-6 py-4 font-semibold text-white/80">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => (
                <tr key={lead._id} className="transition hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{lead.fullName}</td>
                  <td className="px-6 py-4 text-white/70">{lead.email}</td>
                  <td className="px-6 py-4 text-white/70">
                    {new Date(lead.signupDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(lead.profileStatus)}`}>
                      {lead.profileStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
