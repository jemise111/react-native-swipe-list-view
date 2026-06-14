# react-native-swipe-list-view v4 — Implementation Plan

> **For Claude sessions:** This file is the single source of truth for the v4 rewrite.
> Work one phase at a time. Check boxes as you complete items. Each phase ends with a
> verification step and a commit — **the user manually verifies each phase before commit;
> do not commit without explicit go-ahead. Never push unless explicitly requested.**
> Update the Status line below whenever a phase completes.
>
> **Ignore the `v4-rewrite` branch** — it is an abandoned earlier attempt. This branch
> (`v4`) starts from scratch off `master` (v3.2.9). Do not copy code from `v4-rewrite`;
> the "Known pitfalls" section below already captures the useful lessons from it.

**Status:** Phase 9 (v3 removal & release prep) code-complete, awaiting commit go-ahead. Deleted v3 (`components/`, `types/`, `bin/`, `SwipeListExample/` — 76 files); removed the example v3/v4 toggle (lib-switch + App toggle UI + metro repoint + prop-types) and simplified `actions.tsx` to the single v4 path; added `CHANGELOG.md` to the tarball; dated CHANGELOG `2026-06-13`; README maintenance-note placeholder + docs-site link. Verified: `npm ci`/build/`npm test` (92) green, `npm pack --dry-run` = lib+src+README+LICENSE+CHANGELOG. **REMAINING (user, release-gating): write the README maintenance note, enable GitHub Pages, decide the `4.0.0-rc.0` prerelease.** All phases 1–8 + 10 complete. NEXT (after commit): user-owned release steps — no publish/push without explicit request.

---

## 1. Context

### What this library is

A swipeable-row list for React Native. Two public components:

- `SwipeRow` — a row with a hidden layer behind a visible layer; pan gesture reveals the hidden layer. Usable standalone.
- `SwipeListView` — wraps `FlatList` (or `SectionList` via `useSectionList`) and renders every row inside a `SwipeRow`, with cross-row bookkeeping (close others on open, close on scroll, imperative close-all, preview animation, etc.).

### v3 implementation (master)

- `components/SwipeRow.js` (~900 lines) and `components/SwipeListView.js` (~700 lines)
- Class components, `PanResponder` for gestures, `Animated` API (JS-driven where listeners are needed)
- Types triplicated: `prop-types`, Flow (`lib/flowtypes.js`), hand-written `types/index.d.ts`
- No build pipeline (ships raw JS), no library tests, stale tooling (eslint 6, prettier 1.18)
- Example app: `SwipeListExample/` — bare RN project with committed `ios/`/`android/`

### v4 goals

1. TypeScript source, generated type declarations (single source of type truth)
2. `react-native-gesture-handler` v2 (`Gesture.Pan`) + `react-native-reanimated` v3 — gestures and animation on the UI thread
3. Function components + hooks
4. **Prop-for-prop API compatibility with v3** except the breaking changes listed below
5. Real test suite, modern CI, Expo example app, migration guide

### Locked decisions

| Decision | Choice |
|---|---|
| Branch | `v4` (off master @ 3c3fa95) |
| Language | TypeScript 5, strict mode |
| Gestures | react-native-gesture-handler ≥2.14 (peer dep) |
| Animation | react-native-reanimated ≥3.6 (peer dep) |
| Peer deps | react ≥18.0.0, react-native ≥0.73.0, RNGH ≥2.14.0, Reanimated ≥3.6.0 |
| Build | react-native-builder-bob (commonjs + module + typescript targets → `lib/`) |
| Source layout | `src/` (new). v3 `components/`, `types/`, `lib/` deleted in final cleanup phase |
| Package | `main: lib/commonjs/index.js`, `module: lib/module/index.js`, `types: lib/typescript/index.d.ts`, `files: ["lib/", "src/"]` (ship `src/` so Expo/Metro can compile from source) |
| Example | Managed Expo app in `example/`, replaces `SwipeListExample/` |
| Tests | Jest + @testing-library/react-native |
| CI | GitHub Actions: lint + typecheck + test + build on PR/push |

### Breaking changes (keep this list exhaustive — it feeds the migration guide)

1. Peer dependencies: users must install `react-native-gesture-handler` and `react-native-reanimated`, and wrap their app root in `<GestureHandlerRootView>`.
2. Minimum versions: react 18, react-native 0.73.
3. ListView-era API **removed** (already non-functional — `ListView` no longer exists in RN core): `dataSource`, `renderRow`, `renderHiddenRow`, `renderListView`, `useFlatList`, `previewFirstRow`, `previewRowIndex`. *(Verified in Phase 2: `previewFirstRow`/`previewRowIndex` are only read in the legacy `renderRow`/`dataSource` path — SwipeListView.js:354-361 — so they are ListView-only and safe to remove.)*
4. `useNativeDriver` and `useAnimatedList` props removed (meaningless under Reanimated — everything is UI-thread). Accept-and-warn in dev, ignore at runtime (see Deprecation policy).
5. `onSwipeValueChange` still works but crosses to the JS thread per frame; new `swipeAnimatedValue` SharedValue path is the recommended replacement (see improvement C1).
6. `swipeGestureEnded` data payload: `event` is now an RNGH `GestureStateChangeEvent<PanGestureHandlerEventPayload>`; the PanResponder-specific `gestureState` field is removed. `translateX` and `direction` unchanged. (Discovered in Phase 2 — PanResponder types cannot survive the RNGH port.)
7. `rowMap` entries (and SwipeRow refs) are imperative handles (`closeRow`, `closeRowWithoutAnimation`, `manuallySwipeRow`, `isOpen`, new `swipeAnimatedValue`) instead of class component instances. The public method surface is identical, but undocumented internals (e.g. `currentTranslateX`) are no longer reachable.
8. `onScroll` must be a plain function. v3 accepted an `Animated.event` object (attached a listener via `__addListener`); v4 owns the scroll handler for close-on-scroll bookkeeping and ignores object handlers with a one-time dev warning. (Discovered in Phase 4 — composing Reanimated scroll handlers is not possible in 4.0; backlogged.)

Anything else discovered to be unavoidably breaking during implementation: add it here **and** to `docs/MIGRATION.md` in the same commit.

### Deprecation policy (core improvement C4)

