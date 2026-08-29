---
name: gaps
description: "Find missing information that could materially affect the solution."
disable-model-invocation: true
---

# /gaps

Find missing information that could materially affect the solution.

Group gaps into:
- blocking
- important
- optional

Where possible, suggest the smallest piece of information needed to resolve each gap.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/gaps.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
