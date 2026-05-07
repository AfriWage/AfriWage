---
name: Good First Issue
about: A well-scoped issue for new contributors to AfriWage
title: '[GOOD FIRST ISSUE] '
labels: ['good-first-issue', 'help wanted']
assignees: ''
---

## What to Build

<!-- Describe the feature or fix in plain language -->

## Why This Matters

<!-- Explain the user impact and how it fits AfriWage's mission -->

## Acceptance Criteria

- [ ] The implementation passes TypeScript strict mode (`pnpm type-check`)
- [ ] Biome linting passes with no errors (`pnpm lint`)
- [ ] The feature works on Stellar testnet
- [ ] UI changes are responsive (mobile + desktop)
- [ ] At least one manual test case is documented in the PR

## Files to Edit

<!-- List the specific files a contributor would need to touch -->

- `apps/web/src/...`
- `packages/sdk/src/...`

## Estimated Effort

<!-- small / medium -->

**Estimated effort:** small

## Resources

- [Stellar SDK docs](https://stellar.github.io/js-stellar-sdk/)
- [Freighter API docs](https://docs.freighter.app/)
- [AfriWage CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AfriWage GIT_GUIDELINE.md](../../GIT_GUIDELINE.md)

## How to Get Started

1. Comment on this issue to claim it
2. Fork the repo and branch from `develop`
3. Follow the branch naming: `feat/issue-{number}-short-description`
4. Open a draft PR early so maintainers can give feedback