- Props that are removed-but-harmless (`useNativeDriver`, `useFlatList`, `useAnimatedList`): accept them, emit a one-time `console.warn` in `__DEV__` naming the prop and the migration note, otherwise ignore.
- Props that cannot work (`dataSource`, `renderRow`, etc.): not in the TypeScript types; if passed anyway, dev-warn that they were removed in v4.
- Implement as a small `src/deprecations.ts` helper (`warnOnce(propName, message)`), unit-tested.

---

## 2. Core improvements in scope for v4.0

These were agreed with the maintainer. IDs are referenced throughout the phases.

- **C1 — SharedValue exposure.** Expose each row's translateX as a Reanimated SharedValue so users can drive `useAnimatedStyle` directly instead of the per-frame JS callback `onSwipeValueChange`. Surface: `renderItem`/`renderHiddenItem` receive `rowMap` entries (unchanged) **plus** SwipeRow gains a `swipeAnimatedValue` accessible via row ref, and `renderHiddenItem(rowData, rowMap, { swipeAnimatedValue })` style third argument (design the exact surface in Phase 3; keep `onSwipeValueChange` working for compat).
- **C2 — Explicit standalone-row path.** v3 detects a user-supplied `<SwipeRow>` returned from `renderItem` via child inspection + `React.cloneElement`. Keep that working for compat, but document the explicit path and mark the magic detection as deprecated in docs (removal in v5).
- **C4 — Deprecation warnings.** See Deprecation policy above.
- **C5 — Package hygiene.** `files` whitelist, ship `src/`, bob build, no committed build output.
- **C6 — Accessibility.** SwipeRow exposes `accessibilityActions` (custom actions `swipeleft` / `swiperight` when the corresponding open value is set) and `onAccessibilityAction` that opens/closes the row, so screen-reader users can reach hidden actions. Respect an `accessible`/override prop to opt out.
- **C9 — CI.** GitHub Actions workflow: lint, typecheck, test, build. Runs on push + PR.
- **C12 — Single internal list abstraction.** One internal code path parameterized over FlatList/SectionList instead of duplicated branches, so logic (renderCell wrapping, scroll handling, preview) exists once. Public `useSectionList` prop unchanged.

Also in core scope: **migration guide** (`docs/MIGRATION.md`) and **docs site** (Phase 8 — Docusaurus; reordered ahead of v3 removal at user request 2026-06-13).

---

## 3. Phases

### Phase 1 — Scaffolding & tooling  ☑

Goal: `v4` branch builds an empty-but-valid TypeScript library with CI green.

- [x] `package.json` rewrite: version `4.0.0`, entry points / `files` per Locked decisions, peer deps, devDeps (typescript ^5, react-native-builder-bob, RNGH, Reanimated, react/RN for local typecheck), scripts: `build` (bob build), `typecheck` (tsc --noEmit -p tsconfig.build.json), `lint`, `test`, `prepare` (bob build)
- [x] `tsconfig.json` (strict) + `tsconfig.build.json` (excludes `example/`, tests)
- [x] react-native-builder-bob config (targets: commonjs, module, typescript)
- [x] Modern ESLint flat config + prettier for `src/` (replace v3 eslint 6 setup)
- [x] Jest config with `react-native` preset + RNGH/Reanimated mocks (`react-native-gesture-handler/jestSetup`, `react-native-reanimated/mock`)
- [x] `src/` stubs: `index.ts`, `SwipeRow.tsx`, `SwipeListView.tsx`, `types.ts`, `constants.ts`, `deprecations.ts` — compiling placeholders only
- [x] **C9:** `.github/workflows/ci.yml` — install (`npm ci --legacy-peer-deps`), lint, typecheck, test, build; Node 20
- [x] Update `.gitignore` (`lib/`, example artifacts), `.npmignore` removed in favor of `files`
- [x] Do **not** delete v3 `components/`, `types/`, `lib/`, `SwipeListExample/` yet — they are the reference implementation during the rewrite; deletion happens in Phase 9 *(see deviation below re: `lib/`)*

Phase 1 notes / deviations:
- **`lib/` untracked early** (was scheduled for Phase 9 deletion): bob writes build output to `lib/`, so the tracked v3 `lib/index.js` (4-line re-export) would dirty the worktree on every build. Removed from git index and disk; content lives in git history (master) and is mirrored by `src/index.ts`. v3 reference code (`components/`, `types/`) untouched.
- **`yarn.lock` → `package-lock.json`** (user-confirmed 2026-06-10; revisit package manager later). Repo standardizes on npm: all plan commands are npm, CI uses `npm ci --legacy-peer-deps` (requires package-lock). Stale v3 yarn.lock deleted.
- `deprecations.ts` is a real (tiny) `warnOnce` implementation rather than an empty stub — it is the natural compiling placeholder; tests come in Phase 5.
- Smoke test `src/__tests__/index.test.ts` added so `npm test` exercises the jest/babel/RNGH/Reanimated-mock pipeline instead of passing on zero tests.
- Resolved toolchain: typescript 5.9.3, bob 0.33.3, eslint 9 (flat config), jest 29.7, react-native 0.76.5, reanimated 3.19.5, RNGH 2.31.2 (devDeps only; peer ranges per Locked decisions).

Verify: `npm run typecheck && npm run lint && npm test && npm run build` all pass locally; push-less CI check by running the same commands. Then user verifies → commit.

### Phase 2 — Types & constants  ☑

Goal: complete public TypeScript API, mirroring v3's `types/index.d.ts` minus removed props.

- [x] `src/constants.ts`: `DEFAULT_PREVIEW_OPEN_DELAY = 700`, `PREVIEW_CLOSE_DELAY = 300`, `MAX_VELOCITY_CONTRIBUTION = 5`, `SCROLL_LOCK_MILLISECONDS = 300` (values copied from v3 `components/SwipeRow.js`)
- [x] `src/types.ts`: `SwipeRowProps<T>`, `SwipeListViewProps<T>`, `RowMap<T>`, callback payload types (`SwipeValueChangeData`, action-status types), generic over item type; SectionList variants
- [x] Every kept v3 prop present with identical name, type, and documented default (use the API parity checklist in §4 as the authority)
- [x] Removed props absent from the types; deprecated-but-tolerated props typed as `never`-ish with `@deprecated` JSDoc so editors show strikethrough
- [x] `src/index.ts` re-exports components + all public types

