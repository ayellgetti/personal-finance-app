---
name: review
description: "Perform a structured review."
disable-model-invocation: true
---

# /review

Perform a structured review.

Check:

- correctness
- maintainability
- architecture
- error handling
- security
- performance
- testing
- edge cases
- observability
- backwards compatibility

Classify findings as:
- Critical
- High
- Medium
- Low
- Suggestion

Do not manufacture issues. Explain evidence and recommended action.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/review.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
