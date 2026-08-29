---
name: implement
description: "Implement the approved/requested solution."
disable-model-invocation: true
---

# /implement

Implement the approved/requested solution.

Rules:
- inspect existing conventions first
- make focused changes
- avoid unrelated refactors
- preserve existing behavior unless requested
- update tests
- run relevant validation when tools are available
- report changed files and verification results

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/implement.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
