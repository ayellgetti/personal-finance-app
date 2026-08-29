---
name: requirements
description: "Extract and organize requirements from the supplied material."
disable-model-invocation: true
---

# /requirements

Extract and organize requirements from the supplied material.

Separate:
- functional requirements
- non-functional requirements
- constraints
- assumptions
- dependencies
- open questions

Do not silently resolve ambiguous requirements.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/requirements.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
