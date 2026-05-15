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
- `docs`: Documentation, architecture details, and UI design decisions.
