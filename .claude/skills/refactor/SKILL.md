---
name: refactor
description: "Improve the existing implementation while preserving intended behavior."
disable-model-invocation: true
---

# /refactor

Improve the existing implementation while preserving intended behavior.

Priorities:
1. correctness
2. readability
3. maintainability
4. testability
5. performance when justified

Avoid changing public behavior unless explicitly requested.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/refactor.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
