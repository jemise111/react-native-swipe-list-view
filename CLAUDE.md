# react-native-swipe-list-view

Swipeable-row list library for React Native (`SwipeRow` + `SwipeListView`).
TypeScript source in `src/`, built to `lib/` with react-native-builder-bob.
Gestures use react-native-gesture-handler v2; animation uses react-native-reanimated v3.

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
