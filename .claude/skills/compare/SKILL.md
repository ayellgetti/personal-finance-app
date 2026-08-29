---
name: compare
description: "Compare the available options using consistent criteria."
disable-model-invocation: true
---

# /compare

Compare the available options using consistent criteria.

Include:
- strengths
- weaknesses
- complexity
- cost/effort
- risks
- scalability
- maintainability

Finish with a clear recommendation when enough information exists.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/compare.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
