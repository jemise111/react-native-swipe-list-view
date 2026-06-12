# Migrating from v3 to v4

> **Status: living draft.** Maintained continuously during the v4 rewrite — every
> entry in PLAN.md's "Breaking changes" list gets a section here in the same commit
> that introduces or discovers it. Code samples marked _TBD_ are filled in as the
> relevant phase lands. Finalized in Phase 7.

v4 is a from-scratch rewrite: TypeScript, function components,
`react-native-gesture-handler` v2 gestures, and `react-native-reanimated` v3
animations (everything on the UI thread). The public API is prop-for-prop
compatible with v3 except for the changes below.

## 1. New peer dependencies

You must install both libraries and set them up:

```sh
npm install react-native-gesture-handler react-native-reanimated
```

- Add `react-native-reanimated/plugin` to your `babel.config.js` plugins (must be
  last in the list).
- Wrap your app root in `<GestureHandlerRootView style={{ flex: 1 }}>`.
- Rebuild the native app (these are native modules).

See the official install guides:
[react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation),
[react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started).

## 2. Minimum versions

| Dependency | v3 | v4 |
|---|---|---|
| react | ≥0.14.8 | ≥18.0.0 |
| react-native | ≥0.23.1 | ≥0.73.0 |
| react-native-gesture-handler | — | ≥2.14.0 |
| react-native-reanimated | — | ≥3.6.0 |

`prop-types` is no longer a peer dependency.

## 3. ListView-era API removed

`ListView` left React Native core years ago; these props stopped working then and
are now removed from the API. Passing them logs a one-time dev warning.

| Removed prop | Replacement |
|---|---|
| `dataSource` | `data` (FlatList) / `sections` (SectionList) |
| `renderRow` | `renderItem` |
| `renderHiddenRow` | `renderHiddenItem` |
| `renderListView` | none (FlatList/SectionList only) |
| `previewFirstRow` | `previewRowKey` |
| `previewRowIndex` | `previewRowKey` |
| `useFlatList` | none — FlatList is the default |

## 4. `useNativeDriver` and `useAnimatedList` removed

Everything runs on the UI thread under Reanimated, so there is nothing to opt in
to. Both props are tolerated at runtime (one-time dev warning, then ignored) but
removed from the TypeScript types. Just delete them.

## 5. `onSwipeValueChange` → `swipeAnimatedValue` (recommended)

`onSwipeValueChange` still works, but it crosses to the JS thread on every frame.
v4 exposes each row's translateX as a Reanimated `SharedValue` —
`swipeAnimatedValue` on the row's ref / `rowMap` entry — so you can drive UI from
`useAnimatedStyle` without leaving the UI thread.

_TBD (Phase 3/6): before/after example — the ported `swipe_value_based_ui`
example is the reference implementation for this recipe._

## 6. `swipeGestureEnded` event payload changed

The gesture system is now react-native-gesture-handler, so PanResponder objects
no longer exist:

- `data.event` is an RNGH `GestureStateChangeEvent<PanGestureHandlerEventPayload>`
  (was a `GestureResponderEvent`).
- `data.gestureState` (PanResponder gesture state) is **removed**. Velocity and
  translation now live on `data.event` (`velocityX`, `translationX`, …).
- `data.translateX` and `data.direction` are unchanged.
- Calling `event.preventDefault()` in `swipeGestureEnded` to stop the row from
  settling no longer works — RNGH events have no `preventDefault`. If you relied
  on this, open an issue describing the use case.

```ts
// v3
swipeGestureEnded={(key, data) => {
    const distance = data.gestureState.dx;   // px
    const velocity = data.gestureState.vx;   // px/ms
}}

// v4
swipeGestureEnded={(key, data) => {
    const distance = data.event.translationX; // px
    const velocity = data.event.velocityX;    // px/s — note the unit change!
}}
```

## 7. `rowMap` entries are imperative handles, not component instances

`rowMap[key]` (and SwipeRow refs) used to be the `SwipeRow` class instance. It is
now a typed handle exposing the same public surface:

- `closeRow()`
- `closeRowWithoutAnimation()`
- `manuallySwipeRow(toValue, onAnimationEnd?)`
- `isOpen`
- `swipeAnimatedValue` (new, see §5)

Documented usage (`rowMap[key].closeRow()` etc.) is unaffected. Code reaching
into undocumented internals (e.g. `currentTranslateX`, `props`) must migrate —
`currentTranslateX` reads become `swipeAnimatedValue.value`.

## 8. `onScroll` must be a plain function

v3 accepted an `Animated.event(...)` object as `onScroll` (attaching its own
listener via the object's internal API). That API no longer exists in v4:
SwipeListView owns the list's scroll handler for its close-on-scroll
bookkeeping and calls your `onScroll` only if it is a plain function. Passing
an object (an `Animated.event` or a Reanimated `useAnimatedScrollHandler`
handler) logs a one-time dev warning and is ignored.

```ts
// v3 (no longer works)
onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.scrollY } } }],
)}

// v4
onScroll={event => {
    setScrollY(event.nativeEvent.contentOffset.y);
}}
```

UI-thread scroll handling (composing a user-supplied
`useAnimatedScrollHandler`) is on the post-4.0 backlog.
