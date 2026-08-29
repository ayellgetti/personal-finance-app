---
name: why
description: "Explain the reasoning behind the supplied decision, behavior, or recommendation."
disable-model-invocation: true
---

# /why

Explain the reasoning behind the supplied decision, behavior, or recommendation.

- Separate observed facts from assumptions.
- Describe the important trade-offs.
- Connect the decision to the user's goal.
- Keep the explanation proportional to the question.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/why.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
