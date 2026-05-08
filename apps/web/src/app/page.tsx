import {
  ArrowRight,
  CheckCircle,
  Github,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Globe2, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AfriWage — Modern Payroll Built for Africa',
  description:
    'Pay African gig workers instantly in USDC via Stellar. No banks, no delays, no hidden fees. From employer wallet to worker bank account in seconds.',
};

const features = [
  {
    icon: Zap,
    title: 'Instant Settlement',
    description:
      'Payments settle on the Stellar network in 3–5 seconds — not 3–5 business days. Your workers get paid the moment you hit send.',
  },
  {
    icon: Globe2,
    title: 'Truly Borderless',
    description:
      'Send USDC to gig workers in Nigeria, Ghana, Kenya, or 50+ countries. No correspondent banks, no SWIFT fees, no FX markups.',
  },
  {
    icon: Shield,
    title: 'Fully Transparent',
    description:
      'Every payment is recorded on-chain and verifiable by anyone. Your workers can audit every transaction without trusting a middleman.',
  },
];

const stats = [
  { label: 'Settlement Time', value: '< 5s' },
  { label: 'Transaction Fee', value: '~$0.0001' },
  { label: 'Supported Countries', value: '8+' },
  { label: 'Network', value: 'Stellar' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-surface selection:bg-brand-primary/10 selection:text-brand-primary">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-brand-outline-variant bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary shadow-lg shadow-brand-primary/20">
              <span className="font-mono text-lg font-black text-white">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-navy">AfriWage</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-brand-secondary transition-colors hover:text-brand-primary"
            >
              <Github className="h-5 w-5" />
              OSS
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-brand-navy/20 transition-all hover:scale-105 active:scale-95"
            >
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-32 pt-24">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-primary/5 blur-[120px]" />
        
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-widest text-brand-primary">
            <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
            Live on Stellar Testnet
          </div>

          <h1 className="mb-8 text-5xl font-black leading-[1.1] tracking-tight text-brand-navy md:text-7xl lg:text-8xl">
            Modern Payroll <br/>
            <span className="text-brand-primary">Built for Africa</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-brand-secondary md:text-xl">
            AfriWage empowers global employers to pay African freelancers and teams in USDC instantly. 
            No banks, no borders, just code.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-2xl bg-brand-primary px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-brand-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Now
              <ArrowRight className="h-6 w-6" />
            </Link>
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border-2 border-brand-navy/5 bg-white px-10 py-5 text-lg font-bold text-brand-navy transition-all hover:bg-brand-surface hover:border-brand-navy/10"
            >
              <Github className="h-6 w-6" />
              Documentation
            </a>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="relative mx-auto mt-24 max-w-4xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="tonal-card rounded-2xl p-6 text-center"
              >
                <p className="font-mono text-3xl font-black text-brand-navy">{stat.value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Flow - Technical Showcase */}
      <section className="border-y border-brand-outline-variant bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-brand-navy">The Settlement Layer</h2>
            <p className="mt-4 font-medium text-brand-secondary">Leveraging Stellar's global anchor network for instant liquidity.</p>
          </div>
          
          <div className="overflow-hidden rounded-3xl border border-brand-outline-variant bg-brand-navy p-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-4 font-mono text-xs text-white/40 uppercase tracking-widest">protocol_flow.sh</span>
            </div>
            <div className="overflow-x-auto font-mono text-sm leading-relaxed text-brand-primary">
              <pre className="whitespace-pre">
                {`[Employer_Wallet]
       │
       │  payload: { asset: "USDC", amount: "1000.00" }
       ▼
[Stellar_Mainnet]   ◄─── consensus reached in < 5s
       │
       │  atomic_swap: { type: "USDC_to_Local" }
       ▼
    [SEP-24_Anchor]  ◄─── automatic off-ramp integration
       │
       │  transfer: { currency: "NGN", destination: "Bank" }
       ▼
[African_Professional]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="tonal-card group rounded-[32px] p-10 transition-all hover:-translate-y-2"
              >
                <div
                  className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 transition-colors group-hover:bg-brand-primary"
                >
                  <feature.icon className="h-8 w-8 text-brand-primary transition-colors group-hover:text-white" />
                </div>
                <h3 className="mb-4 text-2xl font-black text-brand-navy">{feature.title}</h3>
                <p className="font-medium leading-relaxed text-brand-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[48px] bg-brand-navy p-1 shadow-2xl">
          <div className="relative rounded-[47px] bg-brand-surface p-12 text-center md:p-24 overflow-hidden">
            {/* Abstract Background for CTA */}
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-primary/10 blur-[100px]" />
            
            <div className="relative z-10">
              <h2 className="mb-6 text-4xl font-black text-brand-navy md:text-5xl">
                Ready to scale your <br/>
                African workforce?
              </h2>
              <p className="mx-auto mb-12 max-w-xl font-medium text-brand-secondary">
                Join the future of borderless employment. Connect your wallet and start paying your team the right way.
              </p>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-2xl bg-brand-primary px-10 py-5 text-lg font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  Enter Dashboard <ArrowRight className="h-6 w-6" />
                </Link>
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-brand-secondary">
                  <CheckCircle className="h-5 w-5 text-brand-primary" />
                  Stellar Powered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-outline-variant bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl grid gap-12 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy">
                <span className="font-mono text-sm font-black text-white">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-brand-navy">AfriWage</span>
            </div>
            <p className="max-w-xs font-medium text-brand-secondary leading-relaxed">
              Modernizing African payroll through blockchain technology and borderless settlement.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-black uppercase tracking-widest text-brand-navy">Platform</h4>
            <ul className="space-y-4 font-bold text-brand-secondary">
              <li><Link href="/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/worker" className="hover:text-brand-primary transition-colors">Worker Portal</Link></li>
              <li><a href="https://freighter.app" target="_blank" className="hover:text-brand-primary transition-colors">Get Wallet</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-black uppercase tracking-widest text-brand-navy">Community</h4>
            <ul className="space-y-4 font-bold text-brand-secondary">
              <li><a href="https://github.com/AfriWage/AfriWage" target="_blank" className="hover:text-brand-primary transition-colors">GitHub</a></li>
              <li><a href="https://stellar.org" target="_blank" className="hover:text-brand-primary transition-colors">Stellar Network</a></li>
              <li><span className="opacity-50">MIT License</span></li>
            </ul>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl mt-20 pt-8 border-t border-brand-outline-variant flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-secondary opacity-40">
            © 2026 AfriWage Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-brand-primary uppercase tracking-tighter">
              v1.10.0-stable
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
