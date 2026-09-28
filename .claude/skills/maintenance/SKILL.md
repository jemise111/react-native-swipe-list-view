---
name: maintenance
description: Audit react-native-swipe-list-view for upkeep work (dependency and Expo SDK updates, peer-range drift, security advisories, CI/tooling, deprecation warnings), carry out the most valuable item, validate in the example app on the simulator, and open a PR. Run at the start of a fresh session.
argument-hint: "[focus, e.g. 'expo sdk' or 'ci' or '#648']"
disable-model-invocation: true
---

# /maintenance

Audit → pick one focused maintenance change → do it → validate in the example
app → open a PR. Anything too big for one run becomes an issue instead.
Never merge, publish, or tag.

If a focus was passed (`$ARGUMENTS`), audit only that area (or do that issue).

## 0. Start clean

```bash
git status --short          # must be clean; if not, stop and ask
git checkout master && git pull --ff-only
npm install --legacy-peer-deps
(cd example && npm install --legacy-peer-deps)
```

Read `CLAUDE.md` and `.claude/validation.md`.

## 1. Audit

Gather everything first, then decide. Run the independent checks in parallel.

**Existing maintenance issues and PRs**
```bash
gh issue list --state open --label maintenance --json number,title,labels
gh pr list --state open --json number,title,headRefName,author
```
Open Dependabot/Renovate PRs count as findings too (validate + update them
rather than duplicating).

**Library dependencies (root)**
```bash
npm outdated
npm audit --omit=dev
npm audit
```
- `dependencies`: this package should have none at runtime; flag any.
- `peerDependencies` (`react`, `react-native`, `react-native-gesture-handler`,
  `react-native-reanimated`): compare with the latest releases
  (`npm view <pkg> dist-tags --json`). A new **major** of a peer means: does the
  open-ended range (`>=x`) now claim support for something untested? → validate
  it in the example (see step 3) or file an issue.
- `devDependencies`: toolchain (TypeScript, ESLint, Jest, bob, Babel,
  `@types/*`) and the dev copies of RN/RNGH/Reanimated used by tests.

**Example app**
```bash
npm view expo dist-tags --json          # latest SDK vs example/package.json "expo"
(cd example && npx expo install --check)
(cd example && npm outdated)
```
A newer Expo SDK = a candidate upgrade (`npm install expo@^<sdk>` then
`npx expo install --fix`), which also moves RN / RNGH / Reanimated / worklets.

**Docs site**
```bash
(cd website && npm outdated && npm audit)
```

**CI and tooling**
- `.github/workflows/*.yml`: Node version (EOL?), action major versions
  (`actions/checkout`, `actions/setup-node`, etc.).
- `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/*`: stale
  instructions (e.g. commands that don't exist in `package.json` scripts).
- `CLAUDE.md` commands still accurate.

**Runtime deprecations**
Build and run the example (per `.claude/validation.md`), click through every
example screen, and collect `WARN`/`ERROR` lines from the Metro log
(`.claude/scripts/sim.sh warns`). Deprecation warnings coming from `src/` are
findings. Skip ones already tracked by an open issue.

## 2. Decide

Write a short audit report for the user: a table of findings with severity
(security > broken/EOL > new major available > minor/patch drift > cosmetic)
and effort. Then pick **one** coherent change for this run:

1. Security advisories affecting the published package or CI.
2. Something broken or EOL (e.g. CI Node version).
3. Example app → latest Expo SDK (this is how new RN/RNGH/Reanimated majors
   get validated against the library).
4. Grouped devDependency minor/patch bumps (one PR, e.g. "bump dev tooling").
5. Docs-site dependency bumps.

Group only changes that belong together. For every other finding worth doing
that isn't picked: check for an existing issue, and if none, create one
labelled `maintenance` + a `size:*` label with the problem, acceptance
criteria, and validation steps (same structure as existing issues). List the
issues you created in the final report.

Changes that alter the library's published surface (peer ranges, minimum
versions, dropping support for something) are not maintenance — file an issue
labelled `needs-design` (and `breaking` if applicable) instead.

## 3. Execute

```bash
git checkout -b chore/<short-slug>
```

- Use `--legacy-peer-deps` for installs in the root and example.
- For the example app use `npx expo install` so versions match the SDK.
- After an Expo SDK bump, `git diff example/` — keep intended changes
  (`package.json`, lockfile, `app.json` edits Expo made for the new SDK);
  revert incidental ones (e.g. `expo run` rewriting the `ios`/`android`
  scripts in `example/package.json` — they should stay `expo start --ios` /
  `expo start --android`).
- If a major tooling bump needs code/config changes (e.g. ESLint flat-config
  changes, TypeScript strictness), make them minimal.
- If a bump causes failures you can't resolve reasonably, revert that bump and
  file an issue with the error rather than forcing it.

## 4. Validate

Follow `.claude/validation.md`:

- Local checks: `npm run typecheck && npm run lint && npm test && npm run build`
  (+ `cd example && npx tsc --noEmit`); docs-site changes: `cd website && npm run build`.
- Simulator validation of the example — even for tooling-only changes, at least
  confirm the example builds, bundles, and the Basic + SwipeToDelete smoke pass works.
- **Android as well** for Expo SDK / React Native / gesture-handler /
  Reanimated / worklets changes.
- Compare Metro warnings before vs after: no new warnings from `src/`.

## 5. Commit and open the PR

Commit with conventional messages (`chore(deps): …`, `chore(example): …`,
`ci: …`). Show the user the summary and ask for approval before pushing:

```bash
git push -u origin HEAD
gh pr create --base master --title "chore: <summary>" --body-file <file>
```

PR body:

```markdown
## Summary
- what was updated (from → to) and why

## Audit
- findings table (short); issues created for deferred items: #…

## Validation
- Local: typecheck, lint, test (X passed), build
- iOS: <device / iOS>, Expo SDK <x>, RN <y> — steps → results, Metro warning delta
- Android: <same, or "not needed: reason">

Closes #N   <!-- if it resolves a maintenance issue -->
```

Do not merge. Report the PR URL and the list of issues created.

## 6. Clean up

Stop background Metro/build tasks, remove temporary debug code, leave the
branch checked out.
