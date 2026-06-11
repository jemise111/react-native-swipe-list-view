---
description: Implement the next (or a specific) phase of the v4 rewrite per PLAN.md
argument-hint: [phase number]
---

Implement a phase of the v4 rewrite. Target phase: "$ARGUMENTS" (if empty, use the first
phase in PLAN.md with unchecked items).

1. Read `PLAN.md` in full. Confirm the current branch is `v4` (stop and tell the user if
   not). Report the Status line and which phase you are about to work on, then begin —
   do not wait for confirmation to start.
2. Implement ONLY that phase's unchecked items. v3 sources (`components/*.js`,
   `types/index.d.ts` on this branch) are the behavioral spec — read them side by side
   while implementing. Consult PLAN.md §6 (Known pitfalls) before fighting any
   build/tooling/Reanimated issue.
3. Run the phase's verification commands (typecheck, lint, test, build — as applicable
   per the phase's Verify line).
4. Update PLAN.md: check off completed items, update the Status line, and record any
   deviations or newly discovered breaking changes in the appropriate section.
5. STOP before committing. Present to the user: items completed, verification output
   summary, any deviations recorded, and a proposed commit message (Conventional
   Commits). The user verifies manually and gives explicit go-ahead before any commit.
   Never push.

If the phase cannot be completed in this session, still do steps 4-5 for the portion
done, and note in the Status line what remains.
