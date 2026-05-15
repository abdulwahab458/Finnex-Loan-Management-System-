'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';
import { ChevronLeft, ChevronRight, CreditCard, Landmark, LogOut, ShieldCheck, Users } from 'lucide-react';
import FinnexBrand from '@/components/FinnexBrand';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser: User = JSON.parse(userData);
    if (parsedUser.role === 'borrower') {
      router.push('/borrower/portal');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {
      // ignore
    }
    router.push('/login');
  };

  const getModuleLink = (module: string, userRole: string) => {
    const moduleMap: Record<string, string[]> = {
      sales: ['sales', 'admin'],
      sanction: ['sanction', 'admin'],
      disbursement: ['disbursement', 'admin'],
      collection: ['collection', 'admin'],
    };

    if (moduleMap[module]?.includes(userRole)) {
      return `/dashboard/${module}`;
    }

    return null;
  };

  if (!user) {
    return null;
  }

  const modules = ['sales', 'sanction', 'disbursement', 'collection'].filter((mod) =>
    getModuleLink(mod, user.role)
  );

  return (
    <div className="flex min-h-screen text-white">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] text-white backdrop-blur transition-all duration-300`}
      >
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            {sidebarOpen ? <FinnexBrand compact subtitle="Operations" /> : <div className="h-12 w-12" />}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition hover:bg-white/10"
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 py-6">
          {modules.map((module) => (
            <Link
              key={module}
              href={`/dashboard/${module}`}
              className={`flex items-center gap-3 px-6 py-3 transition ${
                pathname === `/dashboard/${module}` ? 'border-l-4 border-sky-300 bg-white/10' : 'hover:bg-white/5'
              }`}
              title={sidebarOpen ? '' : module.charAt(0).toUpperCase() + module.slice(1)}
            >
              <span className="text-xl text-sky-300">
                {module === 'sales' && <Users className="h-5 w-5" />}
                {module === 'sanction' && <ShieldCheck className="h-5 w-5" />}
                {module === 'disbursement' && <Landmark className="h-5 w-5" />}
                {module === 'collection' && <CreditCard className="h-5 w-5" />}
              </span>
              {sidebarOpen && <span>{module.charAt(0).toUpperCase() + module.slice(1)}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-6">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm text-white/50">Logged in as</p>
              <p className="truncate font-medium text-white">{user.fullName}</p>
              <p className="text-xs capitalize text-white/50">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-rose-500 px-4 py-2 font-medium text-white transition hover:bg-rose-400"
          >
            {sidebarOpen ? (
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </span>
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 p-6 backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">Operations console</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Dashboard</h2>
          </div>
          <div className="text-sm text-white/60">
            {user?.fullName} ({user?.role})
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
