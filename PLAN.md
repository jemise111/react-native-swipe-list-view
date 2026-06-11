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

**Status:** Phase 0 complete (branch created, plan written). Next: Phase 1.

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
3. ListView-era API **removed** (already non-functional — `ListView` no longer exists in RN core): `dataSource`, `renderRow`, `renderHiddenRow`, `renderListView`, `useFlatList`, `previewFirstRow`, `previewRowIndex` (the index-based ones only if they are ListView-only — verify in source before removing).
4. `useNativeDriver` and `useAnimatedList` props removed (meaningless under Reanimated — everything is UI-thread). Accept-and-warn in dev, ignore at runtime (see Deprecation policy).
5. `onSwipeValueChange` still works but crosses to the JS thread per frame; new `swipeAnimatedValue` SharedValue path is the recommended replacement (see improvement C1).

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

Also in core scope: **migration guide** (`docs/MIGRATION.md`) and **docs site** (Phase 9 — optional, may be deferred to 4.1 if the maintainer prefers; ask before starting Phase 9).

---

## 3. Phases

### Phase 1 — Scaffolding & tooling  ☐

Goal: `v4` branch builds an empty-but-valid TypeScript library with CI green.

- [ ] `package.json` rewrite: version `4.0.0`, entry points / `files` per Locked decisions, peer deps, devDeps (typescript ^5, react-native-builder-bob, RNGH, Reanimated, react/RN for local typecheck), scripts: `build` (bob build), `typecheck` (tsc --noEmit -p tsconfig.build.json), `lint`, `test`, `prepare` (bob build)
- [ ] `tsconfig.json` (strict) + `tsconfig.build.json` (excludes `example/`, tests)
- [ ] react-native-builder-bob config (targets: commonjs, module, typescript)
- [ ] Modern ESLint flat config + prettier for `src/` (replace v3 eslint 6 setup)
- [ ] Jest config with `react-native` preset + RNGH/Reanimated mocks (`react-native-gesture-handler/jestSetup`, `react-native-reanimated/mock`)
- [ ] `src/` stubs: `index.ts`, `SwipeRow.tsx`, `SwipeListView.tsx`, `types.ts`, `constants.ts`, `deprecations.ts` — compiling placeholders only
- [ ] **C9:** `.github/workflows/ci.yml` — install (`npm ci --legacy-peer-deps` if needed), lint, typecheck, test, build; Node 20
- [ ] Update `.gitignore` (`lib/`, example artifacts), `.npmignore` removed in favor of `files`
- [ ] Do **not** delete v3 `components/`, `types/`, `lib/`, `SwipeListExample/` yet — they are the reference implementation during the rewrite; deletion happens in Phase 8

Verify: `npm run typecheck && npm run lint && npm test && npm run build` all pass locally; push-less CI check by running the same commands. Then user verifies → commit.

### Phase 2 — Types & constants  ☐

Goal: complete public TypeScript API, mirroring v3's `types/index.d.ts` minus removed props.

- [ ] `src/constants.ts`: `DEFAULT_PREVIEW_OPEN_DELAY = 700`, `PREVIEW_CLOSE_DELAY = 300`, `MAX_VELOCITY_CONTRIBUTION = 5`, `SCROLL_LOCK_MILLISECONDS = 300` (values copied from v3 `components/SwipeRow.js`)
- [ ] `src/types.ts`: `SwipeRowProps<T>`, `SwipeListViewProps<T>`, `RowMap<T>`, callback payload types (`SwipeValueChangeData`, action-status types), generic over item type; SectionList variants
- [ ] Every kept v3 prop present with identical name, type, and documented default (use the API parity checklist in §4 as the authority)
- [ ] Removed props absent from the types; deprecated-but-tolerated props typed as `never`-ish with `@deprecated` JSDoc so editors show strikethrough
- [ ] `src/index.ts` re-exports components + all public types

Verify: typecheck passes; diff the exported type surface against v3 `types/index.d.ts` and record any intentional deltas in the Breaking changes list. User verifies → commit.

### Phase 3 — SwipeRow  ☐

Goal: full SwipeRow rewrite, behaviorally identical to v3 (`components/SwipeRow.js` is the spec — read it side-by-side while implementing).

