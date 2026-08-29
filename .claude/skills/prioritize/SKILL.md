---
name: prioritize
description: "Prioritize items using impact, urgency, effort, dependencies, and risk."
disable-model-invocation: true
---

# /prioritize

Prioritize items using impact, urgency, effort, dependencies, and risk.

Provide:
- priority
- rationale
- recommended order

Use a simple framework unless the user specifies one.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/prioritize.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
