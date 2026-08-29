---
name: simple
description: "Rewrite or explain the subject using the simplest useful language."
disable-model-invocation: true
---

# /simple

Rewrite or explain the subject using the simplest useful language.

Remove:
- unnecessary jargon
- unnecessary theory
- redundant details

Keep:
- important caveats
- exact numbers
- actionable information

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/simple.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
