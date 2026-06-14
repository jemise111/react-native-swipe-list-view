# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-06-13

A from-scratch rewrite. The public component API is prop-for-prop compatible with
v3 except where listed under **Breaking changes**. See
[docs/MIGRATION.md](./docs/MIGRATION.md) for upgrade steps and before/after code.

### Changed (internals)

- Rewritten in **TypeScript** with generated type declarations — types are now a
  single source of truth (no more separate `prop-types` / Flow / hand-written
  `.d.ts`).
- Gestures now use **react-native-gesture-handler v2** (`Gesture.Pan`); animation
  uses **react-native-reanimated v3** — both run on the UI thread instead of
  PanResponder + JS-driven `Animated`.
- Function components + hooks throughout.
- Single internal list pipeline parameterized over `FlatList`/`SectionList`
  instead of duplicated branches.
- Spring open/close now maps `friction`/`tension` through React Native's Origami
  conversion (the same one `Animated.spring` applies internally), so the feel
  matches v3.

### Added

- **`swipeAnimatedValue`** — each row's translateX is exposed as a Reanimated
  `SharedValue`, injected into both `SwipeRow` children and available on each
  `rowMap` entry. Drive `useAnimatedStyle` directly without the per-frame
  `onSwipeValueChange` JS callback.
- **Accessibility** — `SwipeRow` now provides `accessibilityActions`
  (`swipeleft` / `swiperight` when the matching open value is set) and an
  `onAccessibilityAction` handler that opens/closes the row, so screen-reader
  users can reach the hidden actions. Opt out with `accessible={false}`, or
  override `accessibilityActions` / `onAccessibilityAction`.
- Modern toolchain: react-native-builder-bob build, ESLint flat config, Jest +
  `@testing-library/react-native` test suite, and GitHub Actions CI
  (lint + typecheck + test + build).
- Expo example app under `example/` showcasing every feature.

### Breaking changes

1. **New peer dependencies.** Install `react-native-gesture-handler` and
   `react-native-reanimated`, add `react-native-reanimated/plugin` to Babel, and
   wrap your app root in `<GestureHandlerRootView>`.
2. **Minimum versions raised** to react 18 / react-native 0.73.
3. **ListView-era API removed** (already non-functional): `dataSource`,
   `renderRow`, `renderHiddenRow`, `renderListView`, `useFlatList`,
   `previewFirstRow`, `previewRowIndex`. Passing them logs a one-time dev warning.
4. **`useNativeDriver` and `useAnimatedList` removed** (meaningless under
   Reanimated). Tolerated at runtime with a one-time dev warning, then ignored;
   removed from the types.
5. **`onSwipeValueChange` still works** but crosses to JS per frame;
   `swipeAnimatedValue` is the recommended replacement.
6. **`swipeGestureEnded` payload changed.** `data.event` is now an RNGH
   `GestureStateChangeEvent<PanGestureHandlerEventPayload>`; the PanResponder
   `data.gestureState` field is removed (velocity/translation live on
   `data.event`; note `velocityX` is px/s, not px/ms). `data.translateX` /
   `data.direction` unchanged.
7. **`rowMap` entries and `SwipeRow` refs are imperative handles**, not class
   instances. Same public surface (`closeRow`, `closeRowWithoutAnimation`,
   `manuallySwipeRow`, `isOpen`, plus new `swipeAnimatedValue`); undocumented
   internals (e.g. `currentTranslateX`) are no longer reachable —
   `currentTranslateX` becomes `swipeAnimatedValue.value`.
8. **`onScroll` must be a plain function.** `Animated.event` objects (and
   Reanimated `useAnimatedScrollHandler` handlers) are no longer accepted —
   SwipeListView owns the scroll handler for close-on-scroll bookkeeping. Object
   handlers log a one-time dev warning and are ignored.

[4.0.0]: https://github.com/jemise111/react-native-swipe-list-view/releases/tag/v4.0.0
