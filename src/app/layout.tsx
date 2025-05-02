// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/contexts/Web3Provider'; // Import the new provider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Multi-Org Payroll',
  description: 'Manage your organization payroll on-chain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
         {/* Use the new Web3Provider */}
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}