---
name: workflow
description: "Design or review a workflow."
disable-model-invocation: true
---

# /workflow

Design or review a workflow.

Describe:
- actors
- states
- transitions
- triggers
- validations
- permissions
- failure paths
- notifications
- audit requirements

Use a state-machine mindset where appropriate.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/workflow.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
