# AfriWage Dashboard Redesign

## Intent
Redesign AfriWage as a focused payroll operations dashboard for African cross-border payouts.
The UI should feel premium, trustworthy, and decisively operational rather than generic SaaS.

## Users
- Payroll operators who need to fund treasury, send worker payouts, and monitor delivery.
- Founders or finance leads who want a fast view of runway, settlement speed, and payout risk.
- Mobile users who still need full navigation and a clear primary action.

## Product Principles
- Make the next action obvious.
- Keep wallet state, payout state, and worker state visible together.
- Prefer compact operational summaries over decorative widgets.
- Support mobile usage with sticky action patterns and bottom navigation.

## Visual Direction
- Warm daylight background rather than cold gray.
- Executive finance console aesthetic.
- Card-based layout with soft depth and thin warm borders.
- Large, confident section titles with restrained supporting text.
- Clear information hierarchy and fast scanning.

## Palette
- Deep ink: `#102033`
- Emerald action: `#1f8f55`
- Mint support: `#dff3e8`
- Sand background: `#f6efe6`
- Paper surface: `#fffaf2`
- Warm border: `#eadfce`
- Slate secondary text: `#637085`
- Amber accent: `#f2b94b`
- Coral alert: `#e97b63`

## Typography
- Display headings: Space Grotesk
- Body text: Manrope
- Monospace values and wallet strings: IBM Plex Mono

## Component Direction
- Panels use 24px to 28px rounding.
- Controls use 18px to 20px rounding.
- Pills are fully rounded.
- Use subtle shadows and warm overlays, not hard dark shadows.

## Screen Structure
### Shared App Shell
- Desktop: fixed left rail with brand, current section, navigation, treasury wallet, and send payout CTA.
- Mobile: sticky top header plus fixed bottom navigation across all dashboard routes.
- Keep page title and summary visible at the top of each route.

### Dashboard
- Hero section with operator message and direct actions.
- KPI cards for treasury, workers paid, settlement speed, and success rate.
- Queue status and worker readiness as the main operational blocks.
- Recent activity feed and three-step operational guidance.

### Send Payout
- Two-column layout on desktop, stacked layout on mobile.
- Form, validation, and summary should stay in one view.
- Success state should present hash, explorer link, and reset action.

### Transactions
- Desktop table for efficient scanning.
- Mobile cards for readability.
- Search and lightweight filters at the top.

### Wallet
- Treasury balance first.
- Funding confidence and next actions clearly surfaced.

### Settings
- Same shell and spacing as operational pages.
- Configuration grouped into profile, security, and payment preferences.

## Motion
- Use restrained fade and slide transitions.
- Button presses should feel tactile.
- Avoid noisy or decorative animation.
