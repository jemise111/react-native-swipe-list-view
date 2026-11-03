---
name: release
description: Prepare a react-native-swipe-list-view release — local checks, smoke-test the packed npm tarball in the example app the way consumers get it, open the version-bump PR, then hand the user the exact merge/publish/tag commands. Never pushes tags or publishes on its own.
argument-hint: "[version, e.g. 4.0.1 or 4.1.0-rc.0 — default: next patch]"
disable-model-invocation: true
---

# /release

Checks → tarball smoke test → release PR → hand-off. The user runs every
irreversible step (merge, `npm publish`, tag push, GitHub release) — npm needs
their web OTP anyway. Per CLAUDE.md, never publish or push tags yourself; pushing
the release branch and opening its PR is the only remote write, and only after
the user approves.

Why the tarball step exists: 4.0.0 shipped with a crash (#652) that only
appeared in the built `lib/commonjs` entry. The example app normally runs
`src/`, and nothing tested the published artifact. The smoke test in step 3
installs exactly what `npm publish` would upload and runs the app on it.

## 0. Preflight

```bash
git status --short                  # must be clean; if not, stop and ask
git checkout master && git pull --ff-only
npm install --legacy-peer-deps
(cd example && npm install --legacy-peer-deps)
npm view react-native-swipe-list-view dist-tags --json
git tag --sort=-creatordate | head -5
gh pr list --state open --json number,title
```

Read `CLAUDE.md`, `.claude/validation.md`, and the top of `CHANGELOG.md`.

**Pick the version.** Use `$ARGUMENTS` if given; otherwise propose one from
the `## [Unreleased]` section, following semver:

- only `### Fixed` → patch
- any `### Added` / `### Changed` (non-breaking) → minor
- anything breaking → major (only on the major-version milestone; issues
  labelled `breaking`)
- prerelease: `X.Y.Z-rc.N`, published with `--tag next`

Stop and ask if `[Unreleased]` is empty or missing, if the version doesn't
match what the changes imply, or if open PRs look like they should go in
first. Confirm the version with the user before going on.

## 1. Release branch, version, changelog

```bash
git checkout -b chore/release-<version>
npm version <version> --no-git-tag-version   # bumps package.json + lockfile
```

In `CHANGELOG.md`:
- rename `## [Unreleased]` to `## [<version>] - <YYYY-MM-DD>` (today), and
  leave a fresh empty `## [Unreleased]` above it only if the file used one
  before
- add a link reference next to the others at the bottom:
  `[<version>]: https://github.com/jemise111/react-native-swipe-list-view/releases/tag/v<version>`
- check that every entry links its issue/PR and reads well to consumers (it
  becomes the GitHub release notes)

## 2. Local checks

Run these locally before opening the PR (CI runs the same on the PR, but
catching failures here is faster). All must pass:

```bash
npm run typecheck && npm run lint && npm test && npm run build
(cd example && npx tsc --noEmit)
```

## 3. Smoke-test the packed tarball

```bash
R="${TMPDIR:-/tmp}/rnslv-release"; rm -rf "$R"; mkdir -p "$R"
npm pack --pack-destination "$R"          # runs `prepare` (bob build)
tar -tzf "$R"/react-native-swipe-list-view-<version>.tgz | sed 's|/[^/]*$||' | sort | uniq -c
```

Check the contents: `package/lib/{commonjs,module,typescript}`, `package/src`,
`README.md`, `CHANGELOG.md`, `LICENSE`, `package.json` — and **no**
`__tests__`, `example/`, `website/`, or dotfiles. Note the package size; flag
a big jump compared with the previous release (`npm view
react-native-swipe-list-view@<previous> dist.unpackedSize`).

Install it into the example **without saving** and run Metro with
`RNSLV_ENTRY=package`, so the package is resolved from `example/node_modules`
through its `package.json` the way a consumer's Metro does (see
`example/metro.config.js`):

```bash
cd example
npm install --no-save --legacy-peer-deps "$R"/react-native-swipe-list-view-<version>.tgz
git status --short .                      # package.json / lockfile must be unchanged
export SIM_OUT="${TMPDIR:-/tmp}/rnslv-validation"; mkdir -p "$SIM_OUT"
RNSLV_ENTRY=package npx expo start --clear > "$SIM_OUT/metro.log" 2>&1 </dev/null   # background
```

Then launch and drive the app per `.claude/validation.md`, with these release
specifics:

- **Confirm it bundled from the tarball:** the Metro log shows `iOS Bundled`
  after launch, with no red box.
- **Exercise:** the Basic smoke pass, SwipeToDelete, SectionList, and Actions
  (full swipes must log `onLeftAction` / `onRightAction` — that's the
  `runOnJS`-from-worklet path).
- **Warnings:** compare `sim.sh warns` against the previous release's known
  ones (open issues). No new warnings, and specifically no gesture-handler
  "callbacks are not worklets" warning.
- **Android:** also run it there if the release touches gestures, animation,
  layout, or peer-dependency ranges (validation.md §7).

Afterwards, put the example back to normal:

```bash
cd example && npm install --legacy-peer-deps   # drops the --no-save tarball
```

If anything fails, stop: fix it in its own PR, and start the release again
after that merges.

## 4. Commit and open the release PR

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): <version>"
```

Show the user the diff summary and smoke-test results, and ask before pushing.
Then:

```bash
git push -u origin HEAD
gh pr create --base master --title "chore(release): <version>" --body-file <file>
```

PR body: the changelog section for this version, then a **Validation** list
(local checks with test counts; CI status; tarball size and file count; each smoke-test
step → what was observed; device/OS, Expo SDK, RN/RNGH/Reanimated/worklets
versions; Metro warning delta). End with the attribution line.

## 5. Hand off

Don't merge, publish, or tag. Give the user this block with the values filled
in, and explain each step in a sentence:

```bash
# 1. merge once the PR's CI `check` passes (`gh pr checks <PR>`). --admin only
#    bypasses the required review, which the repo owner can't give themselves.
gh pr merge <PR> --merge --admin --delete-branch
git checkout master && git pull --ff-only

# 2. publish — needs your npm web OTP. Rebuilds via `prepare`.
npm publish                       # stable: goes to `latest`
# npm publish --tag next          # prerelease (-rc.N) instead
npm dist-tag add react-native-swipe-list-view@<version> next   # stable only: keep `next` from lagging behind `latest`

# 3. tag + GitHub release (notes = this version's CHANGELOG section)
git tag v<version> && git push origin v<version>
gh release create v<version> --title v<version> --notes-file <changelog-section-file>   # add --prerelease for -rc.N
```

Write the changelog section to a temp file for `--notes-file` first and give
the user its path.

## 6. After the user publishes

When the user says they've published:

```bash
npm view react-native-swipe-list-view dist-tags --json   # expected tags point at <version>
npm view react-native-swipe-list-view@<version> dist.unpackedSize
gh release view v<version>
```

For each issue fixed in this release: if it's still open, ask the user before
commenting "Released in <version>" and closing it. Update the project memory
notes with the release date and dist-tags.

## 7. Clean up

Stop the Metro you started, make sure
`example/` has no stray changes (`git status`), and delete `$R`.
