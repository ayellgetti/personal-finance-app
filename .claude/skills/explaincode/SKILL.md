---
name: explaincode
description: "Explain the supplied code using its actual execution flow and dependencies."
disable-model-invocation: true
---

# /explaincode

Explain the supplied code using its actual execution flow and dependencies.

- Start with its purpose.
- Walk through important inputs, transformations, and outputs.
- Identify side effects, error paths, and assumptions.
- Cite repository files when explaining project code.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/explaincode.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
