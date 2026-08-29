---
name: regression
description: "Focus on preventing the reported bug or change from returning."
disable-model-invocation: true
---

# /regression

Focus on preventing the reported bug or change from returning.

Identify:
- previous broken behavior
- corrected behavior
- regression test needed
- edge cases
- related code paths

Add or recommend a deterministic regression test.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/regression.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
