---
name: check
description: "Perform a targeted correctness check."
disable-model-invocation: true
---

# /check

Perform a targeted correctness check.

Look for:
- logical errors
- missing cases
- contradictions
- invalid assumptions
- obvious implementation mistakes

Give actionable corrections.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/check.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
