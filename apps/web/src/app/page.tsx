import { ArrowRight, Globe2, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PaymentFlowPreview } from '@/components/PaymentFlowPreview';
import { SUPPORTED_COUNTRIES } from '@/types';

export const metadata: Metadata = {
  title: 'AfriWage - Borderless payroll for African teams',
  description:
    'Send payroll over Stellar and deliver to local African payout corridors with clear transaction visibility.',
};

const navLinks = [
  { label: 'Corridors', href: '#corridors' },
  { label: 'Flow', href: '#flow' },
];

const features = [
  {
    icon: Zap,
    title: 'Instant settlement',
    description:
      'Payouts settle in seconds on Stellar instead of waiting on multi-day wire cycles.',
  },
  {
    icon: Globe2,
    title: 'Corridor-native delivery',
    description: 'Route value into NGN, GHS, KES, ZAR, TZS, UGX, XOF, and XAF payout corridors.',
  },
  {
    icon: ShieldCheck,
    title: 'Proof for every transfer',
    description: 'Every transfer has an on-chain receipt your team can verify anytime.',
  },
];

const flowSteps = [
  'Fund your payroll wallet.',
  'Select recipients and amounts.',
  'Sign and submit through Stellar.',
  'Deliver through local payout rails with transaction proof.',
];

const heroExplainers = [
  'Treasury funds payroll once.',
  'Stellar settles the movement in seconds.',
  'Local corridors deliver value in familiar currencies.',
];

function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#E5E7EB] bg-white p-6 ${className}`}>{children}</div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <nav className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14A800] text-white">
              <span className="text-sm font-semibold">A</span>
            </div>
            <p className="text-base font-semibold text-[#111111]">AfriWage</p>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#14A800] px-5 text-sm font-semibold text-white"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <main>
        <section className="bg-[#0A0A0A] px-4">
          <div className="mx-auto w-full max-w-[1080px] pb-24 pt-[120px]">
            <div className="inline-flex items-center rounded-[100px] bg-[#F0FDF4] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#14A800]">
              Live on Stellar testnet
            </div>
            <h1 className="mt-6 max-w-4xl text-[52px] font-bold leading-[1.06] tracking-[-0.03em] text-white">
              Cross-border payroll that is clear, fast, and accountable.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-normal leading-[1.7] text-[#9CA3AF]">
              Send payroll over Stellar and deliver through local payout corridors across Africa.
              Every transfer comes with a verifiable on-chain record.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#14A800] px-5 text-sm font-semibold text-white"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 md:max-w-3xl md:grid-cols-3">
              {heroExplainers.map((item, index) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <PaymentFlowPreview />
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-white/5 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                  Settlement
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">Seconds, not days</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                  Coverage
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">8 payout corridors</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                  Proof
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">On-chain receipts</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24" id="corridors">
          <div className="mx-auto w-full max-w-[1080px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
                Corridors
              </p>
              <h2 className="mt-3 text-4xl font-bold text-[#111111]">
                Payout coverage comes first
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-[#6B7280]">
                Route payroll to supported local corridors without leaving your payout workflow.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {SUPPORTED_COUNTRIES.map((country) => (
                <Surface key={country.code} className="text-center">
                  <div className="text-5xl leading-none">{country.flag}</div>
                  <p className="mt-4 text-lg font-semibold text-[#111111]">{country.name}</p>
                  <p className="mt-1 font-mono text-sm text-[#14A800]">{country.currency}</p>
                </Surface>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24">
          <div className="mx-auto w-full max-w-[1080px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
                Why AfriWage
              </p>
              <h2 className="mt-3 text-4xl font-bold text-[#111111]">
                Built for clean payout execution
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Surface key={feature.title}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#14A800]">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-[20px] font-semibold text-[#111111]">{feature.title}</h3>
                  <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
                    {feature.description}
                  </p>
                </Surface>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24" id="flow">
          <div className="mx-auto grid w-full max-w-[1080px] gap-6 lg:grid-cols-[1fr_0.95fr]">
            <Surface>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
                Flow
              </p>
              <h2 className="mt-3 text-4xl font-bold text-[#111111]">Simple payout path</h2>
              <div className="mt-8 space-y-4">
                {flowSteps.map((step, index) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <p className="pt-2 text-base leading-[1.7] text-[#6B7280]">{step}</p>
                  </div>
                ))}
              </div>
            </Surface>

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
                Product note
              </p>
              <p className="mt-4 text-base leading-[1.7] text-[#6B7280]">
                AfriWage is focused on one job: helping operators move payroll from treasury to
                local payout corridors with fewer delays and clearer proof.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#14A800] px-5 text-sm font-semibold text-white"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E7EB] px-4 py-10">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[20px] font-semibold text-[#111111]">AfriWage</p>
            <p className="mt-2 text-base leading-[1.7] text-[#6B7280]">
              Borderless payroll for African teams on Stellar testnet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#6B7280]">
            <Link href="/dashboard" className="hover:text-[#111111]">
              Dashboard
            </Link>
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111111]"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
