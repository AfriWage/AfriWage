```
 █████╗ ███████╗██████╗ ██╗██╗    ██╗ █████╗  ██████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██║██║    ██║██╔══██╗██╔════╝ ██╔════╝
███████║█████╗  ██████╔╝██║██║ █╗ ██║███████║██║  ███╗█████╗  
██╔══██║██╔══╝  ██╔══██╗██║██║███╗██║██╔══██║██║   ██║██╔══╝  
██║  ██║██║     ██║  ██║██║╚███╔███╔╝██║  ██║╚██████╔╝███████╗
╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**Instant, borderless payroll for African gig workers — powered by Stellar & USDC**


[![CI](https://github.com/AfriWage/AfriWage/actions/workflows/ci.yml/badge.svg)](https://github.com/AfriWage/AfriWage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blueviolet?logo=stellar)](https://stellar.org)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Docs](https://img.shields.io/badge/docs-GitBook-blue)](https://k1ngd4vid.gitbook.io/afriwage-docs)

**🌍 Live Demo:** [https://afriwage.vercel.app](https://afriwage.vercel.app)

---

## The Problem

Over 70 million gig workers across Africa are paid through legacy wire transfers and mobile money corridors that charge 5–15% fees and take 1–5 business days to settle. For a freelancer in Lagos waiting on a $200 invoice, that's a $30 loss and a week of waiting. This is broken.

**AfriWage fixes it.** Employers send USDC via Stellar. It settles in 5 seconds. Workers automatically off-ramp to local currency through integrated Stellar anchors. The entire flow is transparent, on-chain, and costs fractions of a cent.

---

## How It Works

```
[Employer Wallet]
       │
       │  USDC payment (Stellar network)
       ▼
[Stellar Network]   ◄─── 3–5 second settlement
       │
       │  Automatic anchor off-ramp
       ▼
   [Anchor]          e.g. Flutterwave, Bitget
       │
       │  Local currency (NGN / GHS / KES / ZAR / ...)
       ▼
[Worker Bank Account / Mobile Money]
```

---

## Features

- ✅ **Send USDC payments** — validated Stellar address input, optional memo, real testnet execution
- ✅ **Freighter wallet connect** — one-click connection, address copy, explorer link
- ✅ **Live balance display** — XLM and USDC balances fetched from Horizon API
- ✅ **Transaction history** — last 20 on-chain transactions with direction indicators
- ✅ **Payment Receipts** — public proof-of-payment receipt page for any transaction hash
- ✅ **Employer dashboard** — send payments, view balance, manage payroll, modify security settings
- ✅ **8+ African countries** — off-ramp support for NGN, GHS, KES, ZAR, TZS, UGX, XOF, XAF
- ✅ **@AfriWage/sdk** — standalone Stellar helper package for the community

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Blockchain | Stellar (testnet) |
| Asset | USDC (Circle testnet issuer) |
| Wallet | Freighter browser extension |
| SDK | @stellar/stellar-sdk v12 |
| State | React Query v5 |
| Monorepo | pnpm workspaces + Turborepo |
| Deploy | Vercel |

---

## Monorepo Structure

```
Afriwage/
├── apps/
│   └── web/                          ← Next.js 14 app (App Router)
│       └── src/
│           ├── app/
│           │   ├── page.tsx          ← landing page
│           │   ├── api/              ← backend API routes
│           │   ├── dashboard/        ← employer dashboard overview
│           │   ├── receipt/          ← public payment receipt pages
│           │   ├── send/             ← send payment flow
│           │   ├── settings/         ← profile and security settings
│           │   ├── transactions/     ← transaction history
│           │   └── wallet/           ← wallet connection and balances
│           ├── components/
│           │   ├── dashboard-shell.tsx ← main layout wrapper
│           │   ├── WalletConnect.tsx
│           │   ├── SendPaymentForm.tsx
│           │   ├── TransactionHistory.tsx
│           │   └── ui/               ← reusable UI components (shadcn/ui)
│           └── lib/
│               ├── stellar.ts        ← Stellar SDK helpers
│               └── freighter.ts      ← Freighter wallet integration
├── packages/
│   └── sdk/                          ← @AfriWage/sdk
│       └── src/
│           ├── payment.ts            ← sendPayment, getBalance, getHistory
│           ├── account.ts            ← createKeypair, fundTestnet
│           └── types.ts
├── docs/
├── .github/
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- [Freighter wallet](https://freighter.app) browser extension (Chrome/Firefox)

### Clone & Install

```bash
git clone https://github.com/AfriWage/AfriWage.git
cd AfriWage
pnpm install
```

### Environment Setup

```bash
cp .env.example apps/web/.env.local
# No secrets required for testnet — all values are public
```

### Run Dev Server

```bash
pnpm dev
# App available at http://localhost:3000
```

### Build

```bash
pnpm build
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network to use | `testnet` |
| `NEXT_PUBLIC_HORIZON_URL` | Horizon API endpoint | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Stellar network passphrase | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

> ⚠️ All `NEXT_PUBLIC_` vars are client-side. Never store private keys in environment variables.

---

## Maintainers

| Avatar | Name | Role | GitHub |
|---|---|---|---|
| <img src="https://github.com/K1NGD4VID.png" width="40" style="border-radius:50%"> | Adesanya Fuhad | Founder & Lead Developer | [@K1NGD4VID](https://github.com/K1NGD4VID) |

---

## Contributing

We welcome contributions from developers at all levels. AfriWage is a real open-source project actively building toward production.

👉 Read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

Look for issues labelled [`good-first-issue`](https://github.com/AfriWage/AfriWage/labels/good-first-issue) on GitHub.

---

## Documentation

📖 **Full Docs:** https://k1ngd4vid.gitbook.io/afriwage-docs

---

## License

MIT © [Adesanya Fuhad](https://github.com/K1NGD4VID)
