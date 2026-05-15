'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import FinnexBrand from '@/components/FinnexBrand';
import image from '@/public/landingimage.png';

export default function Home() {
  const router = useRouter();

  const getRoleRedirectPath = (role: string) => {
    switch (role) {
      case 'borrower':
        return '/borrower/portal';
      case 'sales':
      case 'admin':
        return '/dashboard/sales';
      case 'sanction':
        return '/dashboard/sanction';
      case 'disbursement':
        return '/dashboard/disbursement';
      case 'collection':
        return '/dashboard/collection';
      default:
        return '/login';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const userData = JSON.parse(user);
      router.push(getRoleRedirectPath(userData.role));
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,1))] px-4">
      <div className="text-center text-white">
        <FinnexBrand className="justify-center" subtitle="Financial lending suite" />
        <p className="mt-6 text-xl text-white/75">Redirecting you...</p>
      </div>
    </div>
  );
}
