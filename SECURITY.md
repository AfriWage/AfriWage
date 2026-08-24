# Security Policy

## ⚠️ Unaudited & Testnet-Only Status
AfriWage is currently in an **active testnet-only phase**. The smart contracts and frontend code have **not yet been audited** by a professional security firm. 

Do not deploy this software to production or use it with mainnet funds/accounts.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| < 1.0.0 | :white_check_mark: |

Currently, only the active development branch (pre-release) on the testnet receives security support.

## In-Scope Vulnerability Classes
We are specifically interested in vulnerabilities within the following areas:
- **Authorization Bypass:** Ability to execute actions or view data without appropriate permissions (e.g., bypassing wallet verification).
- **Amount & Overflow Validation:** Issues where payment parameters (amount, fee, inputs) are not properly validated, leading to transaction failure or incorrect ledger execution.
- **Payment Flow State Transitions:** Faulty UI/UX state management allowing duplicate payment submission, incorrect redirection, or tampering with payment parameters between creation and submission.

## Out-of-Scope Items
The following items are outside the scope of our security policy:
- Attacks requiring physical access to a user's machine or unlocked browser/wallet.
- Third-party browser extension issues (e.g., vulnerabilities within the Freighter wallet itself).
- Rate-limiting, spam, or denial-of-service on testnet Horizon nodes.

## Private Reporting Instructions
**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in this project, please report it privately:
1. Open a draft security advisory via **GitHub Security Advisories** (under the "Security" tab of this repository).
2. Alternatively, email the maintainer directly at **security@afriwage.org** (or contact [@K1NGD4VID](https://github.com/K1NGD4VID)).

Please include a detailed description of the issue, steps to reproduce, and any proof-of-concept code or screenshots.

## Response Timeline
We aim to acknowledge all reports within **48 hours** and provide a resolution timeline or status update within **7 days**.
