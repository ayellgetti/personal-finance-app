---
name: analyze
description: "Analyze the supplied problem systematically."
disable-model-invocation: true
---

# /analyze

Analyze the supplied problem systematically.

Cover:
- current state
- key facts
- assumptions
- root causes
- options
- risks
- recommendation

Use evidence from the supplied context and distinguish inference from fact.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/analyze.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
