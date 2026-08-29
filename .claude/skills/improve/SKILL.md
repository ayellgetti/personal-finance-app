---
name: improve
description: "Improve the supplied solution while keeping its intent."
disable-model-invocation: true
---

# /improve

Improve the supplied solution while keeping its intent.

Look for:
- clarity
- correctness
- maintainability
- UX
- performance
- security
- simplicity

Give the improved version, not only a critique.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/improve.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
