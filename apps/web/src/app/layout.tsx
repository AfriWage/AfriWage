import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'AfriWage — Instant Payroll for African Gig Workers',
    template: '%s | AfriWage',
  },
  description:
    'Pay African gig workers instantly in USDC via Stellar with automatic local currency off-ramp. Borderless, transparent, and built on open-source infrastructure.',
  keywords: ['payroll', 'USDC', 'Stellar', 'Africa', 'gig workers', 'blockchain', 'crypto'],
  authors: [{ name: 'Adesanya Fuhad', url: 'https://github.com/K1NGD4VID' }],
  openGraph: {
    title: 'AfriWage — Instant Payroll for African Gig Workers',
    description: 'Borderless USDC payroll powered by Stellar',
    url: 'https://AfriWage.vercel.app',
    siteName: 'AfriWage',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriWage — Instant Payroll for African Gig Workers',
    description: 'Borderless USDC payroll powered by Stellar',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-brand-surface font-sans text-brand-on-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
