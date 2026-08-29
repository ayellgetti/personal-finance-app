---
name: ideas
description: "Generate practical ideas for the requested goal."
disable-model-invocation: true
---

# /ideas

Generate practical ideas for the requested goal.

Group them by:
- quick wins
- medium effort
- ambitious

Favor ideas that are actionable and differentiated.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/ideas.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