Phase 2 notes / deviations (type-surface deltas vs v3 `types/index.d.ts`):
- **v3 .d.ts was incomplete** — `components/*.js` propTypes/runtime carry props the .d.ts never had. All added to v4 types and appended to §4: `forceCloseToLeftThreshold`, `forceCloseToRightThreshold`, `onForceCloseToLeft(End)`, `onForceCloseToRight(End)`, `swipeKey`, `onPreviewEnd`, row-level `previewOpenDelay`; list-level `onPreviewEnd`; instance method `manuallyOpenAllRows(toValue)`.
- **Runtime-faithful type corrections** (v3 .d.ts was wrong, not breaking): row-level `onLeftAction`/`onRightAction` take no args (SwipeRow.js:489,497 call them bare; .d.ts claimed `(rowKey, rowMap)`); `shouldItemUpdate` returns `boolean` (was `void`); row `onSwipeValueChange`/action-status payloads include optional `key` (= `swipeKey`); `listViewRef` receives the underlying `FlatList`/`SectionList` ref (.d.ts claimed `SwipeListView<T>`).
- `SwipeListViewProps<T>` is a discriminated union on `useSectionList` (flat vs section variants); section variant's `renderItem` gets `SectionListRenderItemInfo` (v3 typed both as `ListRenderItemInfo`).
- New exported types: `SwipeRowRef` (imperative handle, breaking change 7), `SwipeListViewRef` (`closeAllOpenRows` + `manuallyOpenAllRows`), `SharedSwipeProps`, payload types.
- Breaking changes 6 & 7 added (swipeGestureEnded payload; rowMap entries are handles).
- `docs/MIGRATION.md` living-draft skeleton created (user-approved scope addition): one section per breaking change, _TBD_ markers where Phase 3/6 fill code samples. See Working agreements.

Verify: typecheck passes; diff the exported type surface against v3 `types/index.d.ts` and record any intentional deltas in the Breaking changes list. User verifies → commit.

### Phase 3 — SwipeRow  ☑

Goal: full SwipeRow rewrite, behaviorally identical to v3 (`components/SwipeRow.js` is the spec — read it side-by-side while implementing).

