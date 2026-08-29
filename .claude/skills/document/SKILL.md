---
name: document
description: "Create documentation from the actual repository implementation and supplied requirements."
disable-model-invocation: true
---

# /document

Create documentation from the actual repository implementation and supplied requirements.

Document where relevant:
- purpose
- architecture
- workflow
- business rules
- database
- APIs
- frontend behavior
- configuration
- permissions
- errors
- testing
- deployment
- examples

Do not invent behavior. Mark assumptions clearly.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/document.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
