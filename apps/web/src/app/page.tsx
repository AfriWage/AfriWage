import {
  ArrowRight,
  Banknote,
  Blocks,
  CheckCircle2,
  Circle,
  Code2,
  Github,
  Globe2,
  Layers3,
  Link2,
  MonitorSmartphone,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SUPPORTED_COUNTRIES } from '@/types';

export const metadata: Metadata = {
  title: 'AfriWage - Pay Your African Team',
  description:
    'Send USDC via Stellar directly to local bank accounts or mobile money wallets in Africa with near-zero fees and instant settlement.',
};

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Developers', href: '#developers' },
  { label: 'Pricing', href: '#pricing' },
];

const stats = [
  { value: '< 5s', label: 'Avg Settlement Time' },
  { value: '~$0.0001', label: 'Network Fee per Tx' },
  { value: '8+', label: 'African Countries' },
  { value: '100%', label: 'On-chain Verifiable' },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Settlement',
    description:
      'USDC payroll settles on Stellar in seconds instead of waiting through multi-day wire transfers.',
  },
  {
    icon: Globe2,
    title: 'Local Currency Delivery',
    description:
      'Workers receive value through local payout rails across NGN, GHS, KES, ZAR, TZS, UGX, XOF, and XAF corridors.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent by Default',
    description:
      'Each payment is traceable on-chain, with public transaction history and proof-of-payment support.',
  },
  {
    icon: Wallet,
    title: 'Freighter Wallet Connect',
    description:
      'The app already supports one-click Freighter connection, balance display, and transaction signing on Stellar testnet.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Employer and Worker Views',
    description:
      'AfriWage ships with a dashboard for payroll operations and a worker passport for payment verification.',
  },
  {
    icon: Code2,
    title: 'Open SDK and App',
    description:
      'The monorepo includes the web app plus @AfriWage/sdk for reusable Stellar payroll helpers.',
  },
];

const flowSteps = [
  'Employer connects a Stellar-compatible wallet and funds payroll in USDC.',
  'AfriWage creates and submits the payment through the Stellar network.',
  'Settlement completes on testnet in roughly 3 to 5 seconds.',
  'Integrated off-ramp rails deliver local currency to the worker account or wallet.',
];

const platformFacts = [
  { label: 'Frontend', value: 'Next.js 14 App Router' },
  { label: 'Language', value: 'TypeScript strict mode' },
  { label: 'Network', value: 'Stellar testnet' },
  { label: 'Asset', value: 'USDC' },
  { label: 'Wallet', value: 'Freighter' },
  { label: 'Data', value: 'Horizon API + React Query' },
];

const faqs = [
  {
    question: 'Which countries are currently represented in the product?',
    answer:
      'The current codebase exposes payout corridors for Nigeria, Ghana, Kenya, South Africa, Tanzania, Uganda, Senegal, and Cameroon.',
  },
  {
    question: 'What wallets work with AfriWage today?',
    answer:
      'The implemented wallet flow in this repo is built around the Freighter browser extension for Stellar accounts.',
  },
  {
    question: 'Is the current app on mainnet or testnet?',
    answer:
      'This project is currently wired for Stellar testnet. The README, environment defaults, and SDK constants all point to testnet infrastructure.',
  },
  {
    question: 'What is included for developers?',
    answer:
      'The repository includes the Next.js frontend, worker portal, dashboard flows, and a standalone SDK package with Stellar account and payment helpers.',
  },
];

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Supported Countries', href: '#countries' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'GitHub', href: 'https://github.com/AfriWage/AfriWage' },
      { label: 'SDK Package', href: '#developers' },
      { label: 'Documentation', href: 'https://k1ngd4vid.gitbook.io/afriwage-docs' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Freighter Wallet', href: 'https://freighter.app' },
    ],
  },
];

function isExternal(href: string) {
  return href.startsWith('http');
}

function FooterLink({ href, label }: { href: string; label: string }) {
  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body-sm text-body-sm text-secondary-fixed-dim transition-colors duration-150 hover:text-surface hover:underline"
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="font-body-sm text-body-sm text-secondary-fixed-dim transition-colors duration-150 hover:text-surface hover:underline"
    >
      {label}
    </a>
  );
}

