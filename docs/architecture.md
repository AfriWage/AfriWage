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

## Folders

- `apps/web`: The Next.js frontend application.
- `packages/sdk`: Core SDK wrapping the Stellar SDK for specific payroll operations.
- `docs`: Documentation and architecture diagrams.