Gesture & animation core:
- [x] Function component + `forwardRef`, imperative handle: `closeRow()`, `closeRowWithoutAnimation()`, `manuallySwipeRow(toValue, onAnimationEnd?)`, `isOpen` accessor — same surface v3 exposes to SwipeListView's rowMap
- [x] `Gesture.Pan()` with `activeOffsetX([-directionalDistanceChangeThreshold, directionalDistanceChangeThreshold])` and `failOffsetY([-10, 10])` so vertical scrolling wins; all gesture callbacks are worklets (`'worklet'` directive where not automatic)
- [x] translateX as `useSharedValue(0)`; gesture-internal tracking state (`prevTranslateX`, `prevDirection`, `isForceClosing`, `isOpen`, `leftActivated`, `rightActivated`) as SharedValues — **not** `useRef` (worklets can't read refs)
- [x] JS-only mutable state (`parentScrollEnabled` mirror, scroll-lock timer) as `useRef`
- [x] Open/close spring: `withSpring`, mapping v3 `Animated.spring` params via RN's Origami conversion `stiffness = (tension - 30) * 3.62 + 194`, `damping = (friction - 8) * 3 + 25`, `mass = 1`; honor `restSpeedThreshold` / `restDisplacementThreshold` via spring config. **(Phase 6: corrected from earlier naive `stiffness = tension` / `damping = friction*2*sqrt(tension)` mapping — too soft + overdamped → slow close/snap.)**
- [x] Swipe-release logic: replicate v3 thresholds exactly — `swipeToOpenPercent`, `swipeToClosePercent`, `swipeToOpenVelocityContribution` (clamped by `MAX_VELOCITY_CONTRIBUTION`), `stopLeftSwipe` / `stopRightSwipe` clamps, `disableLeftSwipe` / `disableRightSwipe`
- [x] `setScrollEnabled` fallback: on gesture start call `setScrollEnabled(false)` on parent list, re-enable on end with `SCROLL_LOCK_MILLISECONDS` safety timer (v3 behavior; RNGH makes it mostly redundant but per-row-behavior docs depend on it)
- [x] Preview animation: `withDelay(previewOpenDelay, withSequence(withTiming(previewOpenValue, {duration: previewDuration}), withDelay(PREVIEW_CLOSE_DELAY, withTiming(0))))`; support `previewRepeat` + `previewRepeatDelay`

Callbacks & layout:
- [x] All JS callbacks fired via `useAnimatedReaction` + `runOnJS`: `onRowOpen`/`onRowDidOpen`/`onRowClose`/`onRowDidClose` semantics (begin vs animation-settled), `swipeGestureBegan`, `swipeGestureEnded` (with event data per v3 signature), `onRowPress`, activation callbacks `onLeftAction`/`onRightAction`/`onLeftActionStatusChange`/`onRightActionStatusChange` driven by `leftActivationValue`/`rightActivationValue`/`leftActionValue`/`rightActionValue`/`initialLeftActionState`/`initialRightActionState`
- [x] `onSwipeValueChange({value, direction, isOpen, key})` via animated reaction (compat path)
- [x] Hidden-row layout measurement: `onLayout` of visible row sizes hidden container; honor `recalculateHiddenLayout` and `disableHiddenLayoutCalculation`
- [x] Two-children contract preserved (first child = hidden layer, second = visible); `closeOnRowPress` wraps visible row in touchable that closes when open
- [x] **C1:** expose `swipeAnimatedValue: SharedValue<number>` on the imperative handle (and therefore via rowMap); document as the preferred replacement for `onSwipeValueChange`
- [x] **C6:** `accessibilityActions` — include `{name: 'swipeleft'}` when `rightOpenValue` set, `{name: 'swiperight'}` when `leftOpenValue` set; `onAccessibilityAction` opens to the corresponding value (or closes if already open); allow user-supplied accessibility props to merge/override
- [x] **C4:** dev-warn on `useNativeDriver` prop

Phase 3 notes / deviations:
- **Velocity units**: v3 `gestureState.vx` is px/ms; RNGH `velocityX` is px/s. SwipeRow divides by 1000 before the `MAX_VELOCITY_CONTRIBUTION` clamp — without this the velocity contribution is 1000× off. Helpers take px/ms to keep v3-derived test cases verbatim.
- **v3 bug fixed**: SwipeRow.js:116 gated the *left* force-close listener on `forceCloseToRightThreshold > 0` (copy-paste bug — left force-close never worked unless the right threshold was also set). v4 gates on the left threshold.
- **v3 quirk fixed**: v3 only tracked swipe direction when `onSwipeValueChange` was set, so `swipeGestureEnded` reported `direction: null` otherwise. v4 always tracks direction.
- `event.preventDefault()` in `swipeGestureEnded` no longer suppresses row settling (RNGH events have no preventDefault) — folded into breaking change 6 / MIGRATION.md §6.
- `src/helpers.ts` extraction (threshold math, velocity projection, spring mapping) pulled forward from Phase 5; baseline tests written now (30 passing), Phase 5 extends.
- C6 surface: `accessible` / `accessibilityActions` / `onAccessibilityAction` props added to `SwipeRowProps` (types extension beyond Phase 2 snapshot). User-supplied `accessibilityActions` replace the defaults; `accessible={false}` opts out entirely.
- C1 surface decided: `swipeAnimatedValue` on the imperative handle/rowMap entries **and** injected into both children via cloneElement (v3 injected the Animated.Value the same way — now a SharedValue; documented in `SwipeRowChildInjectedProps`). No third `renderHiddenItem` argument needed.
- Dropped v3's non-standard `manipulationModes={['translateX']}` prop on the animated view (not an RN prop; no-op in modern RN).
- `Gesture.Pan` is recreated per render keyed on props (standard RNGH v2 usage); per-frame listener logic consolidated into one `useAnimatedReaction`.

Verify: typecheck + lint + unit tests for release-threshold math, callback firing, imperative handle (mock-level). Behavioral verification deferred to Phase 6 example app. User verifies → commit.

### Phase 4 — SwipeListView  ☑

Goal: full list wrapper, one internal abstraction (C12).

- [x] Function component + `forwardRef`; `useImperativeHandle` exposing `closeAllOpenRows()` and (passthrough) the underlying list ref via `listViewRef` callback prop
- [x] **C12:** single internal render pipeline; the only fork is which animated list component is rendered — `Animated.FlatList` vs `Animated.createAnimatedComponent(SectionList)` (see pitfalls for the cast). `useSectionList` prop selects it. All row bookkeeping, cell rendering, scroll handling shared.
- [x] Row registry: `rowMap` keyed by `keyExtractor` result (same key derivation as v3: `keyExtractor` → `item.key` fallback); refs to SwipeRow handles; expose rowMap to `renderItem`/`renderHiddenItem` exactly as v3 does
- [x] Open-row bookkeeping: track `openCellKey`; `closeOnRowOpen` closes previous row when a new one opens; `closeOnRowBeginSwipe` closes on swipe start; `closeOnRowPress` passthrough; `closeOnScroll` via scroll handler
- [x] Scroll: composed JS scroll handler (deviation — see notes); `onScrollEnabled(isEnabled)` callback when rows toggle parent scroll
- [x] `renderItem` wrapping: if `renderHiddenItem` provided → wrap user item + hidden item in internal `<SwipeRow>` carrying all per-row props; **C2:** if no `renderHiddenItem` and the returned element is a SwipeRow → attach ref/props via `cloneElement` (compat path, document as deprecated); per-row prop overrides from `item` data (v3 reads e.g. `item.leftOpenValue` — replicate exactly, check v3 source for the full per-row override list)
- [x] Preview: `previewRowKey` (+ `previewOpenDelay`, `previewOpenValue`, `previewDuration`, `previewRepeat`, `previewRepeatDelay`) routed to the matching row
- [x] iOS over-scroll close fix from v3: track y-offset + layout height, handle content-size shrink (v3 has explicit handling — port it)
- [x] All remaining v3 list props passed through to FlatList/SectionList untouched (it accepts arbitrary FlatList props)
- [x] **C4:** dev-warn on `useFlatList`, `useAnimatedList`, `useNativeDriver`; hard dev-warn (removed) on `dataSource`/`renderRow`/`renderHiddenRow`/`renderListView` (+ `previewFirstRow`/`previewRowIndex`, per breaking change 3)
- [x] `swipeRowStyle`, `shouldItemUpdate` honored

Phase 4 notes / deviations:
- **Scroll handler is a plain composed JS function, not `useAnimatedScrollHandler`** (deviation from the checklist line above): the bookkeeping (closeOnScroll, iOS offset tracking) is JS-side either way, and a plain handler hands the user's `onScroll` the real scroll event — `useAnimatedScrollHandler` + `runOnJS` would have required reconstructing it. Object `onScroll` handlers (`Animated.event`, Reanimated handlers) are unsupported → breaking change 8 + MIGRATION.md §8 + backlog B12.
- **v3 bug fixed**: per-item `item.onLeftAction`/`item.onRightAction` were never invoked — SwipeListView.js:251-260 short-circuits to *returning* the function instead of calling it (the item-level fn only suppressed the list-level callback). v4 calls the item-level fn, else falls back to the list-level `(key, rowMap)` callback.
- `closeAllOpenRows` reads `swipeAnimatedValue.value` (v3 read the undocumented `currentTranslateX` — same semantics, breaking change 7 already covers it).
- rowMap entries are deleted on row unmount (v3 left stale `null` entries in `_rows` forever; user-visible rowMap no longer contains nulls).
- `swipeKey` is now passed to rows in both render paths (wrapped + C2 clone, where a user-set `swipeKey` wins), so row-level callback payloads carry `key`; list-level `onSwipeValueChange`/action-status wrappers still inject `key` explicitly like v3.
- v3's `refreshing`-closes-open-row behavior (componentDidUpdate) ported as an every-render effect.
- C2 clone path overrides the user element's own `onRowOpen`/`onRowClose`/`onRowPress`/etc. with the list's bookkeeping wrappers — exactly v3's (surprising) behavior, preserved.

Verify: typecheck + lint + unit tests (rowMap bookkeeping, close-on-X flags, deprecation warnings). User verifies → commit.

### Phase 5 — Test suite  ☑

Goal: regression net for the API surface (C9 makes CI enforce it).

- [x] `src/__tests__/SwipeRow.test.tsx`: renders two children, imperative handle methods exist and fire callbacks, accessibility actions present/fire, deprecation warnings fire once
- [x] `src/__tests__/SwipeListView.test.tsx`: FlatList + SectionList render, rowMap keys correct, `closeAllOpenRows` calls each row, hidden item wrapping vs standalone-SwipeRow detection, per-row prop overrides from item data
- [x] `src/__tests__/deprecations.test.ts`: warnOnce behavior
- [x] Threshold/spring-mapping pure functions extracted to `src/helpers.ts` and unit-tested with exact v3-derived cases *(extraction + 30 baseline tests done in Phase 3; closing-branch activation-scaling asymmetry case added here)*
- [x] CI green on all of the above *(verified by running the CI command set locally — no push per working agreements)*

Phase 5 notes / deviations:
- **Extra test file `src/__tests__/SwipeListView.rowprops.test.tsx`**: mocks SwipeRow to capture per-row props, since gestures can't be simulated under the Reanimated jest mock. Covers per-row item-data overrides (incl. v3 `||` falsy-fallback semantics), item-level `onLeftAction`/`onRightAction` precedence (v3 bug fix), key injection into `onSwipeValueChange`/action-status payloads, preview routing, `swipeRowStyle`/`shouldItemUpdate`/`item` passthrough, `closeOnRowBeginSwipe`/`closeOnRowPress` bookkeeping, and `onScrollEnabled` plumbing.
- SwipeRow tests extended beyond the checklist line: C1 child prop injection, row-press handling (TouchableOpacity wrap, child `onPress` composition, `onRowPress` override), hidden-layout measurement (+ `disableHiddenLayoutCalculation`), preview/`onPreviewEnd`, two-children dev warning, `manuallySwipeRow` `onAnimationEnd`. SwipeListView tests gained `closeOnScroll` (via `fireEvent.scroll`), user `onScroll` passthrough, `refreshing` closes open row, and the iOS over-scroll `scrollToEnd` fix.
- **Test files are now strict-tsc clean**: fixed 17 pre-existing errors in the Phase 4 baseline tests (`noUncheckedIndexedAccess` index assertions, `toJSON()` cast via `unknown`). `npm run typecheck` (tsconfig.build.json) never covered tests; `npx tsc --noEmit` on the root tsconfig now passes as well.
- **Reanimated jest-mock limits** (affects what can be unit-tested): `useAnimatedReaction` is a no-op, so per-frame paths — `onSwipeValueChange` firing, force-close thresholds, activation-status crossings — and real pan gestures are not unit-testable. These are covered by the Phase 6 example-app manual checklist. `withSpring`/`withTiming` callbacks run synchronously, which is what makes the settle-callback tests (`onRowDidOpen`, `onAnimationEnd`, preview) possible.
- Total: 92 tests in 6 suites (was 50 after Phase 4).

Verify: `npm test` passes, coverage on `src/` reasonable (no hard gate). User verifies → commit.

### Phase 6 — Example app  ☑

Goal: manual regression suite + showcase. Replaces `SwipeListExample/` (deleted in Phase 9).

- [x] `example/`: managed Expo app (SDK 54, RN 0.81, Reanimated 4.1, RNGH 2.28), TypeScript, metro config resolving the library source from the repo root (`watchFolders` + `resolveRequest` — see notes)
- [x] Port all 8 v3 examples from `SwipeListExample/examples/` to TS: `basic`, `sectionlist`, `per_row_config`, `standalone_row`, `swipe_to_delete`, `swipe_value_based_ui`, `actions`, `close_row_manually`
- [x] `swipe_value_based_ui` ported twice: legacy `onSwipeValueChange` version (`swipe_value_based_ui_legacy.tsx`) AND new C1 `swipeAnimatedValue` + `useAnimatedStyle` version (`swipe_value_based_ui_reanimated.tsx`) — this is the flagship migration example
- [x] New example: accessibility demo (C6) — screen-reader actions (standalone row with action log + list)
- [x] **TEMPORARY v3/v4 runtime toggle** for the side-by-side comparison: `example/lib-switch.tsx` re-exports either the v4 source (`../src`) or the frozen v3 reference (`../components`); Metro resolves the package name to the switch, so all examples run unmodified on both implementations. Toggle in the App header remounts the active example. The two v4-only examples (SwipeValueShared, Accessibility) show a notice in v3 mode. **Removed in Phase 9** (depends on `components/`, which Phase 9 deletes).
- [x] Manual verification checklist executed on **iOS** (swipe open/close both directions, thresholds, preview, close-on-scroll, close-all, actions activation, standalone row, section list) — user-confirmed 2026-06-13
- [x] **Manual verification on Android** — user-confirmed 2026-06-13 (see Phase 10)
- [x] Record spring-feel comparison vs v3 using the in-app v3/v4 toggle — spring mapping corrected to RN Origami conversion (see §4 / §6); user-confirmed feel matches v3 on iOS

Phase 6 notes / deviations:
- **Expo SDK 54** resolved: react 19.1.0 / RN 0.81.5 / reanimated 4.1.1 / RNGH 2.28.0 / react-native-worklets 0.5.1. All within the library's peer ranges (`>=3.6.0` admits Reanimated 4; the v3-era Reanimated API the library uses is unchanged in 4). *(Initially scaffolded on SDK 56, downgraded: the App Store ships Expo Go 54.0.2 — SDK 55/56 Go clients are not published there, so user verification via Expo Go requires SDK 54.)*
- **Metro/Expo resolution setup** (replaces the planned `extraNodeModules` approach): `watchFolders: [repo root]`, `resolver.blockList` on the repo root's `node_modules` (second react copy), `resolver.resolveRequest` mapping the package name to `../src/index.ts`. Plus app.json `experiments.tsconfigPaths: false` (Metro otherwise applies the example tsconfig's types-only `paths` at runtime).
- **Example tsconfig**: `paths` pin `react`, `react/*`, `react-native`, RNGH and reanimated to the example's node_modules and `typeRoots` is restricted, so `npx tsc --noEmit` in `example/` typechecks the library source against React 19 types without the repo root's React 18 copies leaking in (TS 6 deprecates `baseUrl`; paths are relative).
- **Library fixes that fell out of example typechecking** (both compile-time only, no runtime change):
  - `SwipeListViewSectionListProps` now overrides `renderHiddenItem` with `SectionListRenderItemInfo` rowData (runtime always passed the same rowData to both renderers; the base type claiming `ListRenderItemInfo` was a v3 .d.ts inaccuracy carried into Phase 2).
  - C2 clone path casts the user SwipeRow element so `cloneElement` accepts `ref` under React 19 type definitions (React 18 root typecheck unaffected).