Gesture & animation core:
- [ ] Function component + `forwardRef`, imperative handle: `closeRow()`, `closeRowWithoutAnimation()`, `manuallySwipeRow(toValue, onAnimationEnd?)`, `isOpen` accessor — same surface v3 exposes to SwipeListView's rowMap
- [ ] `Gesture.Pan()` with `activeOffsetX([-directionalDistanceChangeThreshold, directionalDistanceChangeThreshold])` and `failOffsetY([-10, 10])` so vertical scrolling wins; all gesture callbacks are worklets (`'worklet'` directive where not automatic)
- [ ] translateX as `useSharedValue(0)`; gesture-internal tracking state (`prevTranslateX`, `prevDirection`, `isForceClosing`, `isOpen`, `leftActivated`, `rightActivated`) as SharedValues — **not** `useRef` (worklets can't read refs)
- [ ] JS-only mutable state (`parentScrollEnabled` mirror, scroll-lock timer) as `useRef`
- [ ] Open/close spring: `withSpring`, mapping v3 `Animated.spring` params: `stiffness = tension`, `damping = friction * 2 * Math.sqrt(tension)`; honor `restSpeedThreshold` / `restDisplacementThreshold` via spring config
- [ ] Swipe-release logic: replicate v3 thresholds exactly — `swipeToOpenPercent`, `swipeToClosePercent`, `swipeToOpenVelocityContribution` (clamped by `MAX_VELOCITY_CONTRIBUTION`), `stopLeftSwipe` / `stopRightSwipe` clamps, `disableLeftSwipe` / `disableRightSwipe`
- [ ] `setScrollEnabled` fallback: on gesture start call `setScrollEnabled(false)` on parent list, re-enable on end with `SCROLL_LOCK_MILLISECONDS` safety timer (v3 behavior; RNGH makes it mostly redundant but per-row-behavior docs depend on it)
- [ ] Preview animation: `withDelay(previewOpenDelay, withSequence(withTiming(previewOpenValue, {duration: previewDuration}), withDelay(PREVIEW_CLOSE_DELAY, withTiming(0))))`; support `previewRepeat` + `previewRepeatDelay`

Callbacks & layout:
- [ ] All JS callbacks fired via `useAnimatedReaction` + `runOnJS`: `onRowOpen`/`onRowDidOpen`/`onRowClose`/`onRowDidClose` semantics (begin vs animation-settled), `swipeGestureBegan`, `swipeGestureEnded` (with event data per v3 signature), `onRowPress`, activation callbacks `onLeftAction`/`onRightAction`/`onLeftActionStatusChange`/`onRightActionStatusChange` driven by `leftActivationValue`/`rightActivationValue`/`leftActionValue`/`rightActionValue`/`initialLeftActionState`/`initialRightActionState`
- [ ] `onSwipeValueChange({value, direction, isOpen, key})` via animated reaction (compat path)
- [ ] Hidden-row layout measurement: `onLayout` of visible row sizes hidden container; honor `recalculateHiddenLayout` and `disableHiddenLayoutCalculation`
- [ ] Two-children contract preserved (first child = hidden layer, second = visible); `closeOnRowPress` wraps visible row in touchable that closes when open
- [ ] **C1:** expose `swipeAnimatedValue: SharedValue<number>` on the imperative handle (and therefore via rowMap); document as the preferred replacement for `onSwipeValueChange`
- [ ] **C6:** `accessibilityActions` — include `{name: 'swipeleft'}` when `rightOpenValue` set, `{name: 'swiperight'}` when `leftOpenValue` set; `onAccessibilityAction` opens to the corresponding value (or closes if already open); allow user-supplied accessibility props to merge/override
- [ ] **C4:** dev-warn on `useNativeDriver` prop

Verify: typecheck + lint + unit tests for release-threshold math, callback firing, imperative handle (mock-level). Behavioral verification deferred to Phase 6 example app. User verifies → commit.

### Phase 4 — SwipeListView  ☐

Goal: full list wrapper, one internal abstraction (C12).

- [ ] Function component + `forwardRef`; `useImperativeHandle` exposing `closeAllOpenRows()` and (passthrough) the underlying list ref via `listViewRef` callback prop
- [ ] **C12:** single internal render pipeline; the only fork is which animated list component is rendered — `Animated.FlatList` vs `Animated.createAnimatedComponent(SectionList)` (see pitfalls for the cast). `useSectionList` prop selects it. All row bookkeeping, cell rendering, scroll handling shared.
- [ ] Row registry: `rowMap` keyed by `keyExtractor` result (same key derivation as v3: `keyExtractor` → `item.key` fallback); refs to SwipeRow handles; expose rowMap to `renderItem`/`renderHiddenItem` exactly as v3 does
- [ ] Open-row bookkeeping: track `openCellKey`; `closeOnRowOpen` closes previous row when a new one opens; `closeOnRowBeginSwipe` closes on swipe start; `closeOnRowPress` passthrough; `closeOnScroll` via scroll handler
- [ ] Scroll: `useAnimatedScrollHandler` calling `runOnJS(onScrollJS)(offsetY)`; compose with user's `onScroll`; `onScrollEnabled(isEnabled)` callback when rows toggle parent scroll
- [ ] `renderItem` wrapping: if `renderHiddenItem` provided → wrap user item + hidden item in internal `<SwipeRow>` carrying all per-row props; **C2:** if no `renderHiddenItem` and the returned element is a SwipeRow → attach ref/props via `cloneElement` (compat path, document as deprecated); per-row prop overrides from `item` data (v3 reads e.g. `item.leftOpenValue` — replicate exactly, check v3 source for the full per-row override list)
- [ ] Preview: `previewRowKey` (+ `previewOpenDelay`, `previewOpenValue`, `previewDuration`, `previewRepeat`, `previewRepeatDelay`) routed to the matching row
- [ ] iOS over-scroll close fix from v3: track y-offset + layout height, handle content-size shrink (v3 has explicit handling — port it)
- [ ] All remaining v3 list props passed through to FlatList/SectionList untouched (it accepts arbitrary FlatList props)
- [ ] **C4:** dev-warn on `useFlatList`, `useAnimatedList`, `useNativeDriver`; hard dev-warn (removed) on `dataSource`/`renderRow`/`renderHiddenRow`/`renderListView`
- [ ] `swipeRowStyle`, `shouldItemUpdate` honored

Verify: typecheck + lint + unit tests (rowMap bookkeeping, close-on-X flags, deprecation warnings). User verifies → commit.

### Phase 5 — Test suite  ☐

Goal: regression net for the API surface (C9 makes CI enforce it).

- [ ] `src/__tests__/SwipeRow.test.tsx`: renders two children, imperative handle methods exist and fire callbacks, accessibility actions present/fire, deprecation warnings fire once
- [ ] `src/__tests__/SwipeListView.test.tsx`: FlatList + SectionList render, rowMap keys correct, `closeAllOpenRows` calls each row, hidden item wrapping vs standalone-SwipeRow detection, per-row prop overrides from item data
- [ ] `src/__tests__/deprecations.test.ts`: warnOnce behavior
- [ ] Threshold/spring-mapping pure functions extracted to `src/helpers.ts` and unit-tested with exact v3-derived cases
- [ ] CI green on all of the above

Verify: `npm test` passes, coverage on `src/` reasonable (no hard gate). User verifies → commit.

### Phase 6 — Example app  ☐

Goal: manual regression suite + showcase. Replaces `SwipeListExample/` (deleted in Phase 8).

- [ ] `example/`: managed Expo app (current SDK), TypeScript, metro config resolving the library from repo root (`watchFolders` + `extraNodeModules`)
- [ ] Port all 8 v3 examples from `SwipeListExample/examples/` to TS: `basic`, `sectionlist`, `per_row_config`, `standalone_row`, `swipe_to_delete`, `swipe_value_based_ui`, `actions`, `close_row_manually`
- [ ] `swipe_value_based_ui` ported twice: legacy `onSwipeValueChange` version AND new C1 `swipeAnimatedValue` + `useAnimatedStyle` version — this is the flagship migration example
- [ ] New example: accessibility demo (C6) — screen-reader actions
- [ ] Manual verification checklist executed on iOS + Android (simulator/emulator or device): swipe open/close both directions, thresholds, preview, close-on-scroll, close-all, actions activation, standalone row, section list
- [ ] Record spring-feel comparison vs v3 example app (run `SwipeListExample` from master for side-by-side); tune mapping if perceptibly different

Verify: every example runs without redbox on both platforms; behavior matches v3 reference. User verifies → commit.

### Phase 7 — Docs & migration guide  ☐

- [ ] `docs/MIGRATION.md`: every entry from the Breaking changes list with before/after code; install instructions (RNGH + Reanimated + babel plugin + GestureHandlerRootView); `onSwipeValueChange` → `swipeAnimatedValue` recipe; removed-props table
- [ ] `CHANGELOG.md`: 4.0.0 entry — breaking changes, new features (C1, C6), internals note
- [ ] README rewrite: new install section, quick start, props tables regenerated from `src/types.ts` JSDoc, link migration guide, badge for CI
- [ ] Update `docs/SwipeRow.md`, `docs/SwipeListView.md`, `docs/actions.md`, `docs/per-row-behavior.md`, `docs/manually-closing-rows.md` for v4 API; delete `docs/migrating-to-flatlist.md` (obsolete)

Verify: docs review by user → commit.

### Phase 8 — v3 removal & release prep  ☐

- [ ] Delete `components/`, `types/`, `lib/` (committed v3 build output), `bin/dev.js` (v3 dev script), `SwipeListExample/`, `.flowconfig` remnants, old eslint files if superseded
- [ ] `npm pack --dry-run` — confirm tarball contains exactly `lib/`, `src/`, README, LICENSE, CHANGELOG
- [ ] Fresh-clone install test: `npm ci && npm run build && npm test`
- [ ] Tag readiness checklist: version 4.0.0 in package.json, CHANGELOG dated, migration guide linked from README
- [ ] Decide npm `next` dist-tag prerelease (recommend `4.0.0-rc.0` on `next` first) — ask user

Verify: pack contents + fresh install. User verifies → commit. **Publishing/pushing only on explicit user request.**

### Phase 9 — Docs site (optional core — confirm with user before starting)  ☐

- [ ] Docusaurus (or similar static site) in `website/`, deployed via GitHub Pages action
- [ ] Pages: Getting started, SwipeRow API, SwipeListView API, Migration v3→v4, Examples (embed expo snack links where possible)
- [ ] CI job to build site; deploy on master/main merges only

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
- [ ] `closeAllOpenRows()` imperative
- [ ] ~~`useFlatList` / `useAnimatedList` / `useNativeDriver`~~ → C4 dev-warn
- [ ] ~~`dataSource` / `renderRow` / `renderHiddenRow` / `renderListView` / `previewFirstRow` / `previewRowIndex`~~ → removed, dev-warn (verify previewFirstRow/previewRowIndex are ListView-only before removing; if FlatList-era, keep them)

---

## 5. Post-4.0 backlog (4.1 and beyond — do NOT implement in v4.0)

- [ ] **B3 — `useSwipeRow()` hook** for standalone-row consumers (open/close/value access without refs)
- [ ] **B7 — RTL support**: `swapLeftAndRightInRTL` prop honoring `I18nManager.isRTL` (default false)
- [ ] **B8 — Haptic hook points**: guarantee `on(Left|Right)ActionStatusChange` fires exactly once per activation crossing with UI-thread-accurate timing; document haptics recipe
- [ ] **B10 — List component injection**: `renderListComponent` escape hatch enabling FlashList et al.
- [ ] **B11 — Built-in actions mode**: iOS-Mail-style full-swipe commit sugar (`rightActionElement` + `onRightAction` convenience API)
- [ ] **B-v5 — Remove** C2 magic SwipeRow detection and C4-tolerated props

---

## 6. Known pitfalls (lessons already learned — trust these)

- `npm install` needs `--legacy-peer-deps` with this dep matrix.
- react-native-builder-bob emits 3 warnings about the `exports` field format — non-blocking; omit `exports` field to silence.
- `Animated.createAnimatedComponent(SectionList)` needs a double cast: `as unknown as React.ComponentType<AnyProps>`. `Animated.FlatList` exists directly.
- Worklet-accessed mutable state must be `useSharedValue`, never `useRef` — refs silently read stale values inside worklets.
- All JS side effects from animation/gesture code go through `runOnJS` inside `useAnimatedReaction`/gesture callbacks.
- Spring mapping that matches v3 feel: `stiffness = tension`, `damping = friction * 2 * Math.sqrt(tension)`.
- Keep `tsconfig.build.json` excluding `example/` or bob builds the example app into `lib/`.
- Expo example app: metro needs explicit config to resolve the library from the repo root (watchFolders + resolver), or it bundles a stale node_modules copy.

## 7. Working agreements

- One phase per session is a good unit; finishing mid-phase is fine — update checkboxes and Status line before stopping.
- User manually verifies each phase before its commit. Never push. Never publish.
- Commit messages: Conventional Commits (`feat:`, `chore:`, `test:`, `docs:`), one commit per phase unless user requests otherwise.
- Any deviation from this plan (new breaking change, API tweak, dropped item): record it in this file in the same commit.
- Delete this file when 4.0.0 ships.
