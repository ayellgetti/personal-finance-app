---
name: rewrite
description: "Rewrite the supplied text while preserving its meaning."
disable-model-invocation: true
---

# /rewrite

Rewrite the supplied text while preserving its meaning.

Improve:
- clarity
- grammar
- structure
- naturalness

Do not add facts or change intent unless requested.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/rewrite.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