export default function HomePage() {
  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-outline-variant bg-surface/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-on-surface transition-opacity duration-150 hover:opacity-80 active:scale-95"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container">
              <Banknote className="h-4 w-4 text-on-primary-container" />
            </div>
            <span className="font-h3 text-h3">AfriWage</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-body text-secondary transition-all duration-150 hover:text-primary hover:opacity-80 active:scale-95"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-3 text-body text-on-primary transition-opacity duration-150 hover:opacity-80 active:scale-95"
          >
            Launch App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-background pt-20 text-on-surface">
        <section
          id="how-it-works"
          className="relative overflow-hidden bg-inverse-surface px-6 py-24 lg:px-8"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_70%_30%,#14A800_0%,transparent_50%)]" />
          </div>

          <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="relative z-10">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-inverse-surface/50 px-4 py-2 backdrop-blur-sm">
                <Circle className="h-2 w-2 fill-primary-fixed text-primary-fixed" />
                <span className="font-label-mono text-label-mono text-surface">
                  Live on Stellar Testnet
                </span>
              </div>

              <h1 className="mb-6 max-w-3xl font-h1 text-[44px] leading-[1.05] text-surface sm:text-[56px] lg:text-[64px]">
                Pay Your African Team
                <br />
                <span className="text-primary-fixed">In Under 5 Seconds.</span>
              </h1>

              <p className="mb-10 max-w-xl font-body text-body text-surface-dim">
                AfriWage lets global employers send USDC over Stellar and route value
                into local African payout corridors with low fees, fast settlement,
                and verifiable payment records.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg bg-primary-container px-6 py-3 text-body text-on-primary transition-opacity duration-150 hover:opacity-80 active:scale-95"
                >
                  Launch App
                </Link>

                <a
                  href="https://github.com/AfriWage/AfriWage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-6 py-3 text-body text-surface transition-colors duration-150 hover:bg-surface-variant/10 active:scale-95"
                >
                  <Code2 className="h-5 w-5" />
                  View on GitHub
                </a>
              </div>
            </div>

            <div className="relative z-10 flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface/50 p-8 shadow-2xl backdrop-blur-md">
              <div className="relative w-full max-w-md rotate-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl transition-transform duration-500 hover:rotate-0">
                <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10">
                      <Send className="h-5 w-5 text-primary-container" />
                    </div>
                    <div>
                      <div className="font-body text-body font-semibold text-on-surface">
                        Payment Sent
                      </div>
                      <div className="font-label-mono text-label-mono text-secondary">
                        To: Contractor NGN
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-label-mono text-label-mono font-semibold text-primary-container">
                      + 412,500 NGN
                    </div>
                    <div className="font-label-mono text-label-mono text-secondary">
                      - 250 USDC
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Network Fee
                    </span>
                    <span className="font-label-mono text-label-mono text-on-surface">
                      ~0.0001 XLM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Settlement Time
                    </span>
                    <span className="rounded bg-primary-container/10 px-2 py-1 font-label-mono text-label-mono text-primary-container">
                      4.2s
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-body-sm text-body-sm text-secondary">
                      Status
                    </span>
                    <span className="font-label-mono text-label-mono text-primary-container">
                      Delivered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="relative z-20 mx-6 -mt-8 max-w-[1280px] rounded-xl border border-outline-variant bg-surface-container-lowest py-12 shadow-sm lg:mx-auto lg:px-0"
        >
          <div className="grid grid-cols-2 gap-8 divide-y divide-outline-variant/30 md:grid-cols-4 md:divide-x md:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="p-4 text-center">
                <div className="mb-2 font-h2 text-[32px] leading-none text-primary-container md:text-h2">
                  {stat.value}
                </div>
                <div className="font-body-sm text-body-sm text-secondary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-16 max-w-2xl">
              <h2 className="mb-4 font-h2 text-h2 text-on-surface">
                Built for cross-border payroll operations
              </h2>
              <p className="font-body text-body text-secondary">
                The current product already includes the core pieces employers and
                contractors need: wallet connection, payment sending, balances,
                transaction history, and worker verification.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-outline-variant bg-surface-container-low p-8 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-container/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-4 font-h3 text-h3 text-on-surface">
                    {feature.title}
                  </h3>
                  <p className="font-body text-body text-secondary">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant bg-surface-container-highest/30 px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <p className="mb-10 text-center font-label-mono text-label-mono uppercase tracking-widest text-secondary">
              Platform Foundations
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {[
                'Next.js 14',
                'TypeScript',
                'Stellar',
                'USDC',
                'Freighter',
                'Open Source',
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-3 text-secondary"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-body-sm text-body-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="countries" className="bg-background px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="mb-4 font-h2 text-h2 text-on-surface">
                  Supported payout corridors
                </h2>
                <p className="font-body text-body text-secondary">
                  The web app currently exposes eight supported countries and local
                  currencies for African off-ramp flows in the product model.
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4">
                <div className="font-label-mono text-label-mono text-secondary">
                  Corridors
                </div>
                <div className="mt-1 font-h3 text-h3 text-primary-container">8 active</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {SUPPORTED_COUNTRIES.map((country) => (
                <div
                  key={country.code}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm"
                >
                  <div className="text-4xl leading-none">{country.flag}</div>
                  <div className="mt-4 font-body text-body font-semibold text-on-surface">
                    {country.name}
                  </div>
                  <div className="mt-1 font-label-mono text-label-mono text-primary-container">
                    {country.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low px-6 py-24 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="mb-4 font-h2 text-h2 text-on-surface">
                How the settlement flow works
              </h2>
              <p className="mb-10 max-w-2xl font-body text-body text-secondary">
                The repo documentation describes a clean path from employer wallet to
                Stellar settlement and local payout delivery. This section turns that
                flow into something readable on the landing page.
              </p>

              <div className="space-y-5">
                {flowSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-sm font-semibold text-on-primary">
                      0{index + 1}
                    </div>
                    <p className="pt-2 font-body text-body text-on-surface">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface p-8 shadow-xl">
              <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 font-label-mono text-label-mono uppercase text-surface-dim">
                  settlement-flow
                </span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-primary-fixed">
{`[Employer Wallet]
   |
   |  Send USDC payroll
   v
[Stellar Network]
   |
   |  3-5 second settlement
   v
[Anchor / Off-ramp Rail]
   |
   |  Convert to local currency
   v
[Bank Account / Mobile Money]`}
              </pre>
            </div>
          </div>
        </section>

        <section id="developers" className="bg-background px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-16 max-w-2xl">
              <h2 className="mb-4 font-h2 text-h2 text-on-surface">
                Developer-ready from the first commit
              </h2>
              <p className="font-body text-body text-secondary">
                AfriWage is not just a concept page. The repository already includes a
                web app, dashboard routes, worker passport views, wallet integration,
                and a reusable SDK package.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm lg:col-span-2">
                <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {platformFacts.map((fact) => (
                    <div key={fact.label} className="rounded-lg bg-surface-container-low p-5">
                      <div className="font-label-mono text-label-mono text-secondary">
                        {fact.label}
                      </div>
                      <div className="mt-2 font-body text-body font-semibold text-on-surface">
                        {fact.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-outline-variant p-5">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <Layers3 className="h-5 w-5" />
                      <span className="font-label-mono text-label-mono uppercase">
                        App
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Dashboard, wallet, send, worker, transactions, and settings
                      routes are already present in the monorepo.
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant p-5">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <Blocks className="h-5 w-5" />
                      <span className="font-label-mono text-label-mono uppercase">
                        SDK
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary">
                      The SDK includes account creation, testnet funding, balances,
                      trustlines, and payment helpers.
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant p-5">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <Link2 className="h-5 w-5" />
                      <span className="font-label-mono text-label-mono uppercase">
                        Infra
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Environment defaults are set for public testnet usage, Horizon,
                      and client-side app bootstrapping.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-on-surface p-8 text-surface shadow-sm">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
                  <Github className="h-4 w-4 text-primary-fixed" />
                  <span className="font-label-mono text-label-mono text-surface">
                    Open Source
                  </span>
                </div>
                <h3 className="mb-4 font-h3 text-h3">Ship with the codebase you already have</h3>
                <p className="mb-8 font-body text-body text-surface-dim">
                  Use the dashboard for operations, the worker portal for proof of
                  payment, and the SDK as the base for deeper payroll automation.
                </p>
                <div className="space-y-3">
                  <a
                    href="https://github.com/AfriWage/AfriWage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <span>GitHub Repository</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="https://k1ngd4vid.gitbook.io/afriwage-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <span>Documentation</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <span>Get Freighter</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-surface-container-low px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-16 max-w-2xl">
              <h2 className="mb-4 font-h2 text-h2 text-on-surface">Simple pricing posture</h2>
              <p className="font-body text-body text-secondary">
                The repo does not define commercial plans yet, so the landing page
                should be explicit: the product is open source, the network fee is
                negligible, and production pricing is still to be announced.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-4 font-label-mono text-label-mono uppercase text-secondary">
                  Open Source
                </div>
                <div className="mb-4 font-h2 text-h2 text-on-surface">Free</div>
                <p className="mb-8 font-body text-body text-secondary">
                  Explore the codebase, run the testnet flow locally, and build on top
                  of the SDK and app routes today.
                </p>
                <ul className="space-y-3 text-secondary">
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />MIT licensed repository</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />Next.js web app included</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />SDK package included</li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary-container bg-primary-container p-8 text-on-primary shadow-sm">
                <div className="mb-4 font-label-mono text-label-mono uppercase text-on-primary">
                  Network Cost
                </div>
                <div className="mb-4 font-h2 text-h2">~$0.0001</div>
                <p className="mb-8 font-body text-body text-on-primary">
                  Stellar network fees are effectively negligible for payroll transfer
                  execution compared with legacy wire overhead.
                </p>
                <ul className="space-y-3 text-on-primary">
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />Sub-cent settlement cost</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />Fast finality</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />Transparent on-chain records</li>
                </ul>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-4 font-label-mono text-label-mono uppercase text-secondary">
                  Production Rollout
                </div>
                <div className="mb-4 font-h2 text-h2 text-on-surface">Custom</div>
                <p className="mb-8 font-body text-body text-secondary">
                  Mainnet commercial packaging, compliance layers, and operational
                  pricing have not been published in this repository yet.
                </p>
                <ul className="space-y-3 text-secondary">
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />Testnet-first today</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />Clear room for enterprise rollout</li>
                  <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />Pricing to be announced</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-background px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-h2 text-h2 text-on-surface">
                Frequently asked questions
              </h2>
              <p className="font-body text-body text-secondary">
                Answers based on the current repository, not placeholder marketing copy.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
                  open={index === 0}
                >
                  <summary className="cursor-pointer list-none p-6 font-body text-body font-semibold text-on-surface transition-colors hover:bg-surface-container">
                    {faq.question}
                  </summary>
                  <div className="px-6 pb-6 font-body text-body text-secondary">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-on-secondary-fixed-variant bg-on-surface">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-2 text-h3 text-surface">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-on-surface">
                <Banknote className="h-4 w-4" />
              </div>
              <span className="font-h3">AfriWage</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
              2026 AfriWage. Built on Stellar testnet infrastructure.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="mb-2 font-body text-body font-semibold text-surface">
                {column.title}
              </span>
              {column.links.map((link) => (
                <FooterLink key={link.label} href={link.href} label={link.label} />
              ))}
            </div>
          ))}
        </div>

        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 border-t border-on-secondary-fixed-variant px-6 py-6 md:flex-row md:items-center lg:px-8">
          <p className="font-label-mono text-[11px] uppercase text-secondary-fixed-dim">
            Copyright 2026 AfriWage. Borderless payroll for African teams.
          </p>
          <a
            href="https://github.com/AfriWage/AfriWage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-label-mono text-[11px] uppercase text-primary-fixed transition-opacity hover:opacity-80"
          >
            <Github className="h-4 w-4" />
            Open Source
          </a>
        </div>
      </footer>
    </>
  );
}
