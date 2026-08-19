# AfriWage Architecture

## Overview

AfriWage is a monorepo containing a Next.js 14 frontend and a Stellar SDK package.
The project is built on top of the Stellar network using USDC as the settlement layer.

## Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS + shadcn/ui
- @stellar/stellar-sdk
- Freighter Wallet API
- React Query (for data fetching and state management)

## Folders

- `apps/web`: The Next.js frontend application.
  - `src/app`: App Router pages (Dashboard, Settings, Send Payment, Transactions, Wallet, Public Receipts) and Next.js API Routes (`src/app/api`).
  - `src/components`: UI components including the responsive `DashboardShell`, `WalletConnect`, and `ui/` folder for shadcn components.
  - `src/lib`: Core utility functions for Stellar network (`stellar.ts`) and Freighter wallet interactions (`freighter.ts`).
- `packages/sdk`: Core SDK wrapping the Stellar SDK for specific payroll operations.
- `packages/db`: Drizzle schema and Postgres connection wrapper for settings persistence.
- `docs`: Documentation, architecture details, and UI design decisions.

## Database

The `packages/db` package owns the Drizzle schema and connection wrapper
(`packages/db/src/index.ts`, `packages/db/src/schema.ts`). It reads `POSTGRES_URL`
server-side and is consumed by the web app as a workspace dependency.

- `pnpm --filter @AfriWage/db generate` — generate a migration from a schema change.
- `pnpm --filter @AfriWage/db migrate` — apply pending migrations to the database named by
  `POSTGRES_URL`.

Migrations are explicit, developer-run commands: they require a live `POSTGRES_URL` and are
not run by CI or against production automatically.

## Yellow Card off-ramp

The server-side Yellow Card SEP-6 integration lives in
`packages/sdk/src/anchors/yellowcard.ts` and is exposed through the Next.js route
`apps/web/src/app/api/anchor/yellowcard/route.ts`. It reads `YELLOWCARD_API_KEY` (required)
and `YELLOWCARD_API_URL` (optional) on the server only; the API key is never shipped to the
client.
