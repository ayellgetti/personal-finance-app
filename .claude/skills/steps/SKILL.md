---
name: steps
description: "Turn the solution into a numbered sequence."
disable-model-invocation: true
---

# /steps

Turn the solution into a numbered sequence.

Each step should:
- be actionable
- have a clear outcome
- include commands/code when useful

Put verification after implementation steps.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/steps.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
