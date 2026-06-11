# react-native-swipe-list-view

Swipeable-row list library for React Native (`SwipeRow` + `SwipeListView`).

## Active work: v4 rewrite

- **Read `PLAN.md` before doing any work. It is the single source of truth** — phases,
  checkboxes, API parity checklist, locked decisions, known pitfalls (§6).
- Active branch: `v4`. `master` is v3.2.9 and serves as the reference implementation
  (`components/*.js`) until Phase 8 removes it.
- **Ignore the `v4-rewrite` branch entirely** — abandoned earlier attempt. Do not read,
  reference, or copy from it.

## Commands

```bash
npm install --legacy-peer-deps   # plain npm install will fail on peer conflicts
npm run typecheck
npm run lint
npm test
npm run build                    # bob build -> lib/
```

## Hard rules

- The user manually verifies each phase before its commit. Never commit without an
  explicit go-ahead.
- **NEVER push to any remote, and never publish to npm, unless the user explicitly
  requests it in the current conversation.** A commit go-ahead is NOT a push go-ahead.
- Stay within the current phase's scope. Any deviation (new breaking change, API tweak,
  dropped item) must be recorded in PLAN.md in the same commit.
- Update PLAN.md checkboxes and its Status line before ending a session, even mid-phase.
