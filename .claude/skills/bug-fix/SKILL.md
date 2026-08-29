---
name: bug-fix
description: "Diagnose and fix a defect without unrelated refactoring."
disable-model-invocation: true
---

# /bug-fix

Diagnose and fix a defect without unrelated refactoring.

1. Reproduce or gather evidence for the failure.
2. Identify the root cause and affected behavior.
3. Implement the smallest safe correction.
4. Add a regression test when practical.
5. Run focused tests, type checks, and lint required by the repository.
6. Review the diff for behavior changes and remaining risks.

Do not claim the defect is fixed unless the relevant verification passed.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/workflows/bug-fix.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
