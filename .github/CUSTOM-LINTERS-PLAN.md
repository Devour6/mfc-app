# Custom CI Linters Plan

**Author:** Lyle (Lead Engineer)
**Date:** 2026-02-18
**Status:** Planned — awaiting approval before implementation

## Motivation

The codebase audit (Feb 2026) found recurring pattern violations that manual PR review catches too late:
- **44 border-radius/rounded instances** violating the pixel-art design system
- **6 API routes** calling `requireAuth()` without `ensureUser()`
- **1 route** (Stripe webhook) parsing request body without zod validation
- **4 API routes** with no test files

These should be caught automatically in CI, not during human review.

## Proposed Rules

### Rule 1: `no-rounded-corners` (ESLint plugin)
**Priority:** High — 44 existing violations, most common design breach
**Scope:** `components/**/*.tsx`, `app/**/*.tsx`
**What it catches:**
- Tailwind classes: `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-t-*`, `rounded-b-*`, etc.
- Inline styles: `borderRadius`
**Implementation:** Custom ESLint rule that scans `className` string literals and JSX `style` props.
**Auto-fixable:** Yes — remove the rounded class from the className string.
**Rollout:** Fix all 44 existing violations first (one PR), then enable as error.

### Rule 2: `require-ensureUser` (CI script)
**Priority:** High — auth correctness
**Scope:** `app/api/**/*.ts`
**What it catches:** Files that import/call `requireAuth` but don't import/call `ensureUser`.
**Exceptions (allowlist):**
- `app/api/stripe/webhook/route.ts` (signature-verified, no session)
- Routes with only public GET handlers
**Implementation:** Bash/Node script in CI that greps route files. Simpler than an ESLint rule since it's cross-function analysis.
**Auto-fixable:** No — requires understanding which user fields the route needs.

### Rule 3: `require-route-tests` (CI script)
**Priority:** Medium — coverage enforcement
**Scope:** `app/api/**/route.ts` → `__tests__/api/**/*.test.ts`
**What it catches:** API route files with no corresponding test file.
**Implementation:** CI script that maps `app/api/[path]/route.ts` → `__tests__/api/[path].test.ts` and fails if missing.
**Exceptions (allowlist):**
- `app/api/health/route.ts` (trivial, covered by health.test.ts)
**Rollout:** Add missing test files first (solana/config, stripe/webhook, stripe/checkout-session), then enable.

### Rule 4: `no-raw-fetch-in-components` (ESLint rule)
**Priority:** Low — 0 current violations, but prevents regression
**Scope:** `components/**/*.tsx`
**What it catches:** Direct `fetch(` calls. Components should use `lib/api-client.ts`.
**Implementation:** ESLint `no-restricted-globals` or custom rule targeting `fetch` calls in component files.
**Exceptions:** None — all API calls in components go through api-client.
**Auto-fixable:** No — needs manual migration to api-client function.

## Implementation Approach

### Option A: ESLint Plugin (Recommended)
Write a local ESLint plugin at `eslint-rules/` with custom rules. Reference it in `.eslintrc.json`. Pros: runs with existing `npm run lint`, inline editor feedback, auto-fix support. Cons: more code to write upfront.

### Option B: CI Shell Scripts
Add a `scripts/lint-mfc.sh` that runs grep-based checks. Add it as a CI step after lint. Pros: fast to write, easy to understand. Cons: no editor integration, no auto-fix, separate from the lint step.

### Recommended: Hybrid
- **Rules 1 and 4** → ESLint plugin (benefits from editor integration + auto-fix)
- **Rules 2 and 3** → CI scripts (cross-file analysis doesn't fit ESLint's per-file model)

## Rollout Plan

### Phase 1: Fix existing violations (1 PR)
- Remove all 44 `rounded` classes from components
- Add `ensureUser()` to 6 routes missing it
- Write test stubs for 4 untested routes

### Phase 2: Add linter rules (1 PR)
- Create `eslint-rules/no-rounded-corners.js`
- Create `eslint-rules/no-raw-fetch-in-components.js`
- Create `scripts/lint-mfc-routes.sh` (ensureUser + test file checks)
- Add `lint-mfc-routes` step to `ci.yml`
- Update `.eslintrc.json` to load local plugin

### Phase 3: Verify & harden
- Run full CI to confirm no false positives
- Add allowlist mechanism for intentional exceptions
- Document rules in CLAUDE.md

## Existing Violations to Fix (Pre-Requisite)

### Border-Radius (44 instances across 10+ files)
| File | Count |
|------|-------|
| `FighterProfileModal.tsx` | ~17 |
| `CreditWithdrawal.tsx` | 5 |
| `FightersSection.tsx` | 4 |
| `EnhancedFightCanvas.tsx` | 3-4 |
| `TournamentBracket.tsx` | 2 |
| `FighterEvolution.tsx` | 2 |
| `TopBar.tsx` | 2 |
| `NewArenaPage.tsx` | 1 |
| `CommentaryBar.tsx` | 1 |
| `WalletConnect.tsx` | 1 |

### Missing ensureUser() (6 routes)
- `app/api/bets/[id]/route.ts` (GET, PATCH)
- `app/api/training/[id]/route.ts` (GET)
- `app/api/fights/route.ts` (POST — creates fight)
- `app/api/fights/[id]/route.ts` (PATCH — updates fight status)

### Missing Test Files (4 routes)
- `app/api/solana/config/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/checkout-session/route.ts`
- `app/api/training/route.ts` (sparse — only auth tests, no CRUD tests)

## Cost / Risk Assessment

| Risk | Mitigation |
|------|-----------|
| False positives blocking PRs | Allowlist file for intentional exceptions |
| Slowing down Luna/Orcus | Phase 1 fixes violations first so rules start clean |
| ESLint plugin complexity | Keep rules simple — string matching, not AST analysis |
| CI time increase | Script checks add <5s, ESLint rules add ~0s (same lint pass) |

---

*This plan is ready for review. Implementation estimated at 2-3 PRs over 1 wave.*