- Example ports adjusted for v4 API: `swipe_to_delete` drops the removed `useNativeDriver` list prop; `actions` converts the injected `swipeAnimatedValue` usage from `Animated.Value.interpolate` to `useAnimatedStyle` (it is a SharedValue in v4) and adds the now-mandatory `useNativeDriver` flags to its user-land RN Animated calls; components using hooks hoisted to module level.
- `actions` v3-toggle crash fix: under the v3 reference impl `swipeAnimatedValue` is an `Animated.Value`, which a `useAnimatedStyle` worklet can't capture (UI-thread serialization crash). The trash icon now detects the injected value's type (`isSharedValue`) and mounts either the Reanimated path (v4 SharedValue) or an `Animated.Value.interpolate` path (v3) — keeps the example version-agnostic per lib-switch's design.
- `close_row_manually` "press twice" fix: the v3-faithful port tracked the open row in `onRowDidOpen`, which fires only when the open spring fully settles to rest (~1s after it visually looks open, given the underdamped v3 spring + 0.001 rest thresholds). Pressing "Close Open Row" during that window saw a stale ref and no-opped. Switched to `onRowOpen` (fires at gesture release) — the correct signal for "which row is open." `onRowDidOpen`/`onRowDidClose` semantics in the library are unchanged (locked = "animation finished").
- `expo export --platform ios --platform android` bundles cleanly (992 modules, asset included) — this validates Metro+Babel compilation of the library source (worklets plugin included), not runtime behavior; that is the remaining on-device checklist.
- Local-machine note (not committed): the homebrew watchman install is broken (missing libfmt dylib); Expo's vendored metro defaults to its node crawler, so this did not block bundling.

