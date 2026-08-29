---
name: testing
description: "Design tests for the requested behavior."
disable-model-invocation: true
---

# /testing

Design tests for the requested behavior.

Include where appropriate:
- happy paths
- validation failures
- authorization failures
- boundary conditions
- concurrency
- database behavior
- integration behavior
- regression coverage

Prefer deterministic, maintainable tests.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/testing.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
