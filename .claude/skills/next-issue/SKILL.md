---
name: next-issue
description: Pick the next appropriate open GitHub issue for react-native-swipe-list-view, implement it, validate it in the example app on the simulator, and open a PR. Run at the start of a fresh session.
argument-hint: "[issue number]"
disable-model-invocation: true
---

# /next-issue

End-to-end: choose an issue → implement → validate in the example app → open a PR.
One issue per run. Never merge, publish, or tag.

If an issue number was passed (`$ARGUMENTS`), use that issue and skip step 1's
selection (still read it and check it's ready).

## 0. Start clean

```bash
git status --short          # must be clean; if not, stop and ask
git checkout master && git pull --ff-only
npm install --legacy-peer-deps   # plain npm install fails on peer conflicts
```

Read `CLAUDE.md` and `.claude/validation.md`.

## 1. Pick the issue

```bash
gh issue list --state open --limit 100 --json number,title,labels,milestone \
  --jq '.[]|"#\(.number) [\(.milestone.title // "-")] [\(.labels|map(.name)|join(","))] \(.title)"'
gh pr list --state open --json number,title,headRefName
```

Selection rules, in order:

1. Only issues labelled `ready`. Skip `needs-design`, and skip `breaking` unless
   the lowest open milestone is a major version (e.g. `5.0`).
2. Skip issues already covered by an open PR (check PR titles/branches for `#N`)
   and issues whose body says "Blocked by #M" where #M is still open.
3. Lowest open milestone first (compare as versions: 4.1 < 4.2 < 5.0). Issues
   with no milestone (usually `maintenance`) are left to `/maintenance`.
4. Within the milestone: `bug` before `enhancement`, then `size:S` < `size:M` <
   `size:L`, then lowest issue number.

Tell the user which issue you picked and why (one or two lines), then proceed.
If nothing qualifies, report what's blocking (e.g. everything is
`needs-design`) and stop.

## 2. Understand it

```bash
gh issue view <N> --comments
```

- The issue body's **Acceptance criteria** and **Validation** sections are the
  definition of done. Read comments for later decisions.
- Read the relevant source (`src/SwipeRow.tsx`, `src/SwipeListView.tsx`,
  `src/helpers.ts`, `src/types.ts`), existing tests (`src/__tests__/`), docs
  (`docs/`), and the example screen(s) involved.
- If the issue leaves a genuine API decision open that isn't answered by the
  body or comments, ask the user before writing code. Don't invent public API
  beyond what the issue describes.

## 3. Implement

```bash
git checkout -b <type>/<N>-<short-slug>     # type: fix | feat | chore | docs
```

Definition of done — all of:

- Library change in `src/`, following existing patterns: TypeScript, function
  components + hooks, Reanimated shared values via `useSharedValue` (not
  `useRef`) for anything read in worklets, `'worklet'` directive on helpers
  used from the UI thread.
- Public types updated in `src/types.ts` and exported from `src/index.ts` if new.
- Jest tests for new logic (prefer testing pure helpers).
- Docs updated: `docs/SwipeRow.md` / `docs/SwipeListView.md` / other relevant
  page; `docs/MIGRATION.md` if behavior users relied on changes.
- `CHANGELOG.md`: add the entry under `## [Unreleased]` (create that heading
  above the latest release if missing), in the existing Keep a Changelog style.
- Example app: extend the relevant screen, or add a new one in
  `example/examples/` registered in `componentMap` in `example/App.tsx`, so the
  change can be seen and exercised.
- No backwards-incompatible change unless the issue is labelled `breaking`.
- Keep `tsconfig.build.json` excluding `example/` and `website/`.

Keep the diff focused on the issue. Unrelated problems you notice → mention in
the PR body or open a new issue; don't fix them here.

## 4. Validate

Follow `.claude/validation.md`:

1. Local checks: `npm run typecheck && npm run lint && npm test && npm run build`
   (+ `cd example && npx tsc --noEmit`). All must pass.
2. Simulator: iOS always; Android too when the change touches gestures,
   scrolling, animation, layout, native deps, or platform code.
3. Walk through every item in the issue's **Validation** section, plus the
   Basic + SwipeToDelete smoke pass. Screenshot key states and read them.
4. Metro log: no new warnings/errors attributable to the change.

If validation fails, fix and re-validate. If you can't get it working after a
reasonable effort, stop and report what you tried — don't open a PR for
unvalidated work.

## 5. Commit and open the PR

Commit in logical commits (conventional style: `feat(swiperow): …`,
`fix(swipelistview): …`). Then show the user a summary and ask for approval
before pushing:

```bash
git push -u origin HEAD
gh pr create --base master --title "<type>: <summary> (#N)" --body-file <file>
```

PR body:

```markdown
Closes #N

## Summary
- what changed and why (API, behavior)

## Validation
- Local: typecheck, lint, test (X passed), build
- iOS: <device / iOS version>, Expo SDK <x>, RN <y>
  - <step> → <observed result>
  - Metro log: <no new warnings | details>
- Android: <same, or "not needed: reason">

## Notes
- follow-ups / anything reviewers should look at
```

Do not merge. Report the PR URL to the user.

## 6. Clean up

Stop any background Metro/build tasks you started and remove temporary debug
code. Leave the branch checked out.
