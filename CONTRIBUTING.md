# Contributing to AfriWage

Welcome, and thank you for your interest in contributing to **AfriWage** — open-source, instant USDC payroll for African gig workers. Every contribution, from a typo fix to a new feature, directly helps freelancers across Africa get paid faster and more fairly.

---

## Project Mission

AfriWage exists to eliminate the friction of cross-border payroll for Africa's growing gig economy. We believe financial infrastructure should be open, transparent, and accessible to everyone — not gatekept by legacy banking systems.

---

## Prerequisites

Before contributing, make sure you have:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 9+** — `npm install -g pnpm`
- **Git** with signed commits encouraged
- **Freighter wallet** — [freighter.app](https://freighter.app) (for testing wallet features)
- A basic understanding of [Stellar](https://stellar.org) and [USDC](https://www.circle.com/en/usdc)

---

## Setup Steps

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/AfriWage.git
cd AfriWage

# 2. Install all dependencies
pnpm install

# 3. Set up environment
cp .env.example apps/web/.env.local
# No secrets needed for testnet

# 4. Run the development server
pnpm dev
# Visit http://localhost:3000
```

---

## Branch Naming Convention

All feature work must branch from `main`.

```
feat/issue-42-send-payment-form
fix/issue-17-balance-display-bug
docs/issue-5-update-readme
chore/issue-11-upgrade-stellar-sdk
refactor/issue-28-extract-wallet-hook
```

**Format:** `{type}/issue-{number}-{short-description}`

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add payment streaming
fix: resolve balance display bug
docs: update contributing guide
chore: upgrade @stellar/stellar-sdk to v12
refactor: extract freighter hook into lib
test: add unit tests for sendPayment
ci: add biome linting step
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `revert`

Commit messages are validated by `commitlint` on every commit via Husky.

---

## PR Checklist

Before opening a PR, make sure:

- [ ] Your branch is based on `main`
- [ ] Branch name follows the convention above
- [ ] All commit messages follow Conventional Commits
- [ ] `pnpm type-check` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] You tested the feature manually on Stellar testnet
- [ ] No `any` types are introduced
- [ ] No hardcoded secret keys or mainnet credentials
- [ ] PR changes fewer than 400 lines (excluding lock files)
- [ ] The PR description explains what you changed and why

---

## Code Style

- **Formatter:** Biome (`pnpm format`) — run before committing
- **Linter:** Biome (`pnpm lint`)
- **TypeScript:** Strict mode — no `any`, no `@ts-ignore` without justification
- **Imports:** Organized by Biome automatically
- **Naming:** `camelCase` for functions/variables, `PascalCase` for components/types

---

## Finding Issues to Work On

1. Comment on the issue saying you'd like to work on it
2. Wait for a maintainer to assign it (usually within a day)
3. Open a draft PR early so we can give feedback as you go
4. Mark ready for review when CI is green   

---

## Git Guidelines

For full branching strategy, PR rules, and commit signing guidance, see [GIT_GUIDELINE.md](./GIT_GUIDELINE.md).

---

