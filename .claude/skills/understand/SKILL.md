---
name: understand
description: "Before changing anything, inspect the relevant repository files and explain your understanding."
disable-model-invocation: true
---

# /understand

Before changing anything, inspect the relevant repository files and explain your understanding.

Identify:
- current architecture
- relevant modules/files
- existing behavior
- dependencies
- constraints
- unknowns

Do not implement changes yet unless explicitly requested.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/understand.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
