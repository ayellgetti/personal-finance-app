---
name: react
description: "Focus on React implementation quality."
disable-model-invocation: true
---

# /react

Focus on React implementation quality.

Check:
- component responsibilities
- state ownership
- effects
- memoization
- rendering behavior
- accessibility
- loading/error/empty states
- form handling
- data fetching
- responsive behavior

Avoid unnecessary state and premature memoization.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/react.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
