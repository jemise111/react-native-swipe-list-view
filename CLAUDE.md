# react-native-swipe-list-view

Swipeable-row list library for React Native (`SwipeRow` + `SwipeListView`).
TypeScript source in `src/`, built to `lib/` with react-native-builder-bob.
Gestures use react-native-gesture-handler (v2+, v3 verified); animation uses
react-native-reanimated (v3+, v4 verified). `example/` is an Expo dev-client app
that Metro points at `src/`.

## Commands

```bash
npm install --legacy-peer-deps   # plain npm install fails on peer conflicts
npm run typecheck
npm run lint
npm test
npm run build                    # bob build -> lib/
```

## Hard rules

- NEVER push to a remote or publish to npm unless explicitly requested in the
  current conversation. A commit go-ahead is NOT a push go-ahead.
- The library ships `src/` and built `lib/`; keep `tsconfig.build.json` excluding
  `example/` and `website/`.

## Workflows

- `/next-issue [N]` — pick the next `ready` issue (lowest milestone first),
  implement, validate in the example app, open a PR.
- `/maintenance [focus]` — audit deps / Expo SDK / CI / deprecations, do one
  focused update, validate, open a PR; file issues for the rest.
- Both validate per `.claude/validation.md` using `.claude/scripts/sim.sh`.
- Issue labels: `ready` / `needs-design`, `size:S|M|L`, `breaking` (major
  versions only), `maintenance`. Milestones: 4.1, 4.2, 5.0.
