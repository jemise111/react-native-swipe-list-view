---
description: Audit the v4 implementation against the PLAN.md §4 API parity checklist
---

Audit API parity between the v4 implementation in `src/` and the checklist in
PLAN.md §4, using v3 (`components/*.js`, `types/index.d.ts`) as the behavioral spec.

1. Read PLAN.md §4 and the current `src/` sources.
2. For every checklist item, classify it:
   - **OK** — checked and actually implemented (prop accepted, semantics wired, not just typed)
   - **FALSE-CHECKED** — checked in the plan but missing or incomplete in `src/`
   - **UNCHECKED-DONE** — implemented but not yet checked off
   - **MISSING** — unchecked and not implemented (expected for future phases; group by phase)
3. Also flag the reverse direction: anything exported from `src/` (props, types, methods)
   that is NOT on the checklist — surface additions must be deliberate and recorded in
   PLAN.md.
4. Report findings as a compact table grouped by classification. Propose PLAN.md checkbox
   corrections, but do not edit any file unless the user asks.
