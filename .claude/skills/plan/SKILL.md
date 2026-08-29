---
name: plan
description: "Create an implementation plan before coding."
disable-model-invocation: true
---

# /plan

Create an implementation plan before coding.

Include:
- objective
- affected files/modules
- database changes
- backend changes
- frontend changes
- API changes
- tests
- migration/deployment considerations
- dependencies
- risks
- implementation order

Do not implement unless explicitly requested.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/plan.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