Verify: every example runs without redbox on both platforms; behavior matches v3 reference. User verifies → commit.

### Phase 7 — Docs & migration guide  ☑

- **Author all markdown Docusaurus-friendly** (so Phase 8 is lift-and-deploy): relative intra-doc links (no GitHub-blob URLs), no repo-only path assumptions, ATX `#` headings with a single H1 per file, fenced code blocks with language tags, assets referenced by relative path. Keep README/CHANGELOG as standard GitHub/npm markdown; the migration + API docs are the ones Phase 8 ingests.
- [x] `docs/MIGRATION.md`: finalized — removed living-draft banner, filled the §5 `onSwipeValueChange` → `swipeAnimatedValue` before/after recipe (links to the legacy/reanimated example pair); all 8 breaking-change sections complete, no _TBD_ markers remain
- [x] `CHANGELOG.md`: created with the 4.0.0 entry — internals (TS/RNGH2/Reanimated3/C12/Origami spring), additions (C1 `swipeAnimatedValue`, C6 a11y, tooling/CI, example app), and all 8 breaking changes
- [x] README rewrite: v4 install (peer deps + Babel plugin + `GestureHandlerRootView`), quick start, links to the API docs + migration guide, CI badge; replaced the stale v2/ListView banner and `SwipeListExample` run instructions with the Expo `example/` app
- [x] Updated `docs/SwipeRow.md`, `docs/SwipeListView.md`, `docs/actions.md`, `docs/per-row-behavior.md`, `docs/manually-closing-rows.md` for v4 API; deleted `docs/migrating-to-flatlist.md` (obsolete)

Phase 7 notes / deviations:
- All intra-doc links converted to relative paths (Docusaurus-friendly); verified every relative link + the two MIGRATION anchors resolve.
- Docs authored against `src/types.ts` rather than mechanically generated from JSDoc (the checklist said "regenerated from JSDoc" — there is no generator; the v3 prop tables were already accurate and were edited in place): corrected the spring-prop notes (dead `facebook.github.io` links → Origami-mapping note), the `swipeGestureEnded` payload (RNGH event, no `gestureState`), and the `listViewRef` type; added the C1 `swipeAnimatedValue` section + imperative-handle table to `SwipeRow.md`, the imperative API (`closeAllOpenRows`/`manuallyOpenAllRows`) + a "Removed props" table to `SwipeListView.md`, and the C6 accessibility props.
- Minor pre-existing doc bug fixed while editing: the `manually-closing-rows.md` snippet used `{ ... }` (no `return`) for `renderHiddenItem` → changed to `( ... )`.
- Manual review of the docs themselves is deferred to the Phase 10 manual-review checklist (per user, 2026-06-13); this phase's commit ships the docs as code-complete.

Verify: phase committed as code-complete; thorough docs read-through tracked in Phase 10.

### Phase 8 — Docs site  ☑

> **Reordered before v3 removal (2026-06-13, user request):** building the site now,
> while the v3 reference (`components/`) and the example app's v3/v4 toggle still
> exist, is harmless and lets the docs site progress before the destructive cleanup.
> v3 removal + release prep moved to Phase 9.
>
> **Tool locked (2026-06-13): Docusaurus.** Chosen over VitePress/Nextra/Starlight for React+MDX (live examples / Snack embeds), built-in versioned docs (v3/v4/4.1), free GitHub Pages deploy, and RN-ecosystem familiarity (RN, RNGH, Reanimated all use it). Phase 7 markdown is authored Docusaurus-friendly so this phase is lift-and-deploy, not a rewrite.

- [x] Docusaurus 3.10.1 static site in `website/` (docs-only mode), deployed via GitHub Pages action (`.github/workflows/docs.yml`)
- [x] Pages: Getting started (`docs/intro.md`), SwipeListView API, SwipeRow API, Guides (actions / per-row / manual-close), Examples (`docs/examples.md` — example-app file table + Snack link), Migration v3→v4 — all build and render
- [x] CI job builds the site on every PR/push touching `docs/`/`website/`; uploads + deploys to GitHub Pages **only on `master`**

Phase 8 notes / deviations:
- **Docs-only site that reads the repo's top-level `../docs`** (single source of truth — same files GitHub renders), via the docs preset `path: '../docs'`, `routeBasePath: '/'`. No content duplicated into `website/`.
- Config hand-authored (not `create-docusaurus`) and kept as **`.js`** (`docusaurus.config.js`, `sidebars.js`) so no TS/ts-node toolchain is needed to build. Manual sidebar so the shared docs need **no Docusaurus frontmatter** (keeps them clean on GitHub) — the one exception is `docs/intro.md`, which carries a single `slug: /` line so it becomes the site home (otherwise nothing maps to `/` and `onBrokenLinks: 'throw'` fails on the navbar/footer root links).
- `markdown.format: 'detect'` → `.md` parsed as CommonMark (raw HTML passes through), so the existing HTML-heavy prop tables (`<code>`, `&#124;`) render without MDX/JSX parsing errors.
- **Two new shared docs added**: `docs/intro.md` (Getting started — install + quick start, also linked from README) and `docs/examples.md` (example-app overview).
- The two **example-source** links in `actions.md` / `per-row-behavior.md` were converted from repo-relative (`../example/...`) to absolute GitHub `blob/master` URLs — they point at source files, not doc pages, so they would 404 as site routes. Intra-doc `.md` links remain relative (work in both GitHub and the site).
- Favicon reused from `example/assets/favicon.png`. Snack link is still the v3 Snack (noted in `examples.md`); refresh post-release.
- `website/node_modules`, `build`, `.docusaurus` gitignored; `website/package-lock.json` committed (CI `npm ci` + cache key depend on it).

