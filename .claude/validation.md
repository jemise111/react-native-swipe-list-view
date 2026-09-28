# Validating changes in the example app

Both `/next-issue` and `/maintenance` finish by proving the change works in the
example app (`example/`, an Expo dev-client app). Unit tests passing is not enough.

Helper: `.claude/scripts/sim.sh` (run with no args for usage). Screenshots and
logs go to `$SIM_OUT` (default `$TMPDIR/rnslv-validation`); read screenshots
with the Read tool to see them.

## 1. Local checks first

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

For example-app changes also run `cd example && npx tsc --noEmit`.

## 2. iOS or Android?

- **iOS only** — JS/TS logic, types, docs, small prop additions, example-only changes.
- **iOS + Android** — anything touching gestures, scrolling, scroll locking,
  animation timing, layout, or platform-specific code; bumps of
  react-native / Expo SDK / gesture-handler / reanimated / worklets; anything
  whose issue says Android.

## 3. Build and launch (iOS)

```bash
export SIM_OUT="${TMPDIR:-/tmp}/rnslv-validation"; mkdir -p "$SIM_OUT"
UDID=$(.claude/scripts/sim.sh udid)
cd example && npx expo run:ios --device "$UDID" > "$SIM_OUT/metro.log" 2>&1 </dev/null
```

- Run that `expo run:ios` command in the background (`run_in_background`) and
  wait on `$SIM_OUT/metro.log` for `Build Succeeded` / `iOS Bundled` / `error`.
  Do **not** set `CI=1` — it disables Fast Refresh and exits after launch.
- A full native build takes several minutes. It is required after native
  dependency changes; for JS-only changes an already-installed dev build is
  fine: `npx expo start --dev-client` (background, log to the same file) and
  `xcrun simctl launch "$UDID" com.jemise111.example`.
- Metro resolves `react-native-swipe-list-view` to `../src` (see
  `example/metro.config.js`), so library edits hot-reload; no `npm run build` needed.
- Don't open deep links with `simctl openurl` — iOS shows an "Open in…?"
  system alert that idb cannot tap.
- If the app shows a red error screen, read it (screenshot) and the Metro log
  before assuming the change is at fault; confirm the log shows `iOS Bundled`
  for `example/index.ts`.

## 4. Drive the app (iOS)

The example is a grid of tab buttons (`Basic`, `SectionList`, `PerRowConfig`,
`StandaloneRow`, `SwipeToDelete`, `SwipeValueLegacy`, `SwipeValueShared`,
`Actions`, `CloseRowManually`, `Accessibility`) above the list. Rows read
`I am item #N in a SwipeListView`.

```bash
S=.claude/scripts/sim.sh
$S tap-label SwipeToDelete          # switch example
$S labels                           # what's on screen (center x, y, label)
$S row-left "item #0 "              # open row 0 to the left (trailing space avoids #10)
$S row-right "item #1 "
$S row-full-left "item #0 "         # full swipe (delete)
$S tap-in-row "item #0 " Close      # tap row 0's hidden Close button
$S scroll-up
$S shot after-open                  # then Read the printed path
```

- Every row renders its hidden buttons, so there are many elements labelled
  `Close` / `Delete` — use `tap-in-row`, not `tap-label`, for them.
- Coordinates for raw `tap`/`swipe` are points (screenshot pixels ÷ 3 on @3x devices).
- Once a warning is logged, a LogBox toast ("Open debugger to view warnings")
  covers the bottom of the screen; avoid rows under it or dismiss it via its ✕.

## 5. Check the Metro log

Count warnings before and after each interaction to attribute them:

```bash
before=$($S warn-count); $S row-full-left "item #0 "; sleep 2; after=$($S warn-count)
$S warns        # distinct WARN/ERROR lines with counts
```

A change must not introduce new warnings or errors. Pre-existing ones (check
open issues, e.g. #646) are noted, not fixed, unless they're the task.

To locate the source of a warning, temporarily wrap `console.warn` in
`example/index.ts` to `console.log` a one-line `new Error().stack` — and remove
it before committing.

## 6. What to exercise

Always: the screen(s) for the change, plus a smoke pass of **Basic**
(open left, open right, tap Close, open another row → first auto-closes,
scroll while open) and **SwipeToDelete**.

For a new feature, add or extend an example screen in `example/examples/` and
register it in `componentMap` in `example/App.tsx`.

## 7. Android

```bash
emulator -list-avds; emulator -avd <name> -no-snapshot-save &   # if none running
cd example && npx expo run:android > "$SIM_OUT/metro-android.log" 2>&1 </dev/null   # background
S=.claude/scripts/sim.sh
$S a-shot android-start          # coordinates are pixels; read them off the screenshot
$S a-swipe 900 700 300 700
$S a-tap 540 300
```

`adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml "$SIM_OUT/"`
gives element bounds if you need exact positions.

## 8. Evidence for the PR

In the PR body, list each validation step and what was observed (e.g. "Basic:
swipe row 0 left → Close/Delete revealed; opening row 2 auto-closed row 0"),
platforms and versions (Expo SDK, RN, device/OS), and the Metro warning delta.

## 9. Clean up

Stop background Metro/build tasks you started, remove temporary debug code,
and never commit `example/ios` / `example/android` (gitignored).
