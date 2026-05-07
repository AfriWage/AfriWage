import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Github,
  Globe2,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AfriWage — Instant, Borderless Payroll for African Gig Workers',
  description:
    'Pay African gig workers instantly in USDC via Stellar. No banks, no delays, no hidden fees. From employer wallet to worker bank account in seconds.',
};

const features = [
  {
    icon: Zap,
    title: 'Instant Settlement',
    description:
      'Payments settle on the Stellar network in 3–5 seconds — not 3–5 business days. Your workers get paid the moment you hit send.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: Globe2,
    title: 'Truly Borderless',
    description:
      'Send USDC to gig workers in Nigeria, Ghana, Kenya, or 50+ countries. No correspondent banks, no SWIFT fees, no FX markups.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: Shield,
    title: 'Fully Transparent',
    description:
      'Every payment is recorded on-chain and verifiable by anyone. Your workers can audit every transaction without trusting a middleman.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
];

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Connect Your Wallet',
    description:
      'Install Freighter, the official Stellar browser wallet. Connect it to AfriWage with one click — no account creation required.',
  },
  {
    number: '02',
    icon: DollarSign,
    title: 'Enter Payment Details',
    description:
      "Enter your worker's Stellar address and the USDC amount. Add an optional memo for invoice tracking. That's it.",
  },
  {
    number: '03',
    icon: Zap,
    title: 'Instant Delivery',
    description:
      'The payment hits the Stellar ledger in seconds. Workers can off-ramp to local currency via integrated anchors automatically.',
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
    <div className="min-h-screen bg-hero-gradient">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-stellar-blue/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
              <span className="text-sm font-bold text-white">RC</span>
            </div>
            <span className="text-lg font-bold text-white">AfriWage</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
              aria-label="View AfriWage on GitHub"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-brand-glow transition-all hover:scale-105"
            >
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 text-center">
        {/* Background glow */}
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            Live on Stellar Testnet
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Instant Payroll for <span className="text-gradient">African Gig Workers</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            AfriWage lets employers pay African freelancers and gig workers in USDC via Stellar,
            with automatic local currency off-ramp. No banks. No delays. No friction.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              id="cta-launch-app"
              className="flex items-center gap-2 rounded-2xl bg-brand-gradient px-8 py-4 text-base font-semibold text-white shadow-brand-glow transition-all hover:scale-105 hover:shadow-lg"
            >
              Launch App
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              id="cta-view-github"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mx-auto mt-20 max-w-3xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — ASCII flow */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
            The Flow
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-6 font-mono text-sm text-slate-300">
            <pre className="whitespace-pre text-left leading-loose">
              {`[Employer Wallet]
       │
       │  USDC payment (Stellar testnet)
       ▼
[Stellar Network]   ◄─── 3–5 second settlement
       │
       │  Automatic anchor off-ramp
       ▼
   [Anchor]          e.g. Bitget, Flutterwave
       │
       │  Local currency (NGN / GHS / KES / ZAR)
       ▼
[Worker Bank Account / Mobile Money]`}
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Why AfriWage
            </p>
            <h2 id="features-heading" className="text-4xl font-bold text-white">
              Built for speed, built for Africa
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-2xl border p-6 transition-all hover:shadow-card-hover ${feature.border} ${feature.bg} backdrop-blur-sm`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="bg-white/[0.02] px-6 py-24" aria-labelledby="steps-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Get Started
            </p>
            <h2 id="steps-heading" className="text-4xl font-bold text-white">
              Three steps to pay anywhere
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-6 hidden w-full border-t border-dashed border-white/10 md:block" />
                )}
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-4xl font-black text-white/10">{step.number}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="leading-relaxed text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-brand-gradient p-1">
          <div className="rounded-[calc(1.5rem-4px)] bg-stellar-blue/90 p-12 text-center backdrop-blur-xl">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to pay your team instantly?
            </h2>
            <p className="mb-8 text-slate-400">
              Connect your Freighter wallet and send your first USDC payment in under a minute.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                id="cta-bottom-launch"
                className="flex items-center gap-2 rounded-2xl bg-brand-gradient px-8 py-4 font-semibold text-white shadow-brand-glow transition-all hover:scale-105"
              >
                Launch App <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Free on Stellar testnet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
              <span className="text-xs font-bold text-white">RC</span>
            </div>
            <span className="font-semibold text-white">AfriWage</span>
            <span className="text-slate-600">·</span>
            <span className="text-sm text-slate-500">MIT License</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Dashboard
            </Link>
            <Link href="/worker" className="transition-colors hover:text-white">
              Worker Portal
            </Link>
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>

          <p className="text-xs text-slate-600">
            Built on{' '}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-white"
            >
              Stellar
            </a>{' '}
            · Powered by USDC
          </p>
        </div>
      </footer>
    </div>
  );
}