Verify: `npm run build` in `website/` succeeds with zero warnings; all 8 routes + sitemap generated. User reviews rendered site (`npm run serve` / `npm start`) → commit. Deploy wiring lands but only fires on `master`.

### Phase 9 — v3 removal & release prep  ◐

- [x] **Android manual verification** done in Phase 10 (2026-06-13) **before** this phase deleted the toggle — order preserved.
- [x] Delete `components/`, `types/`, `bin/dev.js` (only file in `bin/`, so removed `bin/`), `SwipeListExample/`. `lib/` was already untracked (Phase 1) — it is gitignored bob output, left on disk. `.flowconfig` absent. (76 tracked files removed.)
- [x] Remove the Phase 6 v3/v4 toggle: deleted `example/lib-switch.tsx`, dropped the toggle UI + `v4OnlyModes` notice from `example/App.tsx` (key is now just `mode`), repointed metro `resolveRequest` at `workspaceRoot/src/index.ts`, removed `prop-types` from `example/package.json`
- [x] `npm pack --dry-run` — tarball = `lib/` (commonjs+module+typescript) + `src/` + `package.json` + README + LICENSE + CHANGELOG (55 files, 51 kB). Added `CHANGELOG.md` to the `files` whitelist (npm does not auto-include it).
- [x] Fresh-clone install test: `npm ci --legacy-peer-deps && npm run build && npm test` — install clean (0 vuln), build clean, 92 tests pass
- [x] Tag readiness: version `4.0.0` in package.json ✓, CHANGELOG dated `2026-06-13` ✓, migration guide linked from README ✓
- [x] **Maintenance / absence note** — decided (2026-06-14) to put this in a pinned **GitHub Discussions announcement** (post-merge), NOT the README: a durable README line would go stale, a dated Discussion won't. README placeholder removed.
- [x] README: added "📖 Full documentation" link to the GitHub Pages site
- [x] package.json polish for the npm page: `homepage` (docs site), `bugs` (issues), `repository.url` normalized to `git+…​.git`
- [ ] One-time (user, repo admin): enable GitHub Pages with Source = "GitHub Actions" so `docs.yml` can deploy on `master`
- [ ] Decide npm `next` dist-tag prerelease (recommend `4.0.0-rc.0` on `next` first) — **ask user (no publish without explicit request)**

Phase 9 notes / deviations:
- `lib/` was already untracked since Phase 1 (bob build output) — nothing to delete from git; left on disk.
- `bin/` contained only `dev.js`, so the whole directory was removed.
- **`example/examples/actions.tsx` simplified**: the Phase-6 dual trash-icon path (`isSharedValue` + `ReanimatedTrash`/`LegacyTrash`) existed only to survive the v3 toggle. With v3 gone, `swipeAnimatedValue` is always a SharedValue, so it was reverted to the single inline `useAnimatedStyle` path. Example typechecks.
- `example/package-lock.json` still lists `prop-types` (stale, harmless — example is not published); refreshed on the next `npm install` in `example/`.
- Added `CHANGELOG.md` to package `files` so it ships in the tarball.

Verify: pack contents + fresh install (done, green). REMAINING (user): write the README maintenance note, enable GitHub Pages, decide on the `4.0.0-rc.0` prerelease. User verifies → commit. **Publishing/pushing only on explicit user request.**

### Phase 10 — Manual review & sign-off (final)  ☑

The running checklist of things the **user must manually review/verify** before
4.0.0 ships. Items land here from earlier phases as they are deferred; add more as
they come up. Each box is checked only by the user.

- [x] **Android manual verification** — full example-app checklist on Android (swipe open/close both directions, thresholds, preview, close-on-scroll, close-all, actions activation, standalone row, section list; spring feel matches v3). User-confirmed 2026-06-13. (iOS verified earlier in Phase 6.)
- [x] **Documentation & migration guide review** — README, `CHANGELOG.md`, `docs/MIGRATION.md`, `docs/*.md`, and the rendered Docusaurus site reviewed against the shipped v4 API. User-confirmed 2026-06-13.

---

## 4. API parity checklist

Authority for "functionality remains the same." Check each item when implemented **and** covered by a test or example. Source of truth for semantics: v3 `components/*.js` + `types/index.d.ts`.

### SwipeRow props
- [ ] `leftOpenValue` / `rightOpenValue`
- [ ] `leftActivationValue` / `rightActivationValue`
- [ ] `leftActionValue` / `rightActionValue`
- [ ] `initialLeftActionState` / `initialRightActionState`
- [ ] `stopLeftSwipe` / `stopRightSwipe`
- [ ] `friction` / `tension`
- [ ] `restSpeedThreshold` / `restDisplacementThreshold`
- [ ] `closeOnRowPress`
- [ ] `disableLeftSwipe` / `disableRightSwipe`
- [ ] `recalculateHiddenLayout` / `disableHiddenLayoutCalculation`
- [ ] `style`
- [ ] `preview` / `previewDuration` / `previewRepeat` / `previewRepeatDelay` / `previewOpenValue` / `previewOpenDelay`
- [ ] `directionalDistanceChangeThreshold`
- [ ] `swipeToOpenPercent` / `swipeToOpenVelocityContribution` / `swipeToClosePercent`
- [ ] `item`
- [ ] `onRowOpen` / `onRowDidOpen` / `onRowClose` / `onRowDidClose` (toValue signatures)
- [ ] `onRowPress`
- [ ] `onSwipeValueChange`
- [ ] `onLeftAction` / `onRightAction` / `onLeftActionStatusChange` / `onRightActionStatusChange`
- [ ] `swipeGestureBegan` / `swipeGestureEnded`
- [ ] `shouldItemUpdate`
- [ ] `setScrollEnabled` (internal prop from list)
- [ ] `swipeKey` (internal prop from list; settable on standalone rows) *(added Phase 2 — missing from v3 .d.ts)*
- [ ] `forceCloseToLeftThreshold` / `forceCloseToRightThreshold` *(added Phase 2 — missing from v3 .d.ts)*
- [ ] `onForceCloseToLeft` / `onForceCloseToRight` / `onForceCloseToLeftEnd` / `onForceCloseToRightEnd` *(added Phase 2 — missing from v3 .d.ts)*
- [ ] `onPreviewEnd` *(added Phase 2 — missing from v3 .d.ts)*
- [ ] ~~`useNativeDriver`~~ → C4 dev-warn
- [ ] NEW: `swipeAnimatedValue` exposure (C1)
- [ ] NEW: accessibility actions (C6)

