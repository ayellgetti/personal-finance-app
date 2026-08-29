---
name: summary
description: "Summarize the supplied material without changing its meaning."
disable-model-invocation: true
---

# /summary

Summarize the supplied material without changing its meaning.

- Preserve the main conclusion and critical context.
- Remove repetition and low-value detail.
- Keep uncertainty and caveats that affect decisions.
- Use headings or bullets only when they improve clarity.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/summary.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
