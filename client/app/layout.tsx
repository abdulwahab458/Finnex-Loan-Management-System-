import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import ToastProvider from '@/components/ToastProvider';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Finnex',
  description: 'Finnex is a complete loan management platform for borrowers and operations teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} bg-slate-950 text-slate-100`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
