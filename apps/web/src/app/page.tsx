import { ArrowRight, ShieldCheck, ChevronRight, Clock, Wallet, Send, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SUPPORTED_COUNTRIES } from '@/types';
import HeroVisual from '@/components/HeroVisual';
import { InstantSettlementIcon, LocalDeliveryIcon } from '@/components/ui/Icons';
import Reveal from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'AfriWage - Borderless payroll for African teams',
  description:
    'Send payroll over Stellar and deliver to local African payout corridors with clear transaction visibility. Instant USDC payments for gig workers across 8+ African countries.',
};

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Corridors', href: '#corridors' },
];

const features = [
  {
    icon: InstantSettlementIcon,
    title: 'Instant Settlement',
    description:
      'Payouts settle in seconds on Stellar instead of waiting on multi-day wire cycles. Your workers get paid the moment you hit send.',
    stat: '~5s',
    statLabel: 'settlement',
  },
  {
    icon: LocalDeliveryIcon,
    title: 'Corridor-Native Delivery',
    description: 'Route value into NGN, GHS, KES, ZAR, TZS, UGX, XOF, and XAF payout corridors — covering 70M+ gig workers.',
    stat: '8+',
    statLabel: 'corridors',
  },
  {
    icon: ShieldCheck,
    title: 'On-Chain Proof',
    description: 'Every transfer has a verifiable on-chain receipt your team can verify anytime. Full transparency, zero ambiguity.',
    stat: '100%',
    statLabel: 'verifiable',
  },
];

const flowSteps = [
  {
    step: '01',
    icon: Wallet,
    title: 'Fund Your Wallet',
    description: 'Connect any wallet and load USDC into your payroll treasury.',
  },
  {
    step: '02',
    icon: Send,
    title: 'Send Payments',
    description: 'Select recipients, enter amounts, and sign the transaction through Stellar.',
  },
  {
    step: '03',
    icon: Clock,
    title: 'Instant Settlement',
    description: 'Stellar settles the payment in 3-5 seconds — not days.',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Local Delivery',
    description: 'Workers receive local currency through integrated African payout corridors.',
  },
];

const stats = [
  { value: '<1¢', label: 'Transaction Fees' },
  { value: '~5s', label: 'Settlement Time' },
  { value: '8+', label: 'African Countries' },
  { value: '0%', label: 'Hidden Charges' },
];

