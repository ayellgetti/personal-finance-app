---
name: alternatives
description: "Generate viable alternatives to the proposed solution."
disable-model-invocation: true
---

# /alternatives

Generate viable alternatives to the proposed solution.

For each alternative include:
- approach
- advantages
- disadvantages
- when to use it

Do not generate superficial variations of the same idea.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/alternatives.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
