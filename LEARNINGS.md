# Learnings

Hard-won knowledge from building MFC. **All agents must read this before starting work.** Append new entries as you discover gotchas — this file prevents the team from repeating mistakes.

---

## Prisma 7

- **No `url` in schema**: Prisma 7 moved DATABASE_URL out of `prisma/schema.prisma`. It lives in `prisma.config.ts`.
- **Env loading**: Both `prisma.config.ts` and `scripts/seed.ts` load `.env.local` first (Next.js convention), then `.env` as fallback. If your DB connection fails, check which env file has DATABASE_URL.
- **Generate before CI**: Always run `npx prisma generate` before lint/typecheck in CI. The generated client is not committed to git.

## Next.js 16

- **`next lint` removed**: Use `eslint .` directly (or `npm run lint` which wraps it). `next lint` no longer exists in Next.js 16.
- **`middleware.ts` → `proxy.ts`**: Auth0 middleware uses `proxy.ts` in Next.js 16, not the old `middleware.ts` convention.

## Jest / Testing

- **ESM-only packages break Jest**: `@auth0/nextjs-auth0` ships ESM only. You must mock the entire import chain in test helpers (`__tests__/api/helpers.ts`) — you can't import the real module in Jest's CJS environment.
- **`jest.clearAllMocks()` preserves `mockResolvedValue`**: `clearAllMocks` only clears calls/results/instances, NOT mock implementations. If you set `mockResolvedValue` in a `beforeEach`, it survives `clearAllMocks`. Use `mockReset()` if you need a clean slate.
- **Frontend tests excluded from CI**: `--selectProjects=api` in CI. Frontend tests pass locally but need prop interface updates to be stable in CI. Run them locally with `npm test` (no project filter).
- **`sound-manager.ts` must NOT contain `jest.fn()`**: The sound manager is imported at runtime. Keep test mocks in a separate `.js` mock file under `__mocks__/`.
- **Mock structure**: `__tests__/api/helpers.ts` exports `mockPrisma`, `mockAuth0`, `mockRequireAuth`, `mockEnsureUser`. Default user: `{id:'u1', credits:10000}`.

## Git / Multi-Agent Workflow

- **Always check current branch before committing**: Run `git branch --show-current` before any commit. Other agents' branches can get checked out unexpectedly in shared worktrees.
- **Check for ALL conflict hunks when rebasing**: Don't stop after resolving the first conflict. Search the entire file for remaining `<<<<<<<` markers.
- **ESLint auto-fix can revert your changes**: In a shared worktree, ESLint auto-fix picks up other agents' uncommitted modifications. After editing, verify your changes survived with `git diff`.
- **Cherry-pick + reset is safest for wrong-branch commits**: If commits land on the wrong branch, cherry-pick them to the right branch, then reset the wrong one. Don't try to rebase — it gets messy with shared history.

## Auth Pattern

- **Dual-mode auth**: `requireAuth()` checks Auth0 session first, then falls back to API key (`Authorization: Bearer mfc_sk_...`). Both return a session-like object.
- **Always derive userId from session**: The API client (`lib/api-client.ts`) never passes auth0Id or userId in request bodies or query params. The backend gets the user from `requireAuth()` + `ensureUser()`.
- **API key format**: `mfc_sk_` + 64 hex chars. Format is validated before DB lookup to prevent unnecessary queries.

## Credit Safety

- **Never do blind `credits + amount`**: Always use `fetchCredits()` to sync from the server after any credit operation. Optimistic local deduction is fine, but the server is the source of truth.
- **`placeBetAndDeduct` is atomic**: Balance check happens inside the Zustand `set()` callback to prevent TOCTOU races. On API failure, call `fetchCredits()` to rollback — don't manually re-add the amount.

## Canvas / Rendering

- **`imageSmoothing: false`** on all canvas contexts — pixel art must stay crispy.
- **Pixel-block style**: Use `fillRect` on a 4px grid. No arcs, no ellipses, no border-radius.
- **Crowd silhouettes**: Drawn at `height * 0.35` with gradient fade. Don't move them.

## CI Pipeline

- **Full local check before pushing**: `npm run lint && npm run type-check && npx jest --selectProjects=api --no-coverage && npm run build`
- **Don't skip steps**: Even if "just a docs change" — the build step catches surprising failures from re-exports and type changes.

---

*When you solve a hard problem or discover a non-obvious gotcha, append it here with a clear heading. Keep entries concise — this is a reference, not a journal.*
