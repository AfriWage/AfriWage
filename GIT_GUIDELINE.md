# Git Guidelines — AfriWage

This document defines the branching strategy, commit standards, and PR rules that keep our history clean and our collaboration efficient.

---

## Branch Strategy

```
main (protected)
 └── develop
      ├── feat/issue-42-send-payment-form
      ├── fix/issue-17-balance-display
      └── docs/issue-5-update-readme
```

### Branch Rules

| Branch | Purpose | Protected? |
|---|---|---|
| `main` | Production-ready code. Every commit here is deployed. | ✅ Yes |
| `develop` | Integration branch. All feature branches merge here first. | ✅ Yes |
| `feat/*` | New features. Branch from `develop`. | No |
| `fix/*` | Bug fixes. Branch from `develop`. | No |
| `docs/*` | Documentation updates. Branch from `develop`. | No |
| `chore/*` | Tooling, deps, config. Branch from `develop`. | No |
| `hotfix/*` | Critical production fixes. Branch from `main` only. | No |

---

## Core Rules

### 1. Never Push Directly to `main`

`main` is protected. All changes must go through a PR and pass CI before merging.

### 2. Always Branch From `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feat/issue-42-send-payment-form
```

Exception: `hotfix/*` branches for critical production bugs branch from `main` and must be backported to `develop` immediately after.

### 3. PRs Require at Least 1 Review

Every PR to `develop` or `main` must receive at least one approving review from a maintainer before it can be merged. Automated CI (lint + type-check + build) must also pass.

### 4. Keep PRs Small and Focused

- **Maximum 400 lines changed** per PR (excluding lock files and auto-generated code)
- One logical change per PR — don't bundle unrelated fixes
- If a feature is large, split it into sequential PRs

### 5. Signed Commits (Encouraged)

We encourage commit signing with GPG or SSH keys to verify authorship. To set up:

```bash
git config --global commit.gpgsign true
git config --global user.signingkey <your-gpg-key-id>
```

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional-scope>): <short description>

<optional body>

<optional footer>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature visible to users |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Tooling, config, deps (no prod code changes) |
| `refactor` | Code restructuring, no behaviour change |
| `test` | Adding or updating tests |
| `ci` | CI pipeline changes |
| `perf` | Performance improvements |
| `revert` | Reverting a previous commit |

### Examples

```
feat(sdk): implement sendPayment with Stellar SDK
fix(web): resolve USDC balance not displaying after connect
docs: add architecture overview to docs/
chore: upgrade @stellar/stellar-sdk to v12.3
```

---

## Merge Strategy

- `develop` → `main`: **Squash merge** (keeps `main` history clean)
- `feat/*` → `develop`: **Merge commit** (preserves feature context)
- **Rebase before merging** your feature branch to avoid complex merge conflicts:

```bash
git fetch origin
git rebase origin/develop
```

---

## Release Process

1. Maintainer creates a `release/v{major}.{minor}.{patch}` branch from `develop`
2. Final testing and changelog update on release branch
3. PR from release branch → `main`
4. After merge, tag the release: `git tag v0.1.0`
5. Backport any release commits to `develop`

---

## Stale PRs

PRs with no activity for 14 days will be labelled `stale`. After 7 more days with no response, they may be closed. You can always reopen a stale PR.