### SwipeRow imperative handle
- [ ] `closeRow()`
- [ ] `closeRowWithoutAnimation()`
- [ ] `manuallySwipeRow(toValue, onAnimationEnd?)`
- [ ] `isOpen`

### SwipeListView props (beyond passthrough of all SwipeRow per-row props above)
- [ ] `renderItem(rowData, rowMap)` / `renderHiddenItem(rowData, rowMap)`
- [ ] `useSectionList`
- [ ] `keyExtractor` key derivation (+ `item.key` fallback)
- [ ] `closeOnScroll` / `closeOnRowPress` / `closeOnRowBeginSwipe` / `closeOnRowOpen`
- [ ] `previewRowKey`
- [ ] `swipeRowStyle`
- [ ] `listViewRef`
- [ ] `onRowOpen` / `onRowDidOpen` / `onRowClose` / `onRowDidClose` (rowKey, rowMap signatures)
- [ ] `onScrollEnabled`
- [ ] `swipeGestureBegan(rowKey)` / `swipeGestureEnded(rowKey, data)`
- [ ] `onSwipeValueChange({key, value, direction, isOpen})`
- [ ] Action callbacks with rowKey signatures
- [ ] Per-row overrides read from item data (verify full list against v3 source)
- [ ] Arbitrary FlatList/SectionList prop passthrough
- [ ] `onPreviewEnd` passthrough *(added Phase 2 — missing from v3 .d.ts)*
- [ ] `closeAllOpenRows()` imperative
- [ ] `manuallyOpenAllRows(toValue)` imperative *(added Phase 2 — undocumented v3 instance method)*
- [ ] ~~`useFlatList` / `useAnimatedList` / `useNativeDriver`~~ → C4 dev-warn
- [ ] ~~`dataSource` / `renderRow` / `renderHiddenRow` / `renderListView` / `previewFirstRow` / `previewRowIndex`~~ → removed, dev-warn (verify previewFirstRow/previewRowIndex are ListView-only before removing; if FlatList-era, keep them)

---

## 5. Post-4.0 backlog (4.1 and beyond — do NOT implement in v4.0)

- [ ] **B3 — `useSwipeRow()` hook** for standalone-row consumers (open/close/value access without refs)
- [ ] **B7 — RTL support**: `swapLeftAndRightInRTL` prop honoring `I18nManager.isRTL` (default false)
- [ ] **B8 — Haptic hook points**: guarantee `on(Left|Right)ActionStatusChange` fires exactly once per activation crossing with UI-thread-accurate timing; document haptics recipe
- [ ] **B10 — List component injection**: `renderListComponent` escape hatch enabling FlashList et al.
- [ ] **B11 — Built-in actions mode**: iOS-Mail-style full-swipe commit sugar (`rightActionElement` + `onRightAction` convenience API)
- [ ] **B12 — UI-thread scroll handler composition**: accept a user-supplied `useAnimatedScrollHandler` handler as `onScroll` and compose it with the list's close-on-scroll bookkeeping (see breaking change 8)
- [ ] **B-v5 — Remove** C2 magic SwipeRow detection and C4-tolerated props

---

## 6. Known pitfalls (lessons already learned — trust these)

- `npm install` needs `--legacy-peer-deps` with this dep matrix.
- react-native-builder-bob emits 3 warnings about the `exports` field format — non-blocking; omit `exports` field to silence.
- `Animated.createAnimatedComponent(SectionList)` needs a double cast: `as unknown as React.ComponentType<AnyProps>`. `Animated.FlatList` exists directly.
- Worklet-accessed mutable state must be `useSharedValue`, never `useRef` — refs silently read stale values inside worklets.
- All JS side effects from animation/gesture code go through `runOnJS` inside `useAnimatedReaction`/gesture callbacks.
- Spring mapping that matches v3 feel: RN Origami conversion `stiffness = (tension - 30) * 3.62 + 194`, `damping = (friction - 8) * 3 + 25`, `mass = 1`. v3 feeds tension/friction to `Animated.spring`, which runs this conversion internally before the stiffness/damping/mass physics — skipping it (naive `stiffness = tension`) gives a soft, overdamped, slow spring.
- Keep `tsconfig.build.json` excluding `example/` or bob builds the example app into `lib/`.
- Expo example app: metro needs explicit config to resolve the library from the repo root (watchFolders + resolver), or it bundles a stale node_modules copy.
- Expo example must target the SDK that Expo Go on the App Store supports (54 as of 2026-06; 55/56 Go clients unpublished) — newer SDKs error "Project is incompatible with this version of Expo Go".
- `experiments.tsconfigPaths: false` required in app.json — Metro otherwise applies the example tsconfig's types-only `paths` mappings at runtime (the CLI overrides the metro.config.js equivalent).
- If the example is ever upgraded to SDK 56+: its on-demand filesystem scopes lazy reads to the project root and wipes `watchFolders` on export → "Failed to get the SHA-1" on library source. Fix is app.json `experiments.onDemandFilesystem: "UNSTABLE_ALLOW_ALL"`.
- Typechecking the library source from a second project (example/) with a different React major: pin `react`, `react/*`, `react-native` via tsconfig `paths` and restrict `typeRoots`, or the other node_modules' @types/react leaks in via hierarchical resolution.

## 7. Working agreements

- One phase per session is a good unit; finishing mid-phase is fine — update checkboxes and Status line before stopping.
- User manually verifies each phase before its commit. Never push. Never publish.
- Commit messages: Conventional Commits (`feat:`, `chore:`, `test:`, `docs:`), one commit per phase unless user requests otherwise.
- Any deviation from this plan (new breaking change, API tweak, dropped item): record it in this file in the same commit.
- `docs/MIGRATION.md` is a living draft from Phase 2 onward: any new/changed breaking change updates **both** the §1 Breaking changes list (one-liner index) and its MIGRATION.md section in the same commit. Phase 7 only reviews/polishes.
- Delete this file when 4.0.0 ships.
