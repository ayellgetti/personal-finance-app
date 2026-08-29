---
name: tldr
description: "Give only the essential answer."
disable-model-invocation: true
---

# /tldr

Give only the essential answer.

- Lead with the outcome or recommendation.
- Include only details needed to act safely.
- Omit background, repetition, and optional alternatives.
- Preserve critical warnings or blockers.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/tldr.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