export default function HomePage() {
  return (
    <div className="landing-root">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="landing-nav" id="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo-link" id="logo-link">
            <div className="landing-logo-icon">
              <span>A</span>
            </div>
            <p className="landing-logo-text">AfriWage</p>
          </Link>

          <div className="landing-nav-links">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="landing-nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="landing-nav-actions">
            <Link
              href="/dashboard"
              className="landing-btn-primary"
              id="nav-cta"
            >
              Launch App
              <ArrowRight className="icon-sm" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="landing-hero" id="hero">
          <div className="landing-hero-inner">
            {/* Badge */}
            <div className="landing-hero-badge">
              <span className="landing-badge-dot" />
              Live on Stellar network
            </div>

            {/* Hero visual: MagicRings + RotatingText */}
            <div className="landing-hero-visual-wrap">
              <HeroVisual />
            </div>

            {/* Headline + Sub */}
            <h1 className="landing-hero-h1" id="hero-heading">
              Borderless Payroll for
              <br />
              <span className="landing-hero-gradient">African Gig Workers</span>
            </h1>
            <p className="landing-hero-sub">
              Send USDC over Stellar. It settles in 5 seconds. Workers automatically
              receive local currency. No intermediaries. No 5-15% corridor fees.
              Just instant, transparent payroll.
            </p>

            {/* CTA Buttons */}
            <div className="landing-hero-ctas">
              <Link href="/dashboard" className="landing-btn-primary landing-btn-lg" id="hero-cta-primary">
                Open Dashboard
                <ArrowRight className="icon-sm" />
              </Link>
              <a
                href="#how-it-works"
                className="landing-btn-secondary landing-btn-lg"
                id="hero-cta-secondary"
              >
                See How It Works
                <ChevronRight className="icon-sm" />
              </a>
            </div>

            {/* Stats Bar */}
            <div className="landing-stats-bar" id="stats-bar">
              {stats.map((stat) => (
                <div key={stat.label} className="landing-stat-item">
                  <p className="landing-stat-value">{stat.value}</p>
                  <p className="landing-stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero bottom gradient */}
          <div className="landing-hero-fade" />
        </section>

        {/* ═══════════════ PROBLEM / SOLUTION ═══════════════ */}
        <section className="landing-section landing-section-dark" id="problem-solution">
          <div className="landing-container">
            <div className="landing-ps-grid">
              {/* Problem */}
              <Reveal delay={0.1} className="landing-ps-card landing-ps-problem" id="problem-card">
                <div className="landing-ps-content">
                  <div className="landing-ps-icon-wrap landing-ps-icon-red">
                    <span className="landing-ps-icon-text">✕</span>
                  </div>
                  <h3 className="landing-ps-title">The Problem</h3>
                  <p className="landing-ps-desc">
                    Over <strong>70 million gig workers</strong> across Africa are paid through legacy wire transfers
                    and mobile money corridors that charge <strong>5–15% fees</strong> and take <strong>1–5 business days</strong> to
                    settle. A freelancer in Lagos waiting on a $200 invoice loses $30 and a week of waiting.
                  </p>
                </div>
                <div className="landing-ps-highlight-red">
                  <span className="landing-ps-highlight-value">$30</span>
                  <span className="landing-ps-highlight-label">lost on every $200 payment</span>
                </div>
              </Reveal>

              {/* Solution */}
              <Reveal delay={0.2} className="landing-ps-card landing-ps-solution" id="solution-card">
                <div className="landing-ps-content">
                  <div className="landing-ps-icon-wrap landing-ps-icon-green">
                    <span className="landing-ps-icon-text">✓</span>
                  </div>
                  <h3 className="landing-ps-title">AfriWage Fixes It</h3>
                  <p className="landing-ps-desc">
                    Employers send <strong>USDC via Stellar</strong>. It settles in 5 seconds. Workers automatically
                    off-ramp to <strong>local currency</strong> through integrated Stellar anchors. The entire flow is
                    transparent, on-chain, and costs <strong>fractions of a cent</strong>.
                  </p>
                </div>
                <div className="landing-ps-highlight-green">
                  <span className="landing-ps-highlight-value">&lt;1¢</span>
                  <span className="landing-ps-highlight-label">per transaction with AfriWage</span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <section className="landing-section" id="how-it-works">
          <div className="landing-container">
            <Reveal className="landing-section-header">
              <p className="landing-section-eyebrow">How It Works</p>
              <h2 className="landing-section-h2">
                Four steps from treasury
                <br />
                to local payout
              </h2>
              <p className="landing-section-desc">
                A streamlined flow designed for speed, transparency, and zero friction.
              </p>
            </Reveal>

            <div className="landing-flow-grid" id="flow-steps">
              {flowSteps.map((item, index) => (
                <Reveal key={item.step} delay={0.1 * index} className="landing-flow-card" id={`flow-step-${index + 1}`}>
                  <div className="landing-flow-step-number">{item.step}</div>
                  <div className="landing-flow-icon-wrap">
                    <item.icon className="landing-flow-icon" />
                  </div>
                  <h3 className="landing-flow-title">{item.title}</h3>
                  <p className="landing-flow-desc">{item.description}</p>
                  {index < flowSteps.length - 1 && (
                    <div className="landing-flow-connector">
                      <ChevronRight className="icon-sm" />
                    </div>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section className="landing-section landing-section-dark" id="features">
          <div className="landing-container">
            <Reveal className="landing-section-header">
              <p className="landing-section-eyebrow">Why AfriWage</p>
              <h2 className="landing-section-h2">
                Built for clean payout execution
              </h2>
              <p className="landing-section-desc">
                Every feature designed around one goal — getting money to African workers faster, cheaper, and with full proof.
              </p>
            </Reveal>

            <div className="landing-features-grid" id="features-grid">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={0.1 * i} className="landing-feature-card" id={`feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="landing-feature-top">
                    <div className="landing-feature-icon-wrap">
                      <feature.icon className="landing-feature-icon" />
                    </div>
                    <div className="landing-feature-stat-wrap">
                      <span className="landing-feature-stat">{feature.stat}</span>
                      <span className="landing-feature-stat-label">{feature.statLabel}</span>
                    </div>
                  </div>
                  <h3 className="landing-feature-title">{feature.title}</h3>
                  <p className="landing-feature-desc">{feature.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ CORRIDORS ═══════════════ */}
        <section className="landing-section" id="corridors">
          <div className="landing-container">
            <Reveal className="landing-section-header">
              <p className="landing-section-eyebrow">Payout Coverage</p>
              <h2 className="landing-section-h2">
                8+ African corridors
              </h2>
              <p className="landing-section-desc">
                Route payroll to supported local corridors. Workers receive value in their familiar currency.
              </p>
            </Reveal>

            <Reveal className="marquee-container" delay={0.2}>
              <div className="marquee-content">
                {[...SUPPORTED_COUNTRIES, ...SUPPORTED_COUNTRIES, ...SUPPORTED_COUNTRIES].map((country, i) => (
                  <div key={`${country.code}-${i}`} className="marquee-item">
                    <span style={{ fontSize: '24px' }}>{country.flag}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', lineHeight: 1 }}>{country.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--green-primary)', lineHeight: 1 }}>{country.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════ CTA SECTION ═══════════════ */}
        <section className="landing-cta-section" id="final-cta">
          <div className="landing-container">
            <Reveal className="landing-cta-card">
              <div className="landing-cta-glow" />
              <h2 className="landing-cta-h2">
                Start paying your African team
                <br />
                <span className="landing-hero-gradient">in seconds, not days</span>
              </h2>
              <p className="landing-cta-desc">
                Connect any wallet, fund your treasury, and send your first borderless payroll today.
              </p>
              <div className="landing-cta-buttons">
                <Link href="/dashboard" className="landing-btn-primary landing-btn-lg" id="final-cta-btn">
                  Launch Dashboard
                  <ArrowRight className="icon-sm" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="landing-footer" id="footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">
                <div className="landing-logo-icon">
                  <span>A</span>
                </div>
                <p className="landing-logo-text" style={{ color: 'white' }}>AfriWage</p>
              </div>
              <p className="landing-footer-tagline">
                Instant, borderless payroll for African gig workers — powered by Stellar &amp; USDC.
              </p>
            </div>
            <div className="landing-footer-links">
              <div className="landing-footer-col">
                <p className="landing-footer-col-title">Product</p>
                <Link href="/dashboard" className="landing-footer-link">Dashboard</Link>
                <Link href="/send" className="landing-footer-link">Send Payment</Link>
                <Link href="/transactions" className="landing-footer-link">Transactions</Link>
              </div>
              <div className="landing-footer-col">
                <p className="landing-footer-col-title">Resources</p>
                <a href="https://k1ngd4vid.gitbook.io/afriwage-docs" target="_blank" rel="noopener noreferrer" className="landing-footer-link">Documentation</a>
                <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="landing-footer-link">Stellar Network</a>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p className="landing-footer-copy">© 2024 AfriWage.</p>
            <p className="landing-footer-copy">Built with ❤️ for African gig workers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
