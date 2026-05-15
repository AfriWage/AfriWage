import { Activity, Blocks, Code, Coins, Link as LinkIcon, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans selection:bg-[#14A800] selection:text-white">
      {/* SECTION 1: NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="text-xl font-bold text-[#111111]">AfriWage</div>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              GitHub
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#14A800] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#108A00]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2: HERO */}
      <section className="flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-32 text-center">
        <div className="mb-6 inline-flex rounded-full border border-[#222222] bg-[#111111] px-3 py-1 text-xs font-semibold text-[#14A800]">
          ● Built on Stellar Testnet
        </div>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
          Pay your African team. Instantly.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[#A1A1AA] md:text-xl">
          Send USDC via Stellar. Workers receive NGN, GHS, or KES directly to their bank accounts. No 5-day delays. No 10% wire fees.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#14A800] px-8 py-4 font-semibold text-white transition-colors hover:bg-[#108A00]"
          >
            Launch App
          </Link>
          <Link
            href="https://github.com/AfriWage/AfriWage"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#333333] bg-transparent px-8 py-4 font-semibold text-white transition-colors hover:bg-[#111111]"
          >
            Read Docs
          </Link>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-8 font-mono text-sm text-[#A1A1AA]">
          <span>&lt; 5s Settlement</span>
          <span className="hidden sm:inline">|</span>
          <span>~0.00001 XLM Fees</span>
          <span className="hidden sm:inline">|</span>
          <span>Open Source</span>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="bg-[#F9FAFB] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-[#111111]">
            How the infrastructure works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <div className="mb-4 font-mono text-xl text-[#14A800]">01</div>
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Connect Treasury</h3>
              <p className="text-[#6B7280]">
                Fund your Freighter wallet with USDC on the Stellar network.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <div className="mb-4 font-mono text-xl text-[#14A800]">02</div>
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Dispatch Payroll</h3>
              <p className="text-[#6B7280]">
                Send payments instantly on-chain to your workers' Stellar addresses.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <div className="mb-4 font-mono text-xl text-[#14A800]">03</div>
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Automatic Off-Ramp</h3>
              <p className="text-[#6B7280]">
                Integrated anchors convert USDC to local fiat directly to bank accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <Shield className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">Non-custodial</h3>
                <p className="text-[#6B7280]">You hold your keys. We never touch your treasury.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <LinkIcon className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">SEP-24/SEP-6 Anchor ready</h3>
                <p className="text-[#6B7280]">Seamless integration with local fiat anchors.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <Activity className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">Real-time tracking</h3>
                <p className="text-[#6B7280]">Monitor payments with verifiable on-chain data.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <Coins className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">Multi-currency</h3>
                <p className="text-[#6B7280]">Send in USDC, workers receive their local fiat.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <Code className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">Open-source</h3>
                <p className="text-[#6B7280]">Fully verifiable and community audited code.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB]">
                <Blocks className="h-6 w-6 text-[#14A800]" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">Soroban compatible</h3>
                <p className="text-[#6B7280]">Ready for next-gen smart contract workflows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CORRIDORS */}
      <section className="bg-[#F9FAFB] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-[#111111]">
            Supported Corridors
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'XOF', 'XAF'].map((currency) => (
              <div
                key={currency}
                className="flex h-16 w-32 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white font-mono text-xl font-semibold text-[#111111]"
              >
                {currency}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: OPEN SOURCE CTA & FOOTER */}
      <section className="bg-[#0A0A0A] pt-24 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-3xl font-bold text-white">Built in the open.</h2>
          <a
            href="https://github.com/AfriWage/AfriWage/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <img
              src="https://contrib.rocks/image?repo=AfriWage/AfriWage"
              alt="Contributors"
              className="max-w-full"
            />
          </a>
          <div className="mt-8">
            <Link
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-slate-200"
            >
              View on GitHub
            </Link>
          </div>
        </div>

        <footer className="mt-24 border-t border-[#222222] px-6 py-8">
          <div className="mx-auto max-w-7xl text-sm text-[#A1A1AA]">
            MIT License. Built for the Stellar Wave Program.
          </div>
        </footer>
      </section>
    </div>
  );
}
